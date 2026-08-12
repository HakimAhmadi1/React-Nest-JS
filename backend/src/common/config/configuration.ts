import { CookieOptions } from 'express';

/** Parses `15m` / `7d` / `900s` / `3600` into seconds. */
export function durationToSeconds(input: string): number {
  const match = /^(\d+)(ms|s|m|h|d|w|y)?$/.exec(input.trim());
  if (!match) {
    throw new Error(`Unsupported duration: "${input}"`);
  }
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const perUnit: Record<string, number> = {
    ms: 1 / 1000,
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    y: 31536000,
  };
  return Math.round(value * perUnit[unit]);
}

export const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * The refresh cookie is scoped to `/api/auth`, so it is only ever transmitted
 * to `/auth/refresh` and `/auth/logout` — not attached to every API call.
 *
 * Note `localhost:5173` and `localhost:3003` are the same *site* (SameSite is
 * computed on registrable domain, ignoring port), so local development needs
 * only `lax` + `secure: false`. A genuinely cross-domain deployment needs
 * `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`.
 */
export function refreshCookieOptions(
  env: {
    COOKIE_SECURE: string;
    COOKIE_SAMESITE: string;
    COOKIE_DOMAIN?: string;
  },
  maxAgeSeconds: number,
): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE === 'true',
    sameSite: env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/api/auth',
    maxAge: maxAgeSeconds * 1000,
  };
}
