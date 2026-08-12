import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

/**
 * Single source of truth for the TypeORM connection, shared by the runtime
 * module and the migration CLI.
 *
 * This file must live inside `src/database/` so the `__dirname` globs below
 * resolve under both `ts-node` (`src/database/…`) and `node dist/main`
 * (`dist/database/…`).
 *
 * It deliberately does NOT load dotenv: doing so at import time would pull a
 * local `.env` into the running app even in production, defeating
 * `ConfigModule`'s `ignoreEnvFile`. The migration scripts preload
 * `dotenv/config` themselves instead.
 */
// Annotated as the concrete MySQL options rather than the DataSourceOptions
// union, so spreading it in `database.module.ts` stays type-safe.
export const dataSourceOptions: MysqlConnectionOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  // Hardcoded, never env-driven: schema changes go through migrations.
  synchronize: false,
  timezone: 'Z',
  charset: 'utf8mb4',
};

export default new DataSource(dataSourceOptions);
