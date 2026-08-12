import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@common/constants/roles.config';

export const ROLES_KEY = 'roles';

/** Restricts a route (or controller) to the listed roles. Enforced by `RolesGuard`. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
