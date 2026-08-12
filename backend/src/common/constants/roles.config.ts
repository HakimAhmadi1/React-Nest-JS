export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  SUPPORT = 'SUPPORT',
  SUBSCRIBER = 'SUBSCRIBER',
}

/**
 * The single source of truth for what each role may do.
 *
 * The frontend hides UI behind these same permission strings
 * (see `frontend/src/layouts/admin/Sidebar.jsx`); `RolesGuard` enforces them
 * server-side so the two can never disagree about what is actually allowed.
 */
export const RolePermissions: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    'user.view',
    'user.create',
    'user.edit',
    'user.delete',
    'role.view',
    'role.create',
    'role.edit',
    'role.delete',
    'settings.view',
    'settings.edit',
    'audit.view',
    'upload.view',
  ],
  [UserRole.ADMIN]: [
    'user.view',
    'user.create',
    'user.edit',
    'settings.view',
    'audit.view',
    'upload.view',
  ],
  [UserRole.EDITOR]: ['user.view', 'upload.view'],
  [UserRole.SUPPORT]: ['user.view'],
  [UserRole.SUBSCRIBER]: [],
};

/** Roles allowed into the admin portal at all. */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.EDITOR,
  UserRole.SUPPORT,
];

export const permissionsForRole = (role: string | null | undefined): string[] =>
  RolePermissions[role as UserRole] ?? RolePermissions[UserRole.SUBSCRIBER];
