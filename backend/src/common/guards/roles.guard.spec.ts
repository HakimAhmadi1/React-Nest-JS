import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@common/constants/roles.config';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { ROLES_KEY } from '@common/decorators/roles.decorator';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { PayloadDto } from '@common/dto/payload.dto';

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  const contextFor = (user?: Partial<PayloadDto>): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  /** Drives `getAllAndOverride` off a plain metadata-key map. */
  const withMetadata = (metadata: Record<string, unknown>) => {
    reflector.getAllAndOverride.mockImplementation(
      (key: string) => metadata[key] as never,
    );
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('allows public routes without inspecting the user', () => {
    withMetadata({ [IS_PUBLIC_KEY]: true });
    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });

  it('allows routes that declare no roles or permissions', () => {
    withMetadata({});
    expect(guard.canActivate(contextFor({ role: UserRole.SUBSCRIBER }))).toBe(true);
  });

  it('allows a matching role', () => {
    withMetadata({ [ROLES_KEY]: [UserRole.ADMIN, UserRole.SUPER_ADMIN] });
    expect(guard.canActivate(contextFor({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('rejects a non-matching role with 403, not 401', () => {
    withMetadata({ [ROLES_KEY]: [UserRole.ADMIN] });
    expect(() => guard.canActivate(contextFor({ role: UserRole.SUBSCRIBER }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects an unauthenticated request on a guarded route', () => {
    withMetadata({ [ROLES_KEY]: [UserRole.ADMIN] });
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });

  it('requires every listed permission, not just one', () => {
    withMetadata({ [PERMISSIONS_KEY]: ['user.view', 'user.delete'] });

    const editor = contextFor({
      role: UserRole.EDITOR,
      permissions: ['user.view'],
    });
    expect(() => guard.canActivate(editor)).toThrow(ForbiddenException);

    const superAdmin = contextFor({
      role: UserRole.SUPER_ADMIN,
      permissions: ['user.view', 'user.delete'],
    });
    expect(guard.canActivate(superAdmin)).toBe(true);
  });

  it('falls back to the role table when the principal carries no permissions', () => {
    withMetadata({ [PERMISSIONS_KEY]: ['user.view'] });
    expect(guard.canActivate(contextFor({ role: UserRole.ADMIN }))).toBe(true);
    expect(() => guard.canActivate(contextFor({ role: UserRole.SUBSCRIBER }))).toThrow(
      ForbiddenException,
    );
  });
});
