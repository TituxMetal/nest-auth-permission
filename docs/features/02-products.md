# Feature Shape: Products

## Problem

The API has authentication and role-based access control but no domain models to exercise them. The
e-commerce use case needs a Product resource as the first business entity — something users can
browse and admins can manage.

## Solution (Broad Strokes)

Create a Products CRUD module following the same patterns established in the Users module:

- Prisma model for Product with standard e-commerce fields
- REST endpoints for full CRUD operations
- `@Roles(['ADMIN'])` on write operations (same pattern as Users)
- Read operations accessible to all authenticated users
- DTOs with class-validator for input validation
- Unit tests and E2E tests following existing conventions

## User Flow

1. Authenticated USER calls `GET /products` -> 200 with product list
2. Authenticated USER calls `GET /products/:id` -> 200 with product detail
3. Authenticated USER calls `POST /products` -> 403 (ADMIN only)
4. Authenticated ADMIN calls `POST /products` with valid data -> 201 with created product
5. Authenticated ADMIN calls `PATCH /products/:id` -> 200 with updated product
6. Authenticated ADMIN calls `DELETE /products/:id` -> 200 with deleted product
7. Unauthenticated call to any `/products` route -> 401

## Dependencies

**Requires:**

- Auth guards with role-based access (done — Feature #1)
- Database module with PrismaService (done)
- Common module with LoggerService (done)

**Enables:**

- Orders feature (#3) — orders reference products
- CASL integration (#3) — Products will be a CASL subject

## What Must Exist (Backend)

- **Product Prisma model** with fields: name, description, price, stock
- **Migration** for the new Product table
- **Products module** with controller, service, DTOs
- **CRUD endpoints**: GET /products, GET /products/:id, POST /products, PATCH /products/:id, DELETE
  /products/:id
- **Role restrictions**: `@Roles(['ADMIN'])` on create, update, delete
- **Input validation DTOs**: CreateProductDto, UpdateProductDto (PartialType)
- **Service** with structured logging, Prisma error handling (same patterns as UsersService)
- **Unit tests** for service and controller
- **E2E tests** covering CRUD operations, validation errors, auth/role checks
- **Seed data** for products in prisma/seed.ts

## What Must Exist (Frontend)

N/A — backend-only API project.

## Open Questions

None — this follows the exact same patterns as the Users module.

## Out of Scope

- Product categories or tags
- Image upload
- Search/filtering/pagination
- Product ownership (createdBy user) — not needed since only admins create products
- Price history or audit trail

## Risks / Gotchas

- Price storage as Float in SQLite is imprecise for currency — acceptable for a demo project, but a
  real e-commerce would use integer cents or a Decimal type
- Stock validation (preventing negative stock) should be in the service layer, not just the DTO
- The seed script needs products, which means roles must be seeded first (already the case)
