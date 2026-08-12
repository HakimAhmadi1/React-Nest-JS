import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PayloadDto } from '@common/dto/payload.dto';
import { RegisterDto } from '@common/dto/users.dto';
import {
  AccessTokenDto,
  AuthSessionDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from '@common/dto/auth.dto';
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '@common/config/configuration';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

/** Tight limit on every credential-accepting route. */
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @ApiResponse({ status: 201, type: AuthSessionDto })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionDto> {
    const user = await this.authService.register(dto);
    await this.auditLog.record(req, {
      userId: user.id,
      userName: user.name,
      action: 'register',
      module: 'auth',
      description: `User ${user.email} registered`,
    });
    return this.establishSession(user, req, res);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiResponse({ status: 200, type: AuthSessionDto })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionDto> {
    try {
      const user = await this.authService.validateCredentials(dto.email, dto.password);
      await this.auditLog.record(req, {
        userId: user.id,
        userName: user.name,
        action: 'login.success',
        module: 'auth',
        description: `${user.email} signed in`,
      });
      return await this.establishSession(user, req, res);
    } catch (error) {
      await this.auditLog.record(req, {
        action: 'login.failure',
        module: 'auth',
        description: `Failed sign-in for ${dto.email}`,
      });
      throw error;
    }
  }

  /**
   * Rotates the refresh cookie. Takes no body — the credential is the
   * httpOnly cookie, which JavaScript cannot read.
   */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiResponse({ status: 200, type: AccessTokenDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenDto> {
    const presented = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!presented) {
      throw new UnauthorizedException('No refresh token');
    }

    const result = await this.tokenService.rotate(presented, {
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });

    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiResponse({ status: 200 })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const presented = req.cookies?.[REFRESH_COOKIE_NAME];
    if (presented) {
      await this.tokenService.revokeByToken(presented);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
    return { message: 'Logged out' };
  }

  @Get('me')
  @ApiResponse({ status: 200, type: PayloadDto })
  async me(@CurrentUser() user: PayloadDto): Promise<PayloadDto> {
    const fresh = await this.authService.findById(user.userId);
    return this.tokenService.buildPrincipal(fresh);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request a password reset link',
    description:
      'Always returns the same message whether or not the address exists, and never returns the token itself.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'If that email is registered, a reset link has been sent.',
    };
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const user = await this.authService.resetPassword(dto.token, dto.password);
    await this.auditLog.record(req, {
      userId: user.id,
      userName: user.name,
      action: 'password.reset',
      module: 'auth',
      description: `Password reset completed for ${user.email}`,
    });
    return { message: 'Password reset successful' };
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() principal: PayloadDto,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(
      principal.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    await this.auditLog.record(req, {
      userId: principal.userId,
      userName: principal.name,
      action: 'password.change',
      module: 'auth',
      description: `${principal.email} changed their password`,
    });

    // All sessions were revoked; hand back a fresh one so the caller stays
    // signed in on this device.
    const user = await this.authService.findById(principal.userId);
    const tokens = await this.tokenService.issueSession(user, {
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
    this.setRefreshCookie(res, tokens.refreshToken);

    return { message: 'Password changed successfully' };
  }

  private async establishSession(
    user: Parameters<TokenService['issueSession']>[0],
    req: Request,
    res: Response,
  ): Promise<AuthSessionDto> {
    const tokens = await this.tokenService.issueSession(user, {
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
    this.setRefreshCookie(res, tokens.refreshToken);

    const principal = this.tokenService.buildPrincipal(user);
    return {
      user: principal,
      roles: principal.roles,
      permissions: principal.permissions,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE_NAME, token, this.cookieOptions());
  }

  private cookieOptions() {
    return refreshCookieOptions(
      {
        COOKIE_SECURE: this.config.get<string>('COOKIE_SECURE') ?? 'false',
        COOKIE_SAMESITE: this.config.get<string>('COOKIE_SAMESITE') ?? 'lax',
        COOKIE_DOMAIN: this.config.get<string>('COOKIE_DOMAIN'),
      },
      this.tokenService.refreshTokenTtl,
    );
  }
}
