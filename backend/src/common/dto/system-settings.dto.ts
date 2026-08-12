import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SystemSettingsDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  key: string;

  @ApiProperty({ type: String })
  value: string;

  @ApiProperty({ type: String })
  group: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export class CreateSystemSettingsDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  key: string;

  @ApiProperty({ type: String })
  @IsString()
  value: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  group?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class UpdateSystemSettingsDto extends PartialType(CreateSystemSettingsDto) {}

/**
 * Bulk upsert body. Previously an unvalidated `Record<string, string>`, which
 * let any caller write unbounded arbitrary keys; the service now additionally
 * checks each key against an allow-list.
 */
export class BulkUpdateSettingsDto {
  @ApiProperty({ type: Object, example: { appName: 'My App' } })
  @IsObject()
  settings: Record<string, string>;
}
