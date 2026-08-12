import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { FindOperator } from 'typeorm';
import { TokenService } from './token.service';
import { RefreshToken } from '@database/entities/refresh-token.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@common/constants/roles.config';

const ENV: Record<string, string> = {
  JWT_SECRET: 'x'.repeat(48),
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  JWT_ISSUER: 'test-issuer',
  JWT_AUDIENCE: 'test-audience',
};

describe('TokenService', () => {
  let service: TokenService;
  let refreshTokens: Record<string, jest.Mock>;
  let users: Record<string, jest.Mock>;

  const activeUser = {
    id: 1,
    email: 'a@example.com',
    role: UserRole.ADMIN,
    userCode: 'USR000001',
    name: 'A',
    isActive: true,
  } as User;

  beforeEach(async () => {
    refreshTokens = {
      findOne: jest.fn(),
      save: jest.fn(async (row) => row),
      create: jest.fn((dto) => dto),
      update: jest.fn(),
      delete: jest.fn(),
    };
    users = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenService,
        JwtService,
        { provide: ConfigService, useValue: { get: (k: string) => ENV[k] } },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokens },
        { provide: getRepositoryToken(User), useValue: users },
      ],
    }).compile();

    service = moduleRef.get(TokenService);
  });

  it('issues an access token carrying typ=access and pinned issuer/audience', () => {
    const token = service.issueAccessToken(activeUser);
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    expect(claims.typ).toBe('access');
    expect(claims.sub).toBe(1);
    expect(claims.role).toBe(UserRole.ADMIN);
    expect(claims.iss).toBe('test-issuer');
    expect(claims.aud).toBe('test-audience');
  });

  it('never persists the raw refresh token', async () => {
    const { refreshToken } = await service.issueSession(activeUser);
    const persisted = refreshTokens.save.mock.calls[0][0];

    expect(persisted.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(persisted.tokenHash).not.toBe(refreshToken);
  });

  it('rotates a valid token, keeping the family and revoking the old row', async () => {
    refreshTokens.findOne.mockResolvedValue({
      id: 9,
      userId: 1,
      familyId: 'fam-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    users.findOne.mockResolvedValue(activeUser);

    const result = await service.rotate('raw-token');

    expect(result.accessToken).toBeDefined();
    expect(refreshTokens.save).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: 'fam-1' }),
    );
    expect(refreshTokens.update).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });

  it('revokes the WHOLE family when an already-revoked token is replayed', async () => {
    refreshTokens.findOne.mockResolvedValue({
      id: 9,
      userId: 1,
      familyId: 'fam-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.rotate('stolen')).rejects.toThrow(UnauthorizedException);

    expect(refreshTokens.update).toHaveBeenCalledWith(
      { familyId: 'fam-1', revokedAt: expect.any(FindOperator) },
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });

  it('rejects an expired refresh token', async () => {
    refreshTokens.findOne.mockResolvedValue({
      id: 9,
      userId: 1,
      familyId: 'fam-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.rotate('old')).rejects.toThrow('Refresh token expired');
  });

  it('refuses to rotate for a deactivated user and kills the family', async () => {
    refreshTokens.findOne.mockResolvedValue({
      id: 9,
      userId: 1,
      familyId: 'fam-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    users.findOne.mockResolvedValue({ ...activeUser, isActive: false });

    await expect(service.rotate('raw')).rejects.toThrow('Account is not active');
    expect(refreshTokens.update).toHaveBeenCalledWith(
      { familyId: 'fam-1', revokedAt: expect.any(FindOperator) },
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });

  it('rejects an unknown token', async () => {
    refreshTokens.findOne.mockResolvedValue(null);
    await expect(service.rotate('nope')).rejects.toThrow('Invalid refresh token');
  });

  it('matches un-revoked rows with IS NULL, not = NULL', async () => {
    // A literal `revokedAt: null` compiles to `revoked_at = NULL`, which is
    // never true in SQL — revocation would silently update zero rows.
    await service.revokeAllForUser(1);

    const [where] = refreshTokens.update.mock.calls[0];
    expect(where.revokedAt).toBeInstanceOf(FindOperator);
    expect(where.revokedAt.type).toBe('isNull');
  });
});
