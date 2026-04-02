# NestJS Auth & Permission System — MVP Definition

## Overview

API REST NestJS demonstrating a complete authentication and authorization system, using a minimal
e-commerce domain as the application context. Target users: developers learning auth/permission
patterns with NestJS.

## Core Value

- Demonstrate session-based authentication with Better Auth
- Implement fine-grained permission-based access control with CASL
- Provide a realistic e-commerce API context (products, orders)
- Serve as a reference architecture for NestJS auth/permission projects

## MVP Scope

### MVP Core (Must Ship)

Authentication, authorization guards, CASL permissions, and a minimal e-commerce domain to exercise
them.

### MVP Full (Nice to Have)

Swagger documentation, advanced CASL features (field-level permissions, conditional rules), order
workflow (status transitions).

## MVP Core Features

### 1. Auth Guards

- [ ] Create authentication guard that validates session from Better Auth
- [ ] Extract current user from session and attach to request
- [ ] Protect routes with `@UseGuards(AuthGuard)`
- [ ] Allow public routes via `@Public()` decorator
- [ ] Return 401 for unauthenticated requests

### 2. CASL Authorization

- [ ] Define abilities per role (ADMIN, USER)
- [ ] Create CASL ability factory based on user role
- [ ] Create authorization guard that checks abilities
- [ ] Create `@CheckAbility()` decorator for route-level permissions
- [ ] Integrate with existing Users module (ADMIN-only write operations)

### 3. E-commerce Domain — Products

- [ ] Product model (name, description, price, stock, ownerId)
- [ ] Products CRUD endpoints
- [ ] Permission rules: ADMIN manages all, USER reads only
- [ ] Input validation with class-validator DTOs

### 4. E-commerce Domain — Orders

- [ ] Order model (userId, items, total, status)
- [ ] OrderItem model (orderId, productId, quantity, price)
- [ ] Orders CRUD endpoints
- [ ] Permission rules: USER manages own orders, ADMIN manages all
- [ ] Stock validation on order creation

### 5. API Documentation

- [ ] Swagger/OpenAPI setup with `@nestjs/swagger`
- [ ] Document all endpoints with decorators
- [ ] Document DTOs and response types
- [ ] Auth requirements visible in Swagger UI

## Technical Stack

| Layer         | Technology        |
| ------------- | ----------------- |
| Framework     | NestJS 11         |
| Runtime       | Bun               |
| Language      | TypeScript 5.9    |
| Database      | SQLite + Prisma 6 |
| Auth          | Better Auth 1.3   |
| Authorization | CASL 6.7          |
| Validation    | class-validator   |
| Documentation | @nestjs/swagger   |

## Build Order

1. **Auth Guards** — prerequisite for all protected routes
2. **CASL Authorization** — requires auth guards to identify the user
3. **Products** — first domain model to exercise permissions
4. **Orders** — second domain model with ownership-based permissions
5. **API Documentation** — after API surface is stable

## "Done" Criteria

- [ ] All routes are protected by default (auth guard is global)
- [ ] Public routes are explicitly marked
- [ ] CASL checks permissions on every protected mutation
- [ ] Users can only access their own orders
- [ ] Admins can manage all resources
- [ ] E2E tests cover all permission scenarios
- [ ] Swagger UI is accessible and documents all endpoints
