import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const GLOBAL_PREFIX = 'api';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.setGlobalPrefix(GLOBAL_PREFIX);

  app.use(
    helmet({
      // /uploads/* is fetched by the frontend on a different port.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // Swagger UI is inline-script heavy; helmet's default CSP blanks it out.
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(cookieParser());

  // Explicit, and ordered ahead of the router because `bodyParser: false`.
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    // Required for the httpOnly refresh cookie to be sent cross-origin.
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Full-Stack Boilerplate API')
      .setDescription('REST API for the NestJS + React boilerplate')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();

    SwaggerModule.setup(
      `${GLOBAL_PREFIX}/docs`,
      app,
      SwaggerModule.createDocument(app, config),
      { swaggerOptions: { persistAuthorization: true } },
    );
  }

  // Lets TypeORM close its pool and in-flight requests drain on SIGTERM.
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3003;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application listening on http://localhost:${port}/${GLOBAL_PREFIX}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Swagger UI at http://localhost:${port}/${GLOBAL_PREFIX}/docs`);
  }
}

/*
 * Called unconditionally. The previous version wrapped this in
 * `if (process.env.NODE_ENV !== 'production')`, so `npm run start:prod`
 * loaded the module and exited without ever listening.
 */
void bootstrap();

process.on('unhandledRejection', (reason) => {
  Logger.error(`Unhandled rejection: ${reason}`, undefined, 'Process');
});

process.on('uncaughtException', (error) => {
  // The process state is undefined after this point; exit and let the
  // supervisor restart rather than serving traffic from a broken runtime.
  Logger.error(`Uncaught exception: ${error.message}`, error.stack, 'Process');
  process.exit(1);
});
