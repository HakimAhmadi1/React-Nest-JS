import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AuditLog } from '@database/entities/audit-log.entity';
import { CreateAuditLogDto } from '@common/dto/audit-log.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    return this.auditLogs.save(this.auditLogs.create(dto));
  }

  /**
   * Records an entry with request metadata attached.
   *
   * Never throws: an audit-write failure must not fail the business operation
   * that triggered it.
   */
  async record(req: Request, dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.create({
        ...dto,
        ipAddress: dto.ipAddress ?? req.ip?.slice(0, 45) ?? null,
        userAgent: dto.userAgent ?? req.get('user-agent')?.slice(0, 255) ?? null,
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log (${dto.module}/${dto.action})`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async findAll(limit = 50, offset = 0): Promise<[AuditLog[], number]> {
    return this.auditLogs.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByUserId(
    userId: number,
    limit = 50,
    offset = 0,
  ): Promise<[AuditLog[], number]> {
    return this.auditLogs.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
