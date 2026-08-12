import {
  ClassSerializerInterceptor,
  HttpStatus,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ServerResponse } from 'http';
import { extname } from 'path';

import { validateEnv } from '@common/config/env.validation';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import { RolesGuard } from '@common/guards/roles.guard';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { UsersModule } from '@modules/users/users.module';
import { ProfileModule } from '@modules/profile/profile.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { AuditLogModule } from '@modules/audit-log/audit-log.module';
import { UploadModule } from '@modules/upload/upload.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { HealthModule } from '@modules/health/health.module';
import { MailModule } from '@modules/mail/mail.module';
import { UploadService } from '@modules/upload/upload.service';

const INLINE_SAFE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
]);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // Fails the boot on a missing/placeholder secret rather than at runtime.
      validate: validateEnv,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    ServeStaticModule.forRoot({
      rootPath: UploadService.uploadDir,
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        setHeaders: (res: ServerResponse, path: string) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          // Anything that isn't a known-safe image is downloaded, not rendered
          // in the API's own origin.
          if (!INLINE_SAFE_EXTENSIONS.has(extname(path).toLowerCase())) {
            res.setHeader('Content-Disposition', 'attachment');
          }
        },
      },
    }),

    /*
     * `skipIf` is checked before the per-route `@Throttle()` metadata, so it is
     * the only switch that can also lift the tighter limit on the auth routes.
     * That makes it exactly what the functional e2e specs need — they fire far
     * more than 5 auth requests inside the window — and exactly what must never
     * be reachable in production. Hence the NODE_ENV clause: setting
     * THROTTLE_DISABLED on a production deployment does nothing.
     * `throttling.e2e-spec.ts` runs without it and asserts the 429 still fires.
     */
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      skipIf: () =>
        process.env.NODE_ENV === 'test' && process.env.THROTTLE_DISABLED === 'true',
    }),

    DatabaseModule,
    MailModule,
    AuthModule,
    AuditLogModule,
    UsersModule,
    ProfileModule,
    SettingsModule,
    UploadModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    /*
     * Global enhancers live here, not in main.ts or feature modules, so their
     * order is explicit. Guards run in array order:
     *   ThrottlerGuard  — cheapest, and must protect /auth/login
     *   JwtAuthGuard    — populates request.user
     *   RolesGuard      — reads request.user
     */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          // The two flags that turn the DTO split into an actual defence:
          // unknown properties are rejected instead of reaching the entity.
          whitelist: true,
          forbidNonWhitelisted: true,
          transformOptions: { enableImplicitConversion: false },
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    },

    /*
     * The first-registered interceptor is OUTERMOST, so its map() runs LAST.
     * TransformInterceptor must therefore come first: otherwise
     * ClassSerializerInterceptor receives the plain {success, data} envelope,
     * which carries no @Exclude() metadata, and `password` leaks on every
     * endpoint that returns a User entity.
     */
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },

    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // '{*splat}' — Express 5 / path-to-regexp v8 rejects a bare '*'.
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
