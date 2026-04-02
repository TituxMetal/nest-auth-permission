# Feature Shape: Auth Guards

## Problem

All API routes (users CRUD) are currently unprotected — anyone can create, update, or delete users
without authentication. The auth system exists (Better Auth handles signup/signin/sessions) but no
route is gated behind it.

## Solution (Broad Strokes)

Leverage the built-in `AuthGuard` from `@thallesp/nestjs-better-auth` which is already registered as
a global guard by default. The work consists of:

- Verifying and configuring the global guard behavior
- Marking specific routes as public or role-restricted using provided decorators
- Extracting the authenticated user session in controllers where needed
- Adding E2E tests that verify protected routes reject unauthenticated requests

Key decorators already provided by the library:

- `@AllowAnonymous()` — bypass auth for specific routes
- `@Roles(['ADMIN'])` — restrict to specific roles
- `@Session` — extract user session as a parameter decorator

## User Flow

1. Unauthenticated user calls `GET /users` -> 401 Unauthorized
2. User signs up via `POST /api/auth/sign-up/email` -> session cookie set
3. Authenticated user calls `GET /users` with session cookie -> 200 OK with user list
4. Regular user calls `DELETE /users/:id` -> 403 Forbidden (admin only)
5. Admin user calls `DELETE /users/:id` -> 200 OK

## Dependencies

**Requires:**

- Better Auth integration (done — AuthModule with signup/signin)
- Session-based authentication (done — HTTP-only cookies, 7-day expiry)
- Role assignment on signup (done — SignupHook)

**Enables:**

- CASL authorization (Feature #2) — needs auth guard to identify the user first
- E-commerce domain features (#3, #4) — all routes must be protected

## What Must Exist (Backend)

- Global auth guard configured and verified (may already be active)
- Public route marking on auth endpoints (`/api/auth/*`) if not already handled
- Role-based restrictions on Users write operations (create, update, delete = ADMIN only)
- Session extraction in controllers that need the current user
- Updated E2E tests covering:
  - Unauthenticated access returns 401
  - Authenticated access succeeds
  - Role-based restrictions work (USER vs ADMIN)
  - Session decorator provides correct user data

## What Must Exist (Frontend)

N/A — backend-only API project.

## Open Questions

1. Is the global AuthGuard already active since we import AuthModule without
   `disableGlobalAuthGuard: true`? Need to verify with a test.
2. Does `@AllowAnonymous()` need to be applied to the auth routes (`/api/auth/*`), or does the
   library handle its own routes?
3. Should `GET /users` and `GET /users/:id` be accessible to all authenticated users, or ADMIN only?

## Out of Scope

- CASL ability-based permissions (Feature #2)
- Custom guard logic beyond what the library provides
- OAuth/social login
- API key authentication

## Risks / Gotchas

- The global guard might already be rejecting requests — existing E2E tests may break if they don't
  authenticate
- Auth routes (`/api/auth/*`) are handled by Better Auth middleware, not NestJS controllers — the
  guard may not apply to them
- The `@Roles()` decorator requires the user's role to be present in the session — need to verify
  Better Auth includes role data in session
- E2E test helper already exists (`test/helpers/auth.helper.ts`) but may need updates for role-based
  testing scenarios
