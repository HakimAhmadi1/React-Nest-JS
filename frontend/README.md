# Frontend — React + Vite

Admin portal and public shell for the boilerplate. React 19, Vite, TailwindCSS
v4, TanStack Query, Zustand.

## Running

```bash
npm install               # this directory is a standalone npm project
cp .env.example .env
npm run dev               # http://localhost:5173
```

The API must be running on the URL in `VITE_API_URL`, and that origin must be
listed in the backend's `ALLOWED_ORIGINS`.

## Environment

| Variable        | Required | Notes                                                                                                                 |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`  | yes      | e.g. `http://localhost:3003/api`. The app throws at startup if unset rather than silently requesting `undefined/...`. |
| `VITE_APP_NAME` | no       | fallback title before settings load                                                                                   |

## Structure

```
src/
├── components/
│   ├── common/     Navbar, Footer, ProtectedRoute, ErrorBoundary, spinner
│   └── ui/         Button, Input, Modal, Table, Badge, FormField, …
├── context/        settings provider (React Query backed)
├── hooks/          useAuth, useAuthBootstrap, useSettings, useDebouncedValue
├── layouts/        MainLayout, AccountLayout, admin/*
├── modules/admin/  dashboard, users, media, settings (lazy-loaded)
├── pages/          auth, account, home, common
├── services/       api.js — axios instance, refresh handling
├── store/          authStore (session), uiStore (sidebar/theme)
└── utils/          permissions, validation schemas, asset URLs
```

## Session handling

`store/authStore.js` is the only source of truth. There is no AuthContext.

- The access token is kept **in memory only**; the persisted slice holds just
  `user` / `roles` / `permissions` so the shell can paint immediately.
- On load, `useAuthBootstrap()` posts to `/auth/refresh`, exchanging the
  httpOnly cookie for a fresh access token.
- `services/api.js` retries a single 401 through a **single-flight** refresh, so
  N concurrent failures trigger one refresh call.
- A **403 does not sign the user out** — it means "signed in, insufficient
  role", and the UI shows a denial.
- `logout()` calls the server first so the refresh-token family is revoked.

## Permissions

`utils/permissions.js` exposes `useCanAccess`, `useHasRole` and `useIsAdmin` as
hooks so components re-render when the session changes. The permission strings
match the backend's `RolePermissions` exactly; `ProtectedRoute` accepts a
`permission` prop for route-level gating.

## Forms

`react-hook-form` + `zod`. Schemas live in `utils/validation.js` and mirror the
backend DTO rules (8+ characters, upper, lower, digit), so users see the failure
before the round-trip.

## Testing

```bash
npm test          # vitest, run once
npm run test:watch
```

## Styling

TailwindCSS v4 via `@tailwindcss/vite` — no `tailwind.config.js` and no
PostCSS config needed. The design tokens (including the `primary-*` palette and
the `.admin-table` / `.card` component classes) are defined in `src/index.css`.
