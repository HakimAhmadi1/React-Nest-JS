#!/usr/bin/env node
/**
 * `prepare` runs on every `npm install`, including production installs that pass
 * --omit=dev. husky is a devDependency, so a bare `husky` there exits 127 with
 * "command not found" and takes the whole deploy down with it.
 *
 * Git hooks are a developer-workstation concern. Skip them when husky isn't
 * installed, or when there's no git repository to attach them to (tarball or
 * CI artifact deploys) — but when husky IS present and genuinely fails, let
 * that surface instead of hiding it behind `|| true`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

try {
  require.resolve('husky');
} catch {
  console.log('husky is not installed — skipping git hooks.');
  process.exit(0);
}

if (!existsSync(join(repoRoot, '.git'))) {
  console.log('no .git directory — skipping git hooks.');
  process.exit(0);
}

const { status } = spawnSync('husky', [], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
});

process.exit(status ?? 1);
