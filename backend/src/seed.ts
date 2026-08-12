import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeederModule } from '@database/seeds/seeder.module';
import { SeederService } from '@database/seeds/seeder.service';

/**
 * Run AFTER migrations: `npm run migration:run && npm run seed`.
 */
async function run() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    await app.get(SeederService).seed();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/doesn't exist|Unknown table|no such table/i.test(message)) {
      logger.error(
        'Seeding failed because the schema is missing. Run `npm run migration:run` first.',
      );
    } else {
      logger.error(`Seeding failed: ${message}`);
    }
    await app.close();
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

void run();
