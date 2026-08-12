import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PayloadDto } from '@common/dto/payload.dto';
import { UpdateProfileDto, UserDto } from '@common/dto/users.dto';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { ProfileService } from './profile.service';

/**
 * Self-service profile only.
 *
 * The previous version of this controller exposed `GET /users` (a full dump of
 * every user to any authenticated caller), `POST /users` (which wrote the
 * password to the database in cleartext), and `PUT /users/:id` with no
 * ownership check at all. Creation now lives in `/auth/register` and
 * `/admin/users`; listing lives in `/admin/users` behind RBAC; and every route
 * here targets `req.user`, so operating on someone else's record is not
 * expressible.
 */
@Controller('users')
@ApiTags('Profile')
@ApiBearerAuth()
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('me')
  @ApiResponse({ status: 200, type: UserDto })
  async getMe(@CurrentUser() principal: PayloadDto) {
    return this.profileService.findById(principal.userId);
  }

  @Put('me')
  @ApiResponse({ status: 200, type: UserDto })
  async updateMe(
    @CurrentUser() principal: PayloadDto,
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    const user = await this.profileService.updateProfile(principal.userId, dto);
    await this.auditLog.record(req, {
      userId: principal.userId,
      userName: principal.name,
      action: 'profile.update',
      module: 'profile',
      description: `${principal.email} updated their profile`,
      metadata: { fields: Object.keys(dto) },
    });
    return user;
  }
}
