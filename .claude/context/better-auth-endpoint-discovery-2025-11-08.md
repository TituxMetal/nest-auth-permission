# Better Auth Endpoint Discovery & Hooks Solution

**Date:** 2025-11-08

**Branch:** feature/user-crud-module

**Status:** 🚨 CRITICAL ARCHITECTURAL DISCOVERY - Action Required

**Session Type:** Investigation & Analysis

---

## 🔍 Critical Discovery Summary

### The Problem We Thought We Had

- Custom `/auth/signup` endpoint for role assignment
- Better Auth `/api/auth/sign-up/email` endpoint supposedly disabled via `disabledPaths` config
- E2E tests needed for user CRUD module

### The Problem We Actually Have

**The `disabledPaths` configuration in Better Auth DOES NOT WORK with the NestJS wrapper!**

Both signup endpoints are active with different behaviors:

- `/api/auth/sign-up/email` - Sets cookies ✅, NO role assignment ❌
- `/auth/signup` - No cookies ❌, Role assignment ✅

**Security Impact:** Users can bypass role assignment by using Better Auth endpoint directly!

---

## 🎯 Root Cause Analysis

### How We Discovered This

1. Started implementing E2E tests for user CRUD module
2. Created test helpers: `test/helpers/auth.helper.ts` and `test/helpers/testDatabase.ts`
3. Auth helper used `/api/auth/sign-up/email` endpoint
4. Tests **PASSED** even though endpoint should be disabled
5. Live testing confirmed: `curl` to disabled endpoint returned **200 OK**

### Why disabledPaths Doesn't Work

**From NestJS Better Auth source code analysis:**

```javascript
// node_modules/@thallesp/nestjs-better-auth/dist/index.cjs
const handler = node.toNodeHandler(this.options.auth)
this.adapter.httpAdapter.getInstance().use(`${basePath}/*path`, (req, res) => {
  return handler(req, res)
})
```

**Request Flow:**

```text
HTTP Request → Express Middleware (Better Auth) → Response
              ↓
              Never reaches NestJS routing layer!
              ↓
           Your controllers/guards never execute
```

Better Auth routes are registered as **Express middleware** (runs before routing), not as NestJS
controllers. This means:

1. Better Auth intercepts `/api/auth/*` at middleware layer
2. `disabledPaths` config is passed to Better Auth core but ignored by NestJS wrapper
3. Your `@All('/api/auth/sign-up/email')` handler in controller never executes
4. Middleware responds before NestJS even checks routes

### Proof

**Test in AuthController:**

```typescript
@All('/api/auth/sign-up/email')
signupEmail() {
  throw new Error('Not implemented')  // Never throws!
}
```

Endpoint returns 200 OK, error never thrown → middleware intercepts request.

---

## 📊 Current State

### What Works

✅ User CRUD module fully implemented (service + controller) ✅ User CRUD unit tests (12 tests, 38
assertions) ✅ Test helpers created (auth, testDatabase) ✅ Real database E2E test infrastructure
(SQLite in /dev/shm) ✅ Custom `/auth/signup` endpoint with role assignment ✅ Better Auth
`/api/auth/sign-up/email` endpoint (unintentionally)

### What's Broken

❌ `disabledPaths: ['/sign-up/email']` config ignored ❌ Security hole: users can bypass role
assignment ❌ Two signup endpoints with inconsistent behavior ❌ No E2E tests for user CRUD
endpoints ❌ Auth helper uses "wrong" endpoint (but it works!)

### Files Created This Session

**Test Infrastructure:**

- `test/helpers/auth.helper.ts` - Creates authenticated users for E2E tests
- `test/helpers/testDatabase.ts` - Manages in-memory SQLite databases

**User CRUD Module:**

- `src/users/users.module.ts`
- `src/users/users.controller.ts` + `.spec.ts`
- `src/users/users.service.ts` + `.spec.ts`
- `src/users/dto/createUser.dto.ts`
- `src/users/dto/updateUser.dto.ts`
- `src/users/dto/updateUserRole.dto.ts`
- `src/users/types/userWithRole.type.ts`

**Modified:**

- `src/app.module.ts` - Added UsersModule
- `src/auth/auth.config.ts` - Has broken `disabledPaths` config

---

## 💡 The Solution: Better Auth Hooks

### Discovery

NestJS Better Auth supports **lifecycle hooks** that can inject custom logic into Better Auth
endpoints!

**Documentation:**

- NestJS wrapper: [GitHub Repository](https://github.com/ThallesP/nestjs-better-auth)
- Better Auth core: [Hooks Documentation](https://www.better-auth.com/docs/concepts/hooks)

### How Hooks Work

```typescript
@Hook()
@Injectable()
export class SignupRoleHook {
  constructor(private readonly prisma: PrismaService) {}

  @AfterHook('/sign-up/email') // Runs AFTER Better Auth creates user
  async assignRole(ctx: AuthHookContext) {
    const email = ctx.body?.email
    // Assign role based on email...
  }
}
```

**Lifecycle:**

```text
POST /api/auth/sign-up/email
    ↓
Better Auth creates user + account + session
    ↓
✅ Sets HTTP cookies automatically
    ↓
@AfterHook('/sign-up/email') executes
    ↓
Your custom role assignment logic
    ↓
Response with cookies + role assigned
```

### Benefits

✅ **Single endpoint:** Only `/api/auth/sign-up/email` (no duplicates)

✅ **Proper cookies:** Better Auth handles session management

✅ **Role assignment:** Hook adds custom logic

✅ **No security holes:** Can't bypass role assignment

✅ **NestJS DI:** Hooks can inject services (Prisma, Logger, Config)

✅ **Testable:** Hooks are just decorated classes

✅ **Clean architecture:** Separation of concerns

### Implementation Required

1. **Enable hooks in config:**

   ```typescript
   // src/auth/auth.config.ts
   hooks: {
   } // Add this to betterAuth config
   ```

2. **Create hook class:**

   ```typescript
   // src/auth/hooks/signupRole.hook.ts
   @Hook()
   @Injectable()
   export class SignupRoleHook {
     @AfterHook('/sign-up/email')
     async assignRole(ctx: AuthHookContext) {
       // Move role assignment logic here
     }
   }
   ```

3. **Register as provider:**

   ```typescript
   // src/auth/auth.module.ts
   providers: [NestAuthService, AuthService, SignupRoleHook]
   ```

4. **Remove custom endpoint:**
   - Delete `/auth/signup` controller method
   - Update tests to use `/api/auth/sign-up/email`

---

## 🔧 Test Infrastructure Created

### Test Database Helper (`test/helpers/testDatabase.ts`)

**Design Decisions:**

1. **Returns object instead of global state:**

   ```typescript
   export type TestDatabase = {
     prisma: PrismaClient
     dbPath: string
   }
   ```

2. **Proper cleanup order (child tables first):**

   ```typescript
   await prisma.verification.deleteMany()
   await prisma.session.deleteMany()
   await prisma.account.deleteMany()
   await prisma.user.deleteMany()
   await prisma.role.deleteMany()
   await prisma.$disconnect() // Disconnect BEFORE file deletion
   unlinkSync(dbPath)
   ```

3. **Error handling with try-catch:**

   ```typescript
   try {
     execSync('bunx --bun prisma db push', {
       stdio: 'pipe' // Capture output
     })
   } catch (error) {
     await prisma.$disconnect()
     throw new Error(`Failed to push schema: ${error.message}`)
   }
   ```

### E2E Testing Strategy

**Approach:** Real in-memory SQLite databases (not mocks)

**Why:**

- Tests full stack: HTTP → Controller → Service → Database
- Catches framework bugs (like this `disabledPaths` issue!)
- Realistic session/cookie handling
- Validates database constraints and relationships

**Performance:**

- SQLite in `/dev/shm/` (RAM disk)
- Random database names prevent collisions
- Fast execution (~1.4 seconds per test suite)

---

## 📋 Next Session Tasks

### Immediate (Next Session)

1. **Implement Better Auth hooks solution**
   - [ ] Add `hooks: {}` to `auth.config.ts`
   - [ ] Create `src/auth/hooks/signupRole.hook.ts`
   - [ ] Move role assignment logic from AuthService to hook
   - [ ] Register hook in AuthModule providers
   - [ ] Remove custom `/auth/signup` endpoint from AuthController
   - [ ] Remove AuthService.signup() method (no longer needed)
   - [ ] Update AuthService tests

2. **Update E2E infrastructure**
   - [ ] Fix auth.helper to use Better Auth endpoint
   - [ ] Verify cookies are set correctly
   - [ ] Test role assignment via hook

3. **Complete user CRUD E2E tests**
   - [ ] Create `test/users.e2e-spec.ts`
   - [ ] Test all 6 endpoints (GET all, GET one, POST, PATCH, PATCH role, DELETE)
   - [ ] Test authentication requirements
   - [ ] Test validation errors
   - [ ] Test 404 scenarios

### Short-term

1. **Refactor auth.e2e-spec.ts**
   - Currently uses mocked dependencies
   - Should use real database like users E2E tests
   - Remove custom signup endpoint tests

2. **Remove disabledPaths config**
   - Delete `disabledPaths: ['/sign-up/email']` (doesn't work)
   - Document why it was removed
   - Update context files

3. **Security audit**
   - Verify no other ways to bypass role assignment
   - Check for other Better Auth endpoints that need hooks
   - Document all active authentication endpoints

---

## 🧪 Testing Insights

### What We Learned

**1. E2E vs Unit Testing Value**

Unit tests with mocks would **never catch** this issue:

- Config "looks right" in isolation
- Mocked dependencies hide framework bugs
- Integration is where problems surface

E2E tests with real frameworks revealed:

- `disabledPaths` doesn't work
- Better Auth middleware runs before routing
- Both endpoints are active

**2. Framework Integration Complexity**

When libraries wrap other libraries:

- Original configs may not work
- Different paradigms (middleware vs decorators)
- Documentation gaps
- Need to verify behavior, not assume

**3. Test Database Strategy**

Real database advantages:

- Catches schema issues
- Tests actual queries
- Validates constraints
- Realistic transaction behavior

In-memory SQLite optimization:

- Fast: 1.4s for full test suite
- Isolated: Random DB names
- Clean: Automatic cleanup
- CI-friendly: No external dependencies

---

## 📚 Key Technical Discoveries

### 1. Better Auth Middleware Registration

```javascript
// How NestJS wrapper registers Better Auth
this.adapter.httpAdapter.getInstance().use(`${basePath}/*path`, handler)
```

This uses Express `.use()` which:

- Runs at middleware layer (before routing)
- Intercepts ALL requests to `/api/auth/*`
- Bypasses NestJS guards, controllers, decorators
- Can't be overridden by controller routes

### 2. NestJS Request Pipeline

```text
Request → Middleware → Guards → Interceptors (Before) →
Route Handler → Interceptors (After) → Exception Filters → Response
```

Better Auth intercepts at **Middleware** stage, so:

- Guards don't run for `/api/auth/*`
- Controllers never reached
- `@All()` catch-all handlers ignored

### 3. Hook Context Structure

```typescript
interface AuthHookContext {
  path: string // Current endpoint path
  body?: unknown // Request body (POST)
  query?: unknown // Query parameters
  headers: Headers // Request headers
  context: {
    // Better Auth metadata
    newSession?: Session
    user?: User
    // ... more
  }
}
```

**After signup hooks receive:**

- `ctx.body.email` - User's email
- `ctx.body.name` - User's name
- `ctx.context.user` - Created user object
- `ctx.context.newSession` - Session data

---

## 🚨 Known Issues & Limitations

### Current Issues

1. **Two active signup endpoints**
   - `/api/auth/sign-up/email` (Better Auth)
   - `/auth/signup` (Custom)
   - Different behaviors, security risk

2. **No role assignment on Better Auth endpoint**
   - Users can bypass custom logic
   - Inconsistent user state

3. **Misleading configuration**
   - `disabledPaths` looks like it works
   - No error, no warning, just silently ignored

4. **No E2E tests for users**
   - User CRUD fully implemented
   - No integration testing yet

### Framework Limitations

- **NestJS Better Auth wrapper** doesn't implement all Better Auth features
- **disabledPaths** config ignored (use hooks instead)
- **Middleware priority** can't be changed
- **Documentation gaps** around hook lifecycle

---

## 📖 References

### Documentation

- Better Auth: [Hooks Documentation](https://www.better-auth.com/docs/concepts/hooks)
- NestJS Better Auth: [GitHub Repository](https://github.com/ThallesP/nestjs-better-auth)
- Better Auth: [Configuration Options](https://www.better-auth.com/docs/reference/options)

### Related Context Files

- `better-auth-implementation-2025-11-06.md` - Original auth setup
- `user-crud-implementation-2025-11-08.md` - User module implementation
- `tdd-security-improvements-2025-11-06.md` - Security patterns

---

## 💭 Session Reflection

### What Went Well

✅ Discovered critical security issue through testing ✅ Found proper solution (hooks) instead of
workarounds ✅ Built robust E2E test infrastructure ✅ Fixed multiple test helper bugs ✅ Deep
framework investigation

### What Could Improve

⚠️ Should have tested configuration assumptions earlier ⚠️ Better Auth documentation clarity ⚠️
Framework wrapper compatibility issues

### Learning Outcomes

1. **Always test third-party configurations** - Don't assume they work
2. **E2E tests catch integration bugs** - Unit tests aren't enough
3. **Middleware runs before routing** - Order matters in request pipeline
4. **Framework wrappers may not implement all features** - Check compatibility
5. **Hooks are powerful** - Better than duplicating endpoints

---

## 🎯 Success Criteria for Next Session

**Session Complete When:**

- [ ] Hooks-based role assignment implemented
- [ ] Custom `/auth/signup` endpoint removed
- [ ] All auth tests passing with hook approach
- [ ] User CRUD E2E tests complete (6 endpoints)
- [ ] All tests passing (unit + E2E)
- [ ] Security hole closed (single signup endpoint)
- [ ] Documentation updated
- [ ] Ready to commit and merge to main

---

**Tags:** better-auth, hooks, security-discovery, e2e-testing, architectural-decision,
nestjs-integration, middleware-vs-routing, framework-bugs

**Last Updated:** 2025-11-08 **Status:** Investigation Complete - Ready for Implementation **Next
Session:** Implement hooks-based authentication
