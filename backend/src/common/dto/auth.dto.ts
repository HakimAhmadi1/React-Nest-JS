import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_MIN_LENGTH, UserDto } from './users.dto';
import { PayloadDto } from './payload.dto';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
const PASSWORD_MESSAGE =
  'password must contain at least one lowercase letter, one uppercase letter and one digit';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;
}

/**
 * The reset token travels in the body, not the URL path: path segments end up
 * in access logs, proxy logs, and `Referer` headers.
 */
export class ResetPasswordDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  token!: string;

  @ApiProperty({ type: String, minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ type: String, minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}

export class AuthSessionDto {
  @ApiProperty({ type: UserDto })
  user: PayloadDto;

  @ApiProperty({ type: [String] })
  roles: string[];

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty({ type: String })
  accessToken: string;

  @ApiProperty({ type: Number, description: 'Access token lifetime in seconds' })
  expiresIn: number;
}

export class AccessTokenDto {
  @ApiProperty({ type: String })
  accessToken: string;

  @ApiProperty({ type: Number })
  expiresIn: number;
}
