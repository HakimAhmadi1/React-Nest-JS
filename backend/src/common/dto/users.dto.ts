import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BaseDto } from './common.dto';
import { UserRole } from '@common/constants/roles.config';

export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
const PASSWORD_MESSAGE =
  'password must contain at least one lowercase letter, one uppercase letter and one digit';

/**
 * Public self-registration.
 *
 * Extends nothing, and deliberately omits `role`, `isActive`, and the
 * reset-token fields: combined with the global `whitelist` +
 * `forbidNonWhitelisted` pipe, `{"role":"SUPER_ADMIN"}` is now a 400 rather
 * than a privilege escalation.
 */
export class RegisterDto {
  @ApiProperty({ type: String, example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ type: String, example: 'john@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ type: String, example: 'Password123', minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password: string;
}

/** Admin-only user creation. `role` is accepted here, and only here. */
export class AdminCreateUserDto extends RegisterDto {
  @ApiProperty({ enum: UserRole, required: false, default: UserRole.SUBSCRIBER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ type: Boolean, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

export class AdminUpdateUserDto extends PartialType(
  OmitType(AdminCreateUserDto, ['password'] as const),
) {
  @ApiProperty({ type: String, required: false, minLength: PASSWORD_MIN_LENGTH })
  @IsOptional()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password?: string;
}

/**
 * Self-service profile edit. No `email`, `role`, `password`, or `isActive` —
 * those move through dedicated, separately-authorised routes.
 */
export class UpdateProfileDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

export class UserDto extends BaseDto {
  @ApiProperty({ type: String, example: 'USR000001' })
  userCode: string;

  @ApiProperty({ type: String, example: 'John Doe' })
  name: string;

  @ApiProperty({ type: String, example: 'john@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole })
  role: string;

  @ApiProperty({ type: String, nullable: true })
  avatar: string;

  @ApiProperty({ type: String, nullable: true })
  address: string;

  @ApiProperty({ type: String, nullable: true })
  city: string;

  @ApiProperty({ type: String, nullable: true })
  zipCode: string;

  @ApiProperty({ type: String, nullable: true })
  country: string;
}
