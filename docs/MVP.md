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

### 1. Auth Guards (done)

- [x] Global AuthGuard from `@thallesp/nestjs-better-auth`
- [x] Session enrichment with role via Better Auth additionalFields
- [x] `@Roles(['ADMIN'])` on Users write operations
- [x] `@AllowAnonymous()` on public routes
- [x] E2E tests for 401/403/200 scenarios

### 2. E-commerce Domain — Products

- [x] Product model (name, description, price, stock)
- [x] Products CRUD endpoints
- [x] Permission rules with `@Roles`: ADMIN manages all, USER reads only
- [x] Input validation with class-validator DTOs
- [x] Unit tests and E2E tests

### 3. E-commerce Domain — Orders + CASL Authorization

- [ ] Order model (userId, items, total, status)
- [ ] OrderItem model (orderId, productId, quantity, price)
- [ ] Orders CRUD endpoints
- [ ] CASL ability factory (role → permissions with ownership conditions)
- [ ] CASL guard and permission decorator
- [ ] Permission rules: USER manages own orders only, ADMIN manages all
- [ ] Stock validation on order creation
- [ ] Unit tests and E2E tests

### 4. API Documentation

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

1. ~~**Auth Guards**~~ — done
2. **Products** — first domain model, same `@Roles` pattern as Users
3. **Orders + CASL** — ownership-based permissions require CASL
4. **API Documentation** — after API surface is stable

## "Done" Criteria

- [ ] All routes are protected by default (auth guard is global)
- [ ] Public routes are explicitly marked
- [ ] CASL checks permissions on every protected mutation
- [ ] Users can only access their own orders
- [ ] Admins can manage all resources
- [ ] E2E tests cover all permission scenarios
- [ ] Swagger UI is accessible and documents all endpoints
