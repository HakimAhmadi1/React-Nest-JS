#!/usr/bin/env node
/**
 * Generates a cryptographically random JWT signing secret.
 *
 *   npm run jwtsecret            print a new secret
 *   npm run jwtsecret -- --write write it into backend/.env
 *   npm run jwtsecret -- --write --force  overwrite an existing real secret
 *
 * Plain CommonJS so it runs on bare `node` with no ts-node/build step.
 */

const { randomBytes } = require('node:crypto');
const { existsSync, readFileSync, writeFileSync, copyFileSync } = require('node:fs');
const { join } = require('node:path');

// 48 bytes → 64 base64 chars, comfortably past the 32-character minimum that
// `common/config/env.validation.ts` enforces at boot.
const SECRET_BYTES = 48;

// Values env validation rejects outright.
const PLACEHOLDERS = [
  '',
  'your_jwt_secret_key_here',
  'replace_me_with_a_long_random_secret_at_least_32_chars',
  'changeme',
  'secret',
];

const ENV_PATH = join(__dirname, '..', '.env');
const KEY = 'JWT_SECRET';

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write') || args.includes('-w');
const force = args.includes('--force') || args.includes('-f');

const secret = randomBytes(SECRET_BYTES).toString('base64');

if (!shouldWrite) {
  process.stdout.write(`${secret}\n`);
  console.error('\nAdd it to backend/.env as:');
  console.error(`  ${KEY}=${secret}`);
  console.error('\nOr write it automatically:  npm run jwtsecret -- --write');
  process.exit(0);
}

if (!existsSync(ENV_PATH)) {
  console.error('backend/.env not found. Create it first:');
  console.error('  cp backend/.env.example backend/.env');
  process.exit(1);
}

const original = readFileSync(ENV_PATH, 'utf8');
const match = original.match(new RegExp(`^${KEY}=(.*)$`, 'm'));
const current = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

// Rotating a live secret invalidates every issued access token, so require an
// explicit --force rather than doing it silently.
if (current && !PLACEHOLDERS.includes(current) && !force) {
  console.error(`${KEY} is already set to a real value in backend/.env.`);
  console.error('Rotating it signs out every current session.');
  console.error('Re-run with --force if that is what you want:');
  console.error('  npm run jwtsecret -- --write --force');
  process.exit(1);
}

// Keep a one-shot backup before touching the file.
copyFileSync(ENV_PATH, `${ENV_PATH}.bak`);

const updated = match
  ? original.replace(new RegExp(`^${KEY}=.*$`, 'm'), `${KEY}=${secret}`)
  : `${original.replace(/\n*$/, '\n')}\n${KEY}=${secret}\n`;

writeFileSync(ENV_PATH, updated, 'utf8');

console.log(`${KEY} ${match ? 'updated' : 'added'} in backend/.env`);
console.log('Previous file saved as backend/.env.bak');
if (current && !PLACEHOLDERS.includes(current)) {
  console.log('\nSecret rotated — all existing access tokens are now invalid.');
}
