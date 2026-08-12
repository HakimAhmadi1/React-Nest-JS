import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

const PLACEHOLDER_SECRETS = ['your_jwt_secret_key_here', 'changeme', 'secret'];

/** e.g. `15m`, `7d`, `900s`, `3600` */
const DURATION = /^\d+(ms|s|m|h|d|w|y)?$/;

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Transform(({ value }) => Number(value ?? 3003))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3003;

  /* ── Auth ─────────────────────────────────────────────────────────── */

  @IsString()
  @MinLength(32, {
    message:
      'JWT_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48',
  })
  @Transform(({ value }) => {
    if (PLACEHOLDER_SECRETS.includes(String(value).trim().toLowerCase())) {
      throw new Error(
        'JWT_SECRET is still the example placeholder. Set a real secret before starting the app.',
      );
    }
    return value;
  })
  JWT_SECRET: string;

  @Matches(DURATION, {
    message: 'JWT_ACCESS_EXPIRES_IN must look like "15m" or "900s"',
  })
  JWT_ACCESS_EXPIRES_IN = '15m';

  @Matches(DURATION, { message: 'JWT_REFRESH_EXPIRES_IN must look like "7d"' })
  JWT_REFRESH_EXPIRES_IN = '7d';

  @IsString()
  @IsNotEmpty()
  JWT_ISSUER = 'fullstack-boilerplate';

  @IsString()
  @IsNotEmpty()
  JWT_AUDIENCE = 'fullstack-boilerplate-client';

  /* ── Database ─────────────────────────────────────────────────────── */

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST: string;

  @Transform(({ value }) => Number(value ?? 3306))
  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT = 3306;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASS: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME: string;

  /**
   * Retired. TypeORM `synchronize` is hardcoded off and schema changes go
   * through migrations; failing loudly beats silently ignoring a variable
   * someone still believes is doing something.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value !== undefined) {
      throw new Error(
        'DATABASE_SYNC has been removed. Schema changes go through migrations: npm run migration:run',
      );
    }
    return value;
  })
  DATABASE_SYNC?: never;

  /* ── HTTP ─────────────────────────────────────────────────────────── */

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (String(value).includes('*')) {
      throw new Error(
        'ALLOWED_ORIGINS cannot contain "*" — CORS credentials mode requires explicit origins.',
      );
    }
    return value;
  })
  ALLOWED_ORIGINS: string;

  @IsString()
  @IsNotEmpty()
  APP_URL = 'http://localhost:5173';

  @IsBooleanString()
  COOKIE_SECURE = 'false';

  @IsIn(['lax', 'strict', 'none'])
  COOKIE_SAMESITE = 'lax';

  @IsOptional()
  @IsString()
  COOKIE_DOMAIN?: string;

  /* ── Mail (optional; falls back to a console transport) ───────────── */

  @IsOptional() @IsString() SMTP_HOST?: string;
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  SMTP_PORT?: number;
  @IsOptional() @IsString() SMTP_USER?: string;
  @IsOptional() @IsString() SMTP_PASS?: string;
  @IsOptional() @IsString() SMTP_FROM?: string;

  /* ── Cloudinary (optional) ────────────────────────────────────────── */

  @IsOptional() @IsString() CLOUDINARY_CLOUD_NAME?: string;
  @IsOptional() @IsString() CLOUDINARY_API_KEY?: string;
  @IsOptional() @IsString() CLOUDINARY_API_SECRET?: string;

  /* ── Seeding ──────────────────────────────────────────────────────── */

  @IsOptional() @IsString() SEED_ADMIN_EMAIL?: string;
  @IsOptional() @IsString() SEED_ADMIN_PASSWORD?: string;
}

/**
 * Fails the boot rather than letting a typo'd or missing variable become a
 * runtime mystery. Every env-name mismatch found in this codebase
 * (`SMTP_SERV`, `CORS_ALLOWED_ORIGINS`, `EMAIL_DOMAIN`) failed silently.
 */
export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
    excludeExtraneousValues: false,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: false,
  });

  if (errors.length) {
    const details = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return validated;
}
