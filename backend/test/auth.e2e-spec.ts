import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, refreshCookie, truncateAll } from './setup-e2e';

const CREDENTIALS = {
  name: 'E2E User',
  email: 'e2e-user@example.com',
  password: 'Password123',
};

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let http: () => request.Agent;

  beforeAll(async () => {
    app = await createTestApp();
    http = () => request(app.getHttpServer());
  });

  beforeEach(() => truncateAll(app));
  afterAll(() => app.close());

  /* ── Regression tests for the critical findings ─────────────────────── */

  it('does NOT accept a role during self-registration', async () => {
    const res = await http()
      .post('/api/auth/register')
      .send({ ...CREDENTIALS, role: 'SUPER_ADMIN' });

    // whitelist + forbidNonWhitelisted turns the escalation attempt into a 400.
    expect(res.status).toBe(400);
  });

  it('registers with the SUBSCRIBER role', async () => {
    const res = await http().post('/api/auth/register').send(CREDENTIALS);

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('SUBSCRIBER');
  });

  it('never returns a password field', async () => {
    await http().post('/api/auth/register').send(CREDENTIALS);
    const res = await http()
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email, password: CREDENTIALS.password });

    expect(JSON.stringify(res.body)).not.toMatch(/"password"/);
  });

  it('does NOT return the reset token from forgot-password', async () => {
    await http().post('/api/auth/register').send(CREDENTIALS);

    const res = await http()
      .post('/api/auth/forgot-password')
      .send({ email: CREDENTIALS.email });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      message: 'If that email is registered, a reset link has been sent.',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/resetToken|token/i);
  });

  it('gives an identical forgot-password response for an unknown address', async () => {
    const known = await http()
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody-at-all@example.com' });

    expect(known.status).toBe(200);
    expect(known.body.data.message).toMatch(/If that email is registered/);
  });

  it('returns 401 (not 500) for bad credentials', async () => {
    await http().post('/api/auth/register').send(CREDENTIALS);

    const res = await http()
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email, password: 'WrongPassword1' });

    expect(res.status).toBe(401);
  });

  it('rejects a password that fails the strength policy', async () => {
    const res = await http()
      .post('/api/auth/register')
      .send({ ...CREDENTIALS, password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.errors.join(' ')).toMatch(/at least 8 characters|lowercase/i);
  });

  /* ── Session lifecycle ──────────────────────────────────────────────── */

  it('runs the full register → access → refresh → logout cycle', async () => {
    const registered = await http().post('/api/auth/register').send(CREDENTIALS);
    const cookie = refreshCookie(registered.headers)!;
    const accessToken = registered.body.data.accessToken;

    expect(cookie).toContain('HttpOnly');

    const me = await http()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(CREDENTIALS.email);

    const refreshed = await http().post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeDefined();

    const rotated = refreshCookie(refreshed.headers)!;
    expect(rotated).not.toBe(cookie);

    const loggedOut = await http().post('/api/auth/logout').set('Cookie', rotated);
    expect(loggedOut.status).toBe(200);

    const afterLogout = await http().post('/api/auth/refresh').set('Cookie', rotated);
    expect(afterLogout.status).toBe(401);
  });

  it('revokes the whole family when a rotated token is replayed', async () => {
    const registered = await http().post('/api/auth/register').send(CREDENTIALS);
    const original = refreshCookie(registered.headers)!;

    const refreshed = await http().post('/api/auth/refresh').set('Cookie', original);
    const rotated = refreshCookie(refreshed.headers)!;

    // Replaying the superseded token is treated as theft.
    const replay = await http().post('/api/auth/refresh').set('Cookie', original);
    expect(replay.status).toBe(401);

    // ...and it takes the legitimate successor down with it.
    const successor = await http().post('/api/auth/refresh').set('Cookie', rotated);
    expect(successor.status).toBe(401);
  });

  it('rejects a refresh token presented as a bearer credential', async () => {
    const registered = await http().post('/api/auth/register').send(CREDENTIALS);
    const raw = refreshCookie(registered.headers)!
      .split(';')[0]
      .replace('refresh_token=', '');

    const res = await http().get('/api/auth/me').set('Authorization', `Bearer ${raw}`);

    expect(res.status).toBe(401);
  });

  it('requires authentication on /auth/me', async () => {
    expect((await http().get('/api/auth/me')).status).toBe(401);
  });

  it('no longer exposes the account-enumeration endpoint', async () => {
    const res = await http()
      .post('/api/auth/check-email')
      .send({ email: CREDENTIALS.email });

    expect(res.status).toBe(404);
  });
});
