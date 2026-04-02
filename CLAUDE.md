# NestJS Auth & Permission System

## Project Overview

A comprehensive authentication and authorization demonstration using NestJS, featuring a minimal
e-commerce API use case. Built with Better Auth for modern session-based authentication and Prisma
ORM for type-safe database operations.

**Repository:** https://github.com/TituxMetal/nest-auth-permission  
**Author:** Titux Metal (DEV)  
**License:** MIT

## Technology Stack

| Category         | Technology      | Version |
| ---------------- | --------------- | ------- |
| Framework        | NestJS          | 11.1.8  |
| Runtime          | Bun             | Latest  |
| Language         | TypeScript      | 5.9.3   |
| Database         | SQLite + Prisma | 6.18.0  |
| Auth             | Better Auth     | 1.3.34  |
| Password Hashing | Argon2          | 0.44.0  |
| Authorization    | CASL            | 6.7.3   |
| Validation       | class-validator | 0.14.2  |

## Project Structure

```
src/
├── main.ts                     # App entry, global config
├── app.module.ts               # Root module
├── auth/                       # Authentication module
│   ├── auth.module.ts
│   ├── auth.config.ts          # Better Auth config
│   └── hooks/
│       └── signup.hook.ts      # Post-signup role assignment
├── users/                      # User CRUD module
│   ├── users.module.ts
│   ├── users.controller.ts     # REST endpoints
│   ├── users.service.ts        # Business logic
│   ├── dto/                    # Validation DTOs
│   └── types/                  # TypeScript types
├── database/                   # Database module
│   ├── database.module.ts      # Global Prisma module
│   └── prisma.service.ts       # Prisma client wrapper
└── common/                     # Shared utilities
    ├── common.module.ts
    ├── logger.service.ts       # Secure logging
    └── filters/
        └── httpException.filter.ts

test/
├── *.e2e-spec.ts              # E2E tests
└── helpers/
    ├── testDatabase.ts        # Test DB setup
    └── auth.helper.ts         # Auth test utilities
```

## Core Modules

### Auth Module (`src/auth/`)

- Better Auth integration via `@thallesp/nestjs-better-auth`
- Argon2 password hashing
- Session-based authentication (7-day expiry)
- Post-signup hook for automatic role assignment
- Admin detection via `ADMIN_EMAIL` env variable

### Users Module (`src/users/`)

- Full CRUD operations with role management
- Endpoints: `GET/POST /users`, `GET/PATCH/DELETE /users/:id`, `PATCH /users/:id/role`
- Transaction-based user creation (user + account + role)
- Prisma error handling (P2002 duplicate, P2025 not found)

### Database Module (`src/database/`)

- Global module with PrismaService
- Automatic connection lifecycle management
- Query logging enabled

### Common Module (`src/common/`)

- LoggerService with automatic sensitive data redaction
- HttpExceptionFilter for consistent error responses

## Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified Boolean   @default(false)
  roleId        String?
  role          Role?     @relation(...)
  sessions      Session[]
  accounts      Account[]
}

model Role {
  id          String @id @default(cuid())
  name        String @unique  // USER, ADMIN
  description String?
  users       User[]
}

model Session { ... }   // Better Auth sessions
model Account { ... }   // Credentials storage
model Verification { ... }  // Email verification tokens
```

## API Endpoints

### Authentication (Better Auth)

- `POST /api/auth/sign-up/email` - Register (email, password, name)
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Current session

### User Management

- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `PATCH /users/:id/role` - Update role
- `DELETE /users/:id` - Delete user

## Authentication Flow

1. **Signup:** Better Auth validates -> Argon2 hash -> Create User/Account/Session -> Signup hook
   assigns role
2. **Login:** Validate credentials -> Create session -> Set HTTP-only cookie
3. **Role Assignment:** Email matches `ADMIN_EMAIL` -> ADMIN role, otherwise USER role

## Development Commands

```bash
bun install              # Install dependencies
bun run dev              # Start dev server (hot reload)
bun test                 # Run unit tests
bun test:e2e             # Run E2E tests
bun run lint:check       # Check linting
bun run format:check     # Check formatting
bun run typecheck        # TypeScript check
bunx prisma db push      # Sync schema to DB
bunx prisma studio       # Open Prisma Studio
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="[base64-secret]"
BETTER_AUTH_BASE_URL="http://localhost:3000/api/auth"
SESSION_SECRET="[uuid-secret]"
ADMIN_EMAIL="admin@example.com"
```

## Testing Strategy

### Unit Tests (`src/**/*.spec.ts`)

- Mocked dependencies
- Focus on business logic
- Files: `users.service.spec.ts`, `users.controller.spec.ts`, `signup.hook.spec.ts`,
  `logger.service.spec.ts`

### E2E Tests (`test/*.e2e-spec.ts`)

- In-memory SQLite databases
- Full request/response cycle
- Auth helper for authenticated requests
- Files: `auth.e2e-spec.ts`, `users.e2e-spec.ts`, `app.e2e-spec.ts`

## Key Architectural Decisions

1. **Better Auth over custom auth** - Industry-standard, secure, well-maintained
2. **Prisma ORM** - Type-safe queries, migration management, generated types
3. **Simple RBAC** - Direct roleId on User, extensible for CASL integration
4. **Secure logging** - Automatic redaction of password, token, secret, key fields
5. **Global exception filter** - Consistent error responses, appropriate log levels
6. **Transaction-based operations** - Atomic user creation with related entities

## Code Conventions

- **Path aliases:** `~/*` -> `src/*`, `@generated` -> Prisma client
- **DTOs:** class-validator decorators, PartialType for updates
- **Services:** Business logic, Prisma interactions, error handling
- **Controllers:** Thin layer, delegate to services
- **Logging:** Structured JSON context, action names

## Security Features

- Argon2 password hashing (PHC winner)
- HTTP-only session cookies
- Helmet security headers
- Global validation pipe (whitelist mode)
- Sensitive data redaction in logs
- CORS configuration

## Current State

**Branch:** develop  
**Recent commits:**

- `adda061` - Complete users E2E tests, migrate to Better Auth hooks
- `d000a74` - Add Better Auth endpoint discovery and user CRUD notes
- `aa5c6b4` - Implement user CRUD module with Argon2 password hashing
- `e247177` - Remove demo code, simplify app module
- `d517717` - Disable Better Auth direct signup endpoint

## Pending/Future Work

- [ ] CASL authorization guards implementation
- [ ] Permission-based access control
- [ ] E-commerce domain models (products, orders)
- [ ] API authentication guards
- [ ] Swagger/OpenAPI documentation
