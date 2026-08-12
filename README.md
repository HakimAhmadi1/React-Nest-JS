# Full-Stack Boilerplate — NestJS + React

A starting point for new projects: JWT authentication with rotating refresh
tokens, role-based access control enforced on the server, an admin portal, and
CI that actually runs the tests.

**Stack:** NestJS 11 · TypeORM (MySQL) · React 19 · Vite · TailwindCSS v4 ·
TanStack Query · Zustand

---

## Quick start

`backend/` and `frontend/` are **independent npm projects**. Each has its own
`package.json`, lock file and `node_modules`, and each is installed, built,
run and deployed on its own. There is no workspace root and no command that
drives both — open two terminals.

**Terminal 1 — API**

```bash
cd backend
npm install
cp .env.example .env

# Set a real JWT secret — the API refuses to boot with the placeholder
npm run jwtsecret -- --write   # omit --write to just print one

npm run migration:run          # create the schema
npm run seed                   # starter data
npm run start:dev
```

**Terminal 2 — web app**

```bash
cd frontend
npm install
cp .env.example .env
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

All run from `backend/`:

```bash
npm run migration:generate -- src/database/migrations/AddSomething
npm run migration:run
npm run migration:revert
npm run seed                 # idempotent; safe to re-run
```

---

## Commands

There is no repo-root command that drives both apps. Run each from its own
directory.

**`backend/`**

| Command                 | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm run start:dev`     | NestJS in watch mode                       |
| `npm run build`         | Production build to `dist/`                |
| `npm run start:prod`    | Run the production build                   |
| `npm run lint`          | Lint                                       |
| `npm test`              | Unit tests                                 |
| `npm run test:e2e`      | E2E tests (needs a **throwaway** database) |
| `npm run migration:run` | Apply migrations                           |
| `npm run seed`          | Seed starter data                          |
| `npm run jwtsecret`     | Generate a JWT signing secret              |

**`frontend/`**

| Command           | Description                 |
| ----------------- | --------------------------- |
| `npm run dev`     | Vite dev server             |
| `npm run build`   | Production build to `dist/` |
| `npm run lint`    | Lint                        |
| `npm test`        | Unit tests                  |
| `npm run preview` | Serve the production build  |

**Repo root** — no `package.json`, no `node_modules`, no build tooling. The only
thing that spans both apps is `docker-compose.yml`, run with `docker compose`
directly. Lint and format are enforced per app and in CI.

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
- **Tooling:** two independent npm projects — separate lock files, separate
  `node_modules`, separate deploys, nothing shared at the repo root. Each app
  carries its own ESLint 9 flat config, Prettier and tests, and CI runs lint,
  format check, unit tests, migrations, e2e tests and a Docker build for each
  app on its own.

## Not included (deliberately)

No i18n, caching layer, job queue, or WebSockets — add them when a project
needs them rather than carrying unused dependencies.

## License

MIT — see [LICENSE](LICENSE).
