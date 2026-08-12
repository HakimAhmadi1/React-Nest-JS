import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Response-only shape. Deliberately carries no class-validator decorators:
 * it must never be usable as a request body, or `isActive` becomes writable
 * by anyone who can reach an endpoint that binds a DTO extending it.
 */
export class BaseDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

/** Clamped pagination. Unbounded/negative `limit` used to reach MySQL directly. */
export class PaginationQueryDto {
  @ApiProperty({ type: Number, required: false, default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @ApiProperty({ type: Number, required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class PaginatedDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: Number })
  total: number;
}
