# Full-Stack Boilerplate — NestJS + React

A starting point for new projects: JWT authentication with rotating refresh
tokens, role-based access control enforced on the server, an admin portal, and
CI that actually runs the tests.

**Stack:** NestJS 11 · TypeORM (MySQL) · React 19 · Vite · TailwindCSS v4 ·
TanStack Query · Zustand

---

## Quick start

```bash
# 1. Install (npm workspaces — installs both apps)
npm install

# 2. Configure
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Set a real JWT secret — the API refuses to boot with the placeholder
npm run jwtsecret -- --write   # writes it straight into backend/.env
# (omit --write to just print one)

# 4. Create the schema, then the starter data
npm run migration:run
npm run seed

# 5. Run both apps
npm run dev
```

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:5173            |
| API      | http://localhost:3003/api        |
| Swagger  | http://localhost:3003/api/docs   |
| Health   | http://localhost:3003/api/health |

Default admin from the seeder: `admin@example.com` / `Admin@123`
(override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`; the seeder refuses to
use the default password when `NODE_ENV=production`).

### Docker

```bash
cp .env.example .env      # set JWT_SECRET — compose fails fast without it
docker compose up --build
```

Brings up MySQL, the API (which runs migrations on start), and the frontend
behind nginx. The database healthcheck gates the API, and uploads live in a
named volume so they survive a rebuild.

---

## Authentication

Short-lived access token in memory, long-lived rotating refresh token in an
httpOnly cookie.

```
POST /api/auth/register   → { user, roles, permissions, accessToken } + refresh cookie
POST /api/auth/login      → same
POST /api/auth/refresh    → { accessToken }, rotates the cookie
POST /api/auth/logout     → revokes the refresh-token family, clears the cookie
GET  /api/auth/me         → the current principal
```

- Access tokens last 15 minutes and are never persisted to storage, so an XSS
  bug cannot exfiltrate a long-lived credential.
- Refresh tokens are stored only as a SHA-256 hash and grouped into a
  _family_. Presenting an already-rotated token is treated as theft: the entire
  family is revoked immediately.
- Deactivating, deleting, or changing the password of an account revokes all of
  its refresh tokens.
- `POST /api/auth/forgot-password` always returns the same message whether or
  not the address exists, and never returns the token itself.

### Roles and permissions

`backend/src/common/constants/roles.config.ts` is the single source of truth.
`RolesGuard` enforces `@Roles(...)` and `@RequirePermissions(...)` on the
server; the frontend hides UI using the _same_ permission strings, so the two
cannot drift.

| Role          | Permissions                                             |
| ------------- | ------------------------------------------------------- |
| `SUPER_ADMIN` | everything, including `user.delete` and `settings.edit` |
| `ADMIN`       | view/create/edit users, view settings and audit logs    |
| `EDITOR`      | view users, view uploads                                |
| `SUPPORT`     | view users                                              |
| `SUBSCRIBER`  | none (default for self-registration)                    |

Insufficient permissions return **403**, never 401 — the frontend keeps the
session alive and shows a denial instead of signing the user out.

---

## Project layout

```
backend/src/
├── common/      config (+ env validation), constants, decorators, dto,
│                filters, guards, helpers, interceptors, middlewares
├── database/    data-source, entities, migrations, seeds
└── modules/     auth, users, profile, settings, audit-log,
                 upload, mail, dashboard, health

frontend/src/
├── components/  common/ and ui/ primitives
├── context/     settings provider
├── hooks/       useAuth, useSettings, useDebouncedValue
├── layouts/     public shell, account, admin
├── modules/     admin pages (lazy-loaded)
├── pages/       auth, account, home, common
├── services/    axios client with refresh handling
├── store/       Zustand auth + UI stores
└── utils/       permissions, validation schemas, asset URLs
```

Path aliases: `@common/*`, `@database/*`, `@modules/*` (backend) and `@/*`
(frontend). The backend rewrites aliases at build time with `tsc-alias`, so
`node dist/main` runs with no runtime resolver.

---

## Database

Schema changes go through migrations — `synchronize` is hardcoded off.

```bash
npm run migration:generate -- backend/src/database/migrations/AddSomething
npm run migration:run
npm run migration:revert
npm run seed                 # idempotent; safe to re-run
```

---

## Commands

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Run both apps                        |
| `npm run build`         | Production build of both apps        |
| `npm run lint`          | Lint both apps                       |
| `npm test`              | Unit tests for both apps             |
| `npm run test:e2e`      | Backend e2e tests (needs a database) |
| `npm run migration:run` | Apply migrations                     |
| `npm run seed`          | Seed starter data                    |
| `npm run jwtsecret`     | Generate a JWT signing secret        |
| `npm run docker:up`     | Start the full stack in Docker       |

A `Makefile` wraps the same targets if you prefer `make dev`, `make test`, etc.

---

## What's included

- **Security:** helmet, rate limiting (5 req/min on auth routes), CORS with an
  explicit origin allow-list, `whitelist` + `forbidNonWhitelisted` validation,
  bcrypt (cost 12), JWT algorithm/issuer/audience pinning, upload magic-byte
  checks, and audit logging that is actually written to.
- **API:** standardized `{ success, statusCode, message, data }` envelope, a
  global exception filter that never leaks stack traces or SQL, Swagger (dev
  only), and `/health/live` + `/health/ready`.
- **Frontend:** route-level code splitting, `react-hook-form` + `zod`
  validation mirroring the backend DTO rules, TanStack Query, accessible
  dialogs and menus, and a real 404 page.
- **Tooling:** npm workspaces, shared Prettier, ESLint 9 flat config on both
  sides, husky + lint-staged, Dependabot, and CI that runs lint, format check,
  unit tests, migrations, e2e tests, and Docker builds.

## Not included (deliberately)

No i18n, caching layer, job queue, or WebSockets — add them when a project
needs them rather than carrying unused dependencies.

## License

MIT — see [LICENSE](LICENSE).
