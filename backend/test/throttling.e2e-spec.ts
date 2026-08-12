import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, truncateAll } from './setup-e2e';

/**
 * The other e2e specs run with throttling skipped so their auth traffic isn't
 * mistaken for an attack. This one keeps it on, so the guard that protects
 * /auth/login stays covered rather than being disabled everywhere at once.
 */
describe('Rate limiting (e2e)', () => {
  let app: INestApplication;
  let http: () => request.Agent;

  beforeAll(async () => {
    app = await createTestApp({ throttle: true });
    http = () => request(app.getHttpServer());
  });

  beforeEach(() => truncateAll(app));
  afterAll(() => app.close());

  it('throttles repeated login attempts on the auth routes', async () => {
    const attempt = () =>
      http()
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'WrongPassword123' });

    const statuses: number[] = [];
    // The auth routes allow 5/minute; the 6th must be rejected by the guard.
    for (let i = 0; i < 8; i += 1) {
      statuses.push((await attempt()).status);
    }

    expect(statuses).toContain(429);
    // Everything before the limit is a normal auth failure, not a server error.
    expect(statuses.slice(0, 5).every((status) => status === 401)).toBe(true);
  });

  it('does not throttle unauthenticated health checks', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      statuses.push((await http().get('/api/health/live')).status);
    }

    expect(statuses.every((status) => status === 200)).toBe(true);
  });
});
