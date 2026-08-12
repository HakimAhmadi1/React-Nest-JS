import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Requires every listed permission (see `RolePermissions`).
 *
 * These are the same strings the frontend uses to hide buttons, so enforcing
 * them here keeps the client's view and the server's rules in sync.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
