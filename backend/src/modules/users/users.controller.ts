import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '@common/decorators/roles.decorator';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/constants/roles.config';
import { PayloadDto } from '@common/dto/payload.dto';
import { PaginationQueryDto } from '@common/dto/common.dto';
import { AdminCreateUserDto, AdminUpdateUserDto, UserDto } from '@common/dto/users.dto';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { UsersService } from './users.service';

@Controller('admin/users')
@ApiTags('Admin - Users')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.SUPPORT)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  @RequirePermissions('user.view')
  @ApiResponse({ status: 200, type: [UserDto] })
  async getAll(@Query() query: PaginationQueryDto) {
    const [data, total] = await this.usersService.findAll(
      query.limit,
      query.offset,
      query.search,
    );
    return { data, total };
  }

  /*
   * Declared BEFORE `:id`. Express matches in registration order, so with the
   * previous ordering this route was shadowed by `@Get(':id')` and its
   * ParseIntPipe rejected the literal string with a 400 every time.
   */
  @Get('check-availability')
  @RequirePermissions('user.view')
  @ApiResponse({ status: 200, type: Boolean })
  async checkAvailability(
    @Query('email') email: string,
    @Query('excludeId') excludeId?: string,
  ): Promise<{ available: boolean }> {
    const available = await this.usersService.checkAvailability(
      email,
      excludeId !== undefined ? Number(excludeId) : undefined,
    );
    return { available };
  }

  @Get('stats')
  @RequirePermissions('user.view')
  async stats() {
    return this.usersService.stats();
  }

  @Get(':id')
  @RequirePermissions('user.view')
  @ApiResponse({ status: 200, type: UserDto })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    // No `user.password = ''` scrubbing needed: ClassSerializerInterceptor
    // strips @Exclude()d fields, and it now runs inside TransformInterceptor
    // so it still sees the raw entity.
    return this.usersService.findOne(id);
  }

  @Get(':id/logs')
  @RequirePermissions('audit.view')
  async getLogs(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    const [data, total] = await this.auditLog.findByUserId(
      id,
      query.limit,
      query.offset,
    );
    return { data, total };
  }

  @Post()
  @RequirePermissions('user.create')
  @ApiResponse({ status: 201, type: UserDto })
  async create(
    @Body() dto: AdminCreateUserDto,
    @CurrentUser() actor: PayloadDto,
    @Req() req: Request,
  ) {
    const user = await this.usersService.create(dto, actor);
    await this.auditLog.record(req, {
      userId: actor.userId,
      userName: actor.name,
      action: 'user.create',
      module: 'admin/users',
      description: `Created user ${user.email}`,
      metadata: { targetUserId: user.id, role: user.role },
    });
    return user;
  }

  @Put(':id')
  @RequirePermissions('user.edit')
  @ApiResponse({ status: 200, type: UserDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() actor: PayloadDto,
    @Req() req: Request,
  ) {
    const user = await this.usersService.update(id, dto, actor);
    await this.auditLog.record(req, {
      userId: actor.userId,
      userName: actor.name,
      action: 'user.update',
      module: 'admin/users',
      description: `Updated user ${user.email}`,
      metadata: { targetUserId: user.id, fields: Object.keys(dto) },
    });
    return user;
  }

  // Deletion is SUPER_ADMIN-only, matching `RolePermissions`.
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions('user.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: PayloadDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.usersService.remove(id, actor);
    await this.auditLog.record(req, {
      userId: actor.userId,
      userName: actor.name,
      action: 'user.delete',
      module: 'admin/users',
      description: `Deleted user #${id}`,
      metadata: { targetUserId: id },
    });
  }
}
