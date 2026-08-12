import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

/**
 * Boots the real AppModule — global pipes, guards, interceptors and filter
 * included — so the e2e suite exercises the actual request pipeline rather
 * than a stripped-down stand-in.
 *
 * Requires a reachable MySQL with the schema migrated. CI provides one via a
 * `mysql:8` service container; see .github/workflows/ci.yml.
 */
export async function createTestApp(
  options: { throttle?: boolean } = {},
): Promise<INestApplication> {
  /*
   * Functional specs exercise many auth requests in quick succession, which the
   * 5-per-minute limit on those routes would otherwise turn into a wall of 429s
   * that looks like a product failure. Rate limiting is not skipped silently:
   * throttling.e2e-spec.ts passes `{ throttle: true }` and asserts it fires.
   */
  process.env.THROTTLE_DISABLED = options.throttle ? 'false' : 'true';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  await app.init();
  return app;
}

/** Empties the tables between suites, respecting FK order. */
export async function truncateAll(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['refresh_tokens', 'audit_logs', 'users']) {
    await dataSource.query(`TRUNCATE TABLE \`${table}\``);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

/** Pulls the refresh cookie out of a Set-Cookie header list. */
export function refreshCookie(headers: Record<string, unknown>): string | undefined {
  const raw = headers['set-cookie'] as string[] | undefined;
  return raw?.find((cookie) => cookie.startsWith('refresh_token='));
}
