import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { UserRole } from '@common/constants/roles.config';
import { PaginationQueryDto } from '@common/dto/common.dto';
import { AuditLogDto } from '@common/dto/audit-log.dto';
import { AuditLogService } from './audit-log.service';

@ApiTags('System - Audit Logs')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@RequirePermissions('audit.view')
@Controller('system/audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiResponse({ status: 200, type: [AuditLogDto] })
  async findAll(@Query() query: PaginationQueryDto) {
    const [data, total] = await this.auditLogService.findAll(query.limit, query.offset);
    return { data, total };
  }

  // `@Param`, not `@Query` — the previous version read a query string on a
  // path-parameter route, so this endpoint always returned 400.
  @Get('user/:userId')
  @ApiResponse({ status: 200, type: [AuditLogDto] })
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: PaginationQueryDto,
  ) {
    const [data, total] = await this.auditLogService.findByUserId(
      userId,
      query.limit,
      query.offset,
    );
    return { data, total };
  }
}
