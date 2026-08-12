import { ApiProperty } from '@nestjs/swagger';

export class AuditLogDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number, nullable: true })
  userId: number | null;

  @ApiProperty({ type: String, nullable: true })
  userName: string | null;

  @ApiProperty({ type: String })
  action: string;

  @ApiProperty({ type: String })
  module: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Object, nullable: true })
  metadata: unknown | null;

  @ApiProperty({ type: String, nullable: true })
  ipAddress: string | null;

  @ApiProperty({ type: String, nullable: true })
  userAgent: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;
}

export class CreateAuditLogDto {
  userId?: number | null;
  userName?: string | null;
  action: string;
  module: string;
  description?: string | null;
  metadata?: unknown | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}
