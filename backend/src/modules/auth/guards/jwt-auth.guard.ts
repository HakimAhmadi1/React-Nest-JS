import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { PayloadDto } from '@common/dto/payload.dto';
import { permissionsForRole } from '@common/constants/roles.config';
import { AccessTokenClaims } from '../token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let claims: AccessTokenClaims;
    try {
      // Pinning the algorithm blocks `alg: none` and HS/RS confusion attacks;
      // pinning issuer/audience stops tokens minted for another service.
      claims = await this.jwtService.verifyAsync<AccessTokenClaims>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
        algorithms: ['HS256'],
        issuer: this.config.get<string>('JWT_ISSUER'),
        audience: this.config.get<string>('JWT_AUDIENCE'),
      });
    } catch (error) {
      this.logger.debug(`Token verification failed: ${error?.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // A refresh token must never be usable as a bearer credential.
    if (claims.typ !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    /*
     * Built from claims rather than a per-request database read. Staleness is
     * bounded by the short access-token TTL, and deactivating or deleting a
     * user revokes their refresh tokens, so they cannot renew past it.
     */
    const principal: PayloadDto = {
      userId: Number(claims.sub),
      userCode: claims.code,
      email: claims.email,
      name: claims.name,
      role: claims.role,
      isActive: true,
      roles: [claims.role],
      permissions: permissionsForRole(claims.role),
    };

    (request as Request & { user: PayloadDto }).user = principal;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
