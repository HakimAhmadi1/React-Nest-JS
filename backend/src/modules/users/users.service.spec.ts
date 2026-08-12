import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@database/entities/user.entity';
import { TokenService } from '@modules/auth/token.service';
import { UserRole } from '@common/constants/roles.config';
import { PayloadDto } from '@common/dto/payload.dto';

const actor = (role: UserRole, userId = 99): PayloadDto =>
  ({ userId, role, name: 'Actor', email: 'actor@example.com' }) as PayloadDto;

describe('UsersService', () => {
  let service: UsersService;
  let users: Record<string, jest.Mock>;
  let tokens: { revokeAllForUser: jest.Mock };

  const target = () =>
    ({
      id: 5,
      name: 'Target',
      email: 'target@example.com',
      role: UserRole.SUBSCRIBER,
      isActive: true,
      password: 'existing-hash',
    }) as User;

  beforeEach(async () => {
    users = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(async (u) => u),
      create: jest.fn((dto) => dto),
      update: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
    };
    tokens = { revokeAllForUser: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: TokenService, useValue: tokens },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('update', () => {
    it('ignores fields outside the allow-list', async () => {
      users.findOne.mockResolvedValue(target());

      await service.update(
        5,
        {
          name: 'Renamed',
          // None of these are mutable; the old Object.assign(user, dto) wrote
          // every one of them straight through to the entity.
          id: 1,
          userCode: 'HACKED',
          resetPasswordToken: 'planted',
          deletedAt: null,
        } as never,
        actor(UserRole.ADMIN),
      );

      const saved = users.save.mock.calls[0][0];
      expect(saved.name).toBe('Renamed');
      expect(saved.id).toBe(5);
      expect(saved.userCode).toBeUndefined();
      expect(saved.resetPasswordToken).toBeUndefined();
    });

    it('stops a non-SUPER_ADMIN from granting SUPER_ADMIN', async () => {
      users.findOne.mockResolvedValue(target());

      await expect(
        service.update(5, { role: UserRole.SUPER_ADMIN }, actor(UserRole.ADMIN)),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a SUPER_ADMIN to grant SUPER_ADMIN', async () => {
      users.findOne.mockResolvedValue(target());

      await expect(
        service.update(5, { role: UserRole.SUPER_ADMIN }, actor(UserRole.SUPER_ADMIN)),
      ).resolves.toBeDefined();
    });

    it('stops an admin changing their own role', async () => {
      users.findOne.mockResolvedValue({ ...target(), id: 99 });

      await expect(
        service.update(99, { role: UserRole.ADMIN }, actor(UserRole.SUPER_ADMIN, 99)),
      ).rejects.toThrow('You cannot change your own role');
    });

    it('stops self-deactivation', async () => {
      users.findOne.mockResolvedValue({ ...target(), id: 99 });

      await expect(
        service.update(99, { isActive: false }, actor(UserRole.SUPER_ADMIN, 99)),
      ).rejects.toThrow('You cannot deactivate your own account');
    });

    it('revokes sessions when an account is deactivated', async () => {
      users.findOne.mockResolvedValue(target());

      await service.update(5, { isActive: false }, actor(UserRole.SUPER_ADMIN));

      expect(tokens.revokeAllForUser).toHaveBeenCalledWith(5);
    });
  });

  describe('remove', () => {
    it('soft-deletes and revokes the target’s sessions', async () => {
      users.findOne.mockResolvedValue(target());

      await service.remove(5, actor(UserRole.SUPER_ADMIN));

      expect(users.softDelete).toHaveBeenCalledWith(5);
      expect(tokens.revokeAllForUser).toHaveBeenCalledWith(5);
    });

    it('stops self-deletion', async () => {
      await expect(service.remove(99, actor(UserRole.SUPER_ADMIN, 99))).rejects.toThrow(
        'You cannot delete your own account',
      );
    });
  });
});
