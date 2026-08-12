import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { ROLES_KEY } from '@common/decorators/roles.decorator';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { PayloadDto } from '@common/dto/payload.dto';
import { UserRole, permissionsForRole } from '@common/constants/roles.config';

/**
 * Enforces `@Roles()` and `@RequirePermissions()`.
 *
 * Depends only on `Reflector`, and must be registered AFTER `JwtAuthGuard` in
 * the providers array so `request.user` is already populated.
 *
 * Always throws 403, never 401: "authenticated but not allowed" is a different
 * condition from "not authenticated", and the frontend keys its session
 * handling off that distinction.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      targets,
    );
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      targets,
    );

    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as PayloadDto | undefined;

    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (requiredRoles?.length && !requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (requiredPermissions?.length) {
      const granted = user.permissions?.length
        ? user.permissions
        : permissionsForRole(user.role);

      const missing = requiredPermissions.filter((p) => !granted.includes(p));
      if (missing.length) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
