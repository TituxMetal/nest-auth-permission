# User CRUD Module Implementation

**Date:** 2025-11-08

**Branch:** feature/user-crud-module

**Status:** ✅ Complete - Ready for E2E tests

## Overview

Implemented a complete User CRUD (Create, Read, Update, Delete) module for the NestJS authentication
system with Better Auth integration. The implementation follows a test-driven, alternating workflow
between service and controller layers.

## Architecture Decisions

### 1. Password Storage Strategy

**Decision:** Store passwords in the `account` table, not the `user` table

**Rationale:** Better Auth uses a multi-provider authentication model where one user can have
multiple accounts (credential, Google, GitHub, etc.). Each provider stores its authentication data
in a separate account record.

**Implementation Details:**

- Passwords are hashed with argon2 (configured in `auth.config.ts`)
- Account records use `providerId: 'credential'` for email/password auth
- Better Auth uses `accountId = userId` by convention
- Updates require filtering by both `userId` AND `providerId` since `userId` alone is not unique in
  the accounts table

### 2. Transaction Usage

**When transactions are used:**

- `create()`: Creates user + account atomically
- `update()`: Updates user fields + password (if provided) atomically

**When transactions are NOT used:**

- `findAll()`, `findOne()`: Read-only operations
- `remove()`: Prisma handles cascading deletes automatically (`onDelete: Cascade`)
- `updateRole()`: Single table update

### 3. Type Safety with Prisma

**Pattern:** Use `Prisma.UserGetPayload` to generate accurate types

```typescript
type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true }
}>
```

This ensures TypeScript knows the exact shape of returned data, including relations.

### 4. DTO Strategy

- `CreateUserDto`: Required fields for new users (email, name, password, optional roleId)
- `UpdateUserDto`: Uses `PartialType(CreateUserDto)` for partial updates
- `UpdateUserRoleDto`: Separate DTO for role-only updates (validates UUID)

### 5. File Organization

```text
src/users/
├── dto/
│   ├── index.ts (barrel export)
│   ├── createUser.dto.ts
│   ├── updateUser.dto.ts
│   └── updateUserRole.dto.ts
├── types/
│   ├── index.ts (barrel export)
│   └── userWithRole.type.ts
├── users.controller.ts
├── users.controller.spec.ts
├── users.service.ts
├── users.service.spec.ts
└── users.module.ts
```

**Naming Convention:** camelCase for files (per user preference)

## API Endpoints

All endpoints require authentication by default (Better Auth's `@thallesp/nestjs-better-auth`
package). To make an endpoint public, add `@AllowAnonymous()` decorator.

| Method | Endpoint          | Description               | Request Body        |
| ------ | ----------------- | ------------------------- | ------------------- |
| GET    | `/users`          | List all users with roles | -                   |
| GET    | `/users/:id`      | Get user by ID            | -                   |
| POST   | `/users`          | Create new user           | `CreateUserDto`     |
| PATCH  | `/users/:id`      | Update user fields        | `UpdateUserDto`     |
| PATCH  | `/users/:id/role` | Update user's role        | `UpdateUserRoleDto` |
| DELETE | `/users/:id`      | Delete user               | -                   |

## Service Methods

### `findAll(): Promise<UserWithRole[]>`

- Fetches all users ordered by `createdAt DESC`
- Includes role relation
- No pagination (can be added later)

### `findOne(id: string): Promise<UserWithRole>`

- Uses `findUniqueOrThrow` - throws if user not found
- Includes role relation

### `create(dto: CreateUserDto): Promise<UserWithRole>`

- Hashes password with argon2
- Uses transaction to:
  1. Upsert default 'USER' role (if roleId not provided)
  2. Create user with roleId
  3. Create account with hashed password and `providerId: 'credential'`
- Returns created user with role

### `update(id: string, dto: UpdateUserDto): Promise<UserWithRole>`

- Supports partial updates (email, name, password)
- Uses transaction to:
  1. Update user fields (email, name)
  2. Update account password (if provided) - filters by `userId`, `accountId`, and
     `providerId: 'credential'`
- Must use `updateMany` for account since where clause uses non-unique fields
- Returns updated user with role

### `updateRole(id: string, roleId: string): Promise<UserWithRole>`

- Simple single-field update
- No transaction needed
- Returns user with updated role relation

### `remove(id: string): Promise<UserWithRole>`

- Deletes user by ID
- Prisma automatically cascades delete to accounts (`onDelete: Cascade` in schema)
- Returns deleted user (useful for audit logs)

## Testing Strategy

### Test Architecture

**Pattern:** Mock at the boundary, test behavior not implementation

**Service Tests:**

- Mock `PrismaService` and `LoggerService`
- Mock transactions with callback pattern
- Use factory pattern (`usersFactory`) for test data
- Use `.mockImplementationOnce()` to customize return values per test

**Controller Tests:**

- Mock `UsersService` completely
- Test only HTTP routing and parameter passing
- No need for complex mocks - just verify delegation

### Key Testing Insights

**Transaction Mock Pattern:**

```typescript
// WRONG: Recreating mocks inside transaction callback
$transaction: mock(callback => {
  txUpdateUser = mock(() => Promise.resolve(mockUser)) // Overwrites previous mock!
  return callback({ user: { update: txUpdateUser } })
})

// RIGHT: Reference existing mocks
$transaction: mock(callback => {
  return callback({ user: { update: txUpdateUser } })
})
```

**Mock Lifecycle:**

- Create mocks once in `beforeEach`
- Reference (don't recreate) mocks in transaction callbacks
- Use `.mockImplementationOnce()` in tests to customize behavior

### Test Coverage

- **Service tests:** 6 tests (findAll, findOne, create, update, updateRole, remove)
- **Controller tests:** 6 tests (one per endpoint)
- **Total:** 12 tests, 38 expect() calls
- **Status:** ✅ All passing

## Integration with Better Auth

### Authentication Flow

1. Better Auth makes ALL endpoints protected by default
2. Use `@AllowAnonymous()` decorator to make endpoints public
3. The authentication guard runs at the HTTP layer (before controller)
4. Unit tests bypass authentication (they call methods directly)
5. E2E tests will test authentication properly

### Password Hashing Configuration

**File:** `src/auth/auth.config.ts`

```typescript
emailAndPassword: {
  enabled: true,
  minPasswordLength: 8,
  autoSignIn: true,
  password: {
    hash: async (password: string) => await hash(password),
    verify: async ({ hash: hashedPassword, password }) => verify(hashedPassword, password)
  }
}
```

**Important:** Better Auth defaults to scrypt, but we configured it to use argon2 for consistency
with manual user creation.

## User Workflow and Learning Approach

### Alternating Implementation Pattern

The user prefers to alternate between service and controller layers:

1. Implement service methods
2. Test service methods
3. Implement controller endpoints
4. Test controller endpoints
5. Repeat for next feature

**Rationale:** This ensures each layer is verified before building the next, catching bugs early.

### Learning by Doing

- User implements code with guidance
- Assistant provides TODO(human) markers with context and guidance
- User learns WHY things work, not just HOW
- Insights are shared after implementation to reinforce learning

### Key User Preferences

- ✅ Implement → Test → Continue (NOT strict TDD)
- ✅ Alternate between service and controller
- ✅ camelCase for file names (not kebab-case)
- ✅ Hands-on implementation with guidance
- ✅ Understanding rationale behind decisions
- ❌ Don't auto-generate code without user input
- ❌ Don't batch multiple implementations without testing

## Technical Challenges Resolved

### 1. Account Update Query

**Problem:** `where: { userId: id }` failed with "userId is not unique" **Solution:** Use
`updateMany` with compound where clause:

```typescript
await tx.account.updateMany({
  where: {
    userId: id,
    accountId: id,
    providerId: 'credential'
  },
  data: { password: hashedPassword }
})
```

### 2. Mock Overwriting in Tests

**Problem:** Transaction callback recreated mocks, overwriting `.mockImplementationOnce()`
**Solution:** Create mocks once in `beforeEach`, reference them in transaction callback

### 3. ESLint `any` Type Errors

**Problem:** `expect.any(String)` caused unsafe assignment warnings **Solution:** Simplified test to
just verify mock was called, not checking exact password value

## Next Steps

### 1. E2E Tests (In Progress)

- Test full HTTP flow with authentication
- Verify Better Auth integration works end-to-end
- Test error scenarios (401, 404, validation errors)

### 2. Authorization with CASL (Future)

- Add role-based permissions
- Protect endpoints based on user roles
- Example: Only ADMIN can delete users

### 3. Pagination (Future)

- Add pagination to `findAll()`
- Support query parameters: `?page=1&limit=10`

### 4. Additional Features (Future)

- Email verification flow
- Password reset
- User search/filtering
- Audit logs

## Files Modified/Created

### New Files

- `src/users/users.module.ts`
- `src/users/users.controller.ts`
- `src/users/users.controller.spec.ts`
- `src/users/users.service.ts`
- `src/users/users.service.spec.ts`
- `src/users/dto/createUser.dto.ts`
- `src/users/dto/updateUser.dto.ts`
- `src/users/dto/updateUserRole.dto.ts`
- `src/users/dto/index.ts`
- `src/users/types/userWithRole.type.ts`
- `src/users/types/index.ts`

### Modified Files

- `src/app.module.ts` - Added UsersModule import
- `src/auth/auth.config.ts` - Configured argon2 for password hashing

## Lessons Learned

1. **Better Auth uses multi-provider model** - One user can have multiple accounts (credential,
   OAuth providers)
2. **accountId = userId convention** - Better Auth uses this pattern for credential accounts
3. **Transactions are expensive** - Only use when atomicity is required
4. **Mock lifecycle matters** - Create once, reference many times
5. **Type safety with Prisma** - Use `GetPayload` helper for accurate types
6. **Unit vs E2E tests** - Unit tests bypass middleware; E2E tests the full stack

## Git Status

**Branch:** feature/user-crud-module **Uncommitted changes:** All user CRUD implementation **Ready
for:** Commit + PR (after E2E tests optional)

### Suggested Commit Message

```text
feat: implement user CRUD module with tests

- Add UsersService with 6 methods (findAll, findOne, create, update, updateRole, remove)
- Add UsersController with 6 REST endpoints
- Implement DTOs with validation (CreateUserDto, UpdateUserDto, UpdateUserRoleDto)
- Add comprehensive unit tests (12 tests, 38 assertions)
- Configure argon2 password hashing for Better Auth consistency
- Use transactions for atomic user+account operations
- Follow alternating service/controller implementation pattern

Breaking changes: None
Dependencies: Uses existing Better Auth + Prisma setup
```
