import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../src/database/entities/user.entity';
import { UserRole } from '../src/common/constants/roles.config';
import { hashPassword } from '../src/common/helpers/password.helper';
import { createTestApp, truncateAll } from './setup-e2e';

describe('Admin users (e2e)', () => {
  let app: INestApplication;
  let http: () => request.Agent;

  beforeAll(async () => {
    app = await createTestApp();
    http = () => request(app.getHttpServer());
  });

  beforeEach(() => truncateAll(app));
  afterAll(() => app.close());

  /** Creates a user directly and signs in as them. */
  async function signInAs(role: UserRole, email: string): Promise<string> {
    const repo = app.get(DataSource).getRepository(User);
    const user = await repo.save(
      repo.create({
        name: role,
        email,
        password: await hashPassword('Password123'),
        role,
        isActive: true,
      }),
    );
    await repo.update(user.id, {
      userCode: `USR${String(user.id).padStart(6, '0')}`,
    });

    const res = await http()
      .post('/api/auth/login')
      .send({ email, password: 'Password123' });

    return res.body.data.accessToken;
  }

  it('denies a SUBSCRIBER access to the admin user list', async () => {
    const token = await signInAs(UserRole.SUBSCRIBER, 'sub@example.com');

    const res = await http()
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    // 403, not 401: they are authenticated, just not authorised.
    expect(res.status).toBe(403);
  });

  it('allows an ADMIN to list users', async () => {
    const token = await signInAs(UserRole.ADMIN, 'admin@example.com');

    const res = await http()
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // The envelope the frontend's table reads.
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('total');
  });

  it('rejects anonymous access outright', async () => {
    expect((await http().get('/api/admin/users')).status).toBe(401);
  });

  it('reaches check-availability instead of matching /:id', async () => {
    const token = await signInAs(UserRole.ADMIN, 'admin@example.com');

    const res = await http()
      .get('/api/admin/users/check-availability?email=free@example.com')
      .set('Authorization', `Bearer ${token}`);

    // Previously always 400: /:id was registered first and ParseIntPipe
    // rejected the literal string.
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(true);
  });

  it('clamps pagination instead of passing it through to MySQL', async () => {
    const token = await signInAs(UserRole.ADMIN, 'admin@example.com');

    const negative = await http()
      .get('/api/admin/users?limit=-1')
      .set('Authorization', `Bearer ${token}`);
    expect(negative.status).toBe(400);

    const huge = await http()
      .get('/api/admin/users?limit=999999')
      .set('Authorization', `Bearer ${token}`);
    expect(huge.status).toBe(400);
  });

  it('stops an ADMIN from creating a SUPER_ADMIN', async () => {
    const token = await signInAs(UserRole.ADMIN, 'admin@example.com');

    const res = await http()
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Escalated',
        email: 'escalated@example.com',
        password: 'Password123',
        role: 'SUPER_ADMIN',
      });

    expect(res.status).toBe(403);
  });

  it('restricts deletion to SUPER_ADMIN', async () => {
    const adminToken = await signInAs(UserRole.ADMIN, 'admin@example.com');

    const created = await http()
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Victim',
        email: 'victim@example.com',
        password: 'Password123',
      });

    const res = await http()
      .delete(`/api/admin/users/${created.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });

  it('rejects unknown body properties', async () => {
    const token = await signInAs(UserRole.SUPER_ADMIN, 'super@example.com');

    const res = await http()
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'X',
        email: 'x@example.com',
        password: 'Password123',
        resetPasswordToken: 'planted',
      });

    expect(res.status).toBe(400);
  });

  it('keeps /users/me scoped to the caller', async () => {
    const token = await signInAs(UserRole.SUBSCRIBER, 'sub@example.com');

    const me = await http()
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('sub@example.com');

    // The routes that let any authenticated caller read or write any user.
    expect(
      (await http().get('/api/users').set('Authorization', `Bearer ${token}`)).status,
    ).toBe(404);
    expect(
      (
        await http()
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'a', email: 'b@example.com', password: 'Password123' })
      ).status,
    ).toBe(404);
  });

  it('keeps the public settings endpoint limited to safe keys', async () => {
    const res = await http().get('/api/system/settings');

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('mfaRequired');
    expect(res.body.data).not.toHaveProperty('sessionTimeout');
  });
});
