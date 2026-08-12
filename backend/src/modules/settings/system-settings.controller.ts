import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/constants/roles.config';
import { PayloadDto } from '@common/dto/payload.dto';
import {
  BulkUpdateSettingsDto,
  CreateSystemSettingsDto,
  SystemSettingsDto,
  UpdateSystemSettingsDto,
} from '@common/dto/system-settings.dto';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('System - Settings')
@ApiBearerAuth()
@Controller('system/settings')
export class SystemSettingsController {
  constructor(
    private readonly settingsService: SystemSettingsService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Public, because the frontend renders branding before anyone signs in —
   * but filtered to a safe allow-list rather than returning every row.
   */
  @Public()
  @Get()
  @ApiResponse({ status: 200 })
  async findAllPublic() {
    return this.settingsService.toMap(await this.settingsService.findPublic());
  }

  @Get('all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('settings.view')
  @ApiResponse({ status: 200 })
  async findAll() {
    return this.settingsService.toMap(await this.settingsService.findAll());
  }

  @Get(':key')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('settings.view')
  @ApiResponse({ status: 200, type: SystemSettingsDto })
  async findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('settings.edit')
  @ApiResponse({ status: 201, type: SystemSettingsDto })
  async create(@Body() dto: CreateSystemSettingsDto) {
    return this.settingsService.create(dto);
  }

  @Put()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('settings.edit')
  @ApiResponse({ status: 200 })
  async updateBulk(
    @Body() dto: BulkUpdateSettingsDto,
    @CurrentUser() actor: PayloadDto,
    @Req() req: Request,
  ) {
    const result = await this.settingsService.upsertBulk(dto.settings);
    await this.auditLog.record(req, {
      userId: actor.userId,
      userName: actor.name,
      action: 'settings.update',
      module: 'settings',
      description: 'Updated system settings',
      metadata: { keys: Object.keys(dto.settings) },
    });
    return result;
  }

  @Put(':key')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('settings.edit')
  @ApiResponse({ status: 200, type: SystemSettingsDto })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingsDto,
    @CurrentUser() actor: PayloadDto,
    @Req() req: Request,
  ) {
    const result = await this.settingsService.update(key, dto);
    await this.auditLog.record(req, {
      userId: actor.userId,
      userName: actor.name,
      action: 'settings.update',
      module: 'settings',
      description: `Updated setting "${key}"`,
    });
    return result;
  }
}
