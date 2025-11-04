# NestJS Authentication & Authorization Demo

A comprehensive demonstration of authentication and authorization systems using NestJS, featuring a
minimal e-commerce API as the use case.

## 📋 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [🛠 Technology Stack](#-technology-stack)
- [🏗 Architecture Overview](#-architecture-overview)
- [🗄 Database Schema Design](#-database-schema-design)
- [🔌 API Endpoints Structure](#-api-endpoints-structure)
- [🔐 Authentication Flow](#-authentication-flow)
- [🛡 Authorization Rules (CASL)](#-authorization-rules-casl)
- [📅 Implementation Phases](#-implementation-phases)
- [🧪 Testing Strategy](#-testing-strategy)
- [🚀 Getting Started](#-getting-started)

---

## 🎯 Project Overview

This project demonstrates enterprise-grade authentication and authorization patterns in a NestJS
application. It uses a minimal e-commerce API as a practical use case to showcase:

- **User authentication** with session management
- **Role-based access control (RBAC)** with three distinct roles
- **Attribute-based access control (ABAC)** for resource ownership
- **Secure API design** with proper permission boundaries

### Core Features

1. **Authentication System** - User registration, login, and session management via Better Auth
2. **User Management** - CRUD operations for users, profiles, and settings with role assignment
3. **Product Management** - Products and categories with hierarchical relationships
4. **Comments System** - User-generated content with ownership-based permissions
5. **Simulated Purchase Flow** - Order creation without real payment processing

### User Roles

- **Admin**: Full system access, can manage all resources and promote users
- **Product Manager**: Can manage products and categories
- **User**: Can browse products, manage own profile, comment, and create orders

---

## 🛠 Technology Stack

### Core Framework

- **NestJS** (v11.x) - Progressive Node.js framework
- **TypeScript** (v5.x) - Type-safe development
- **Bun** - Fast package manager and runtime

### Authentication

- [**Better Auth**](https://www.better-auth.com/) - Modern authentication library
  - Session-based authentication
  - Password hashing with Argon2
  - CSRF protection
  - Secure cookie handling

### Database

- **Prisma ORM** (v5.x) - Type-safe database client
- **SQLite** - Lightweight embedded database (easy for demo purposes)

### Authorization

- [**CASL**](https://casl.js.org/) (v6.x) - Isomorphic authorization library
  - Define abilities per role
  - Attribute-based conditions
  - Integration with NestJS guards

### Additional Libraries

- **class-validator** - DTO validation
- **class-transformer** - Object transformation
- **@nestjs/config** - Configuration management
- **argon2** - Password hashing with Argon2

---

## 🏗 Architecture Overview

### Layered Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (Controllers, Guards, Interceptors, Pipes, DTOs)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Business Layer                          │
│         (Services, Domain Logic, CASL Abilities)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│              (Prisma Client, Repositories)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Database (SQLite)                       │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```text
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
│
├── auth/                            # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts           # Login, register, logout endpoints
│   ├── auth.service.ts              # Better Auth integration
│   ├── guards/
│   │   └── auth.guard.ts            # Session validation guard
│   ├── decorators/
│   │   └── current-user.decorator.ts # Extract user from request
│   └── dto/
│       ├── register.dto.ts
│       └── login.dto.ts
│
├── casl/                            # Authorization module
│   ├── casl.module.ts
│   ├── casl-ability.factory.ts      # Define abilities per role
│   ├── guards/
│   │   └── policies.guard.ts        # Check permissions
│   ├── decorators/
│   │   └── check-policies.decorator.ts
│   └── interfaces/
│       └── policy-handler.interface.ts
│
├── users/                           # User management module
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       └── assign-role.dto.ts
│
├── profiles/                        # User profiles module
│   ├── profiles.module.ts
│   ├── profiles.controller.ts
│   ├── profiles.service.ts
│   ├── entities/
│   │   └── profile.entity.ts
│   └── dto/
│       ├── create-profile.dto.ts
│       └── update-profile.dto.ts
│
├── settings/                        # User settings module
│   ├── settings.module.ts
│   ├── settings.controller.ts
│   ├── settings.service.ts
│   ├── entities/
│   │   └── settings.entity.ts
│   └── dto/
│       └── update-settings.dto.ts
│
├── products/                        # Products module
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── entities/
│   │   └── product.entity.ts
│   └── dto/
│       ├── create-product.dto.ts
│       └── update-product.dto.ts
│
├── categories/                      # Categories module
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   ├── entities/
│   │   └── category.entity.ts
│   └── dto/
│       ├── create-category.dto.ts
│       └── update-category.dto.ts
│
├── comments/                        # Comments module
│   ├── comments.module.ts
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   ├── entities/
│   │   └── comment.entity.ts
│   └── dto/
│       ├── create-comment.dto.ts
│       └── update-comment.dto.ts
│
├── orders/                          # Orders module
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── entities/
│   │   ├── order.entity.ts
│   │   └── order-item.entity.ts
│   └── dto/
│       └── create-order.dto.ts
│
├── prisma/                          # Prisma module
│   ├── prisma.module.ts
│   └── prisma.service.ts            # Prisma client wrapper
│
└── common/                          # Shared utilities
    ├── enums/
    │   └── role.enum.ts
    ├── interfaces/
    └── filters/
        └── http-exception.filter.ts
```

---

## 🗄 Database Schema Design

### Prisma Schema (`prisma/schema.prisma`)

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================
// Authentication & User Management
// ============================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashed by Better Auth
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  profile  Profile?
  settings Settings?
  comments Comment[]
  orders   Order[]
  sessions Session[]

  @@map("users")
}

enum Role {
  ADMIN
  PRODUCT_MANAGER
  USER
}

model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  firstName String?
  lastName  String?
  phone     String?
  address   String?
  city      String?
  country   String?
  zipCode   String?
  avatar    String?
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model Settings {
  id                    String   @id @default(uuid())
  userId                String   @unique
  emailNotifications    Boolean  @default(true)
  smsNotifications      Boolean  @default(false)
  newsletter            Boolean  @default(false)
  theme                 String   @default("light")
  language              String   @default("en")
  timezone              String   @default("UTC")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("settings")
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// ============================================
// E-commerce Domain
// ============================================

model Category {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  description String?
  imageUrl    String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  products Product[]

  @@map("categories")
}

model Product {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  price       Float
  stock       Int       @default(0)
  imageUrl    String?
  isActive    Boolean   @default(true)
  categoryId  String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  category   Category     @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  comments   Comment[]
  orderItems OrderItem[]

  @@map("products")
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  rating    Int?     // Optional rating 1-5
  productId String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("comments")
}

model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique
  userId          String
  status          OrderStatus @default(PENDING)
  totalAmount     Float
  shippingAddress String
  billingAddress  String
  paymentMethod   String      @default("FAKE_CARD") // Simulated payment
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  user       User        @relation(fields: [userId], references: [id], onDelete: Restrict)
  orderItems OrderItem[]

  @@map("orders")
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  price     Float    // Price at time of order
  createdAt DateTime @default(now())

  // Relations
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@map("order_items")
}
```

### Database Relationships

```text
User (1) ──────── (1) Profile
User (1) ──────── (1) Settings
User (1) ──────── (N) Comment
User (1) ──────── (N) Order
User (1) ──────── (N) Session

Category (1) ──── (N) Product
Product (1) ────── (N) Comment
Product (1) ────── (N) OrderItem

Order (1) ──────── (N) OrderItem
```

---

## 🔌 API Endpoints Structure

### Authentication Endpoints

```http
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login user
POST   /api/auth/logout            # Logout user
GET    /api/auth/me                # Get current user session
POST   /api/auth/refresh           # Refresh session token
```

### User Management Endpoints

```http
GET    /api/users                  # List all users (Admin only)
GET    /api/users/:id              # Get user by ID (Admin only)
POST   /api/users                  # Create user (Admin only)
PATCH  /api/users/:id              # Update user (Admin only)
DELETE /api/users/:id              # Delete user (Admin only)
PATCH  /api/users/:id/role         # Assign role (Admin only)
PATCH  /api/users/:id/activate     # Activate user (Admin only)
PATCH  /api/users/:id/deactivate   # Deactivate user (Admin only)
```

### Profile Endpoints

```http
GET    /api/profiles/me            # Get own profile
PATCH  /api/profiles/me            # Update own profile
GET    /api/profiles/:userId       # Get user profile (Admin only)
PATCH  /api/profiles/:userId       # Update user profile (Admin only)
```

### Settings Endpoints

```http
GET    /api/settings/me            # Get own settings
PATCH  /api/settings/me            # Update own settings
GET    /api/settings/:userId       # Get user settings (Admin only)
PATCH  /api/settings/:userId       # Update user settings (Admin only)
```

### Category Endpoints

```http
GET    /api/categories             # List all categories (Public)
GET    /api/categories/:id         # Get category by ID (Public)
POST   /api/categories             # Create category (Admin, Product Manager)
PATCH  /api/categories/:id         # Update category (Admin, Product Manager)
DELETE /api/categories/:id         # Delete category (Admin, Product Manager)
```

### Product Endpoints

```http
GET    /api/products               # List all products (Public)
GET    /api/products/:id           # Get product by ID (Public)
GET    /api/products/category/:categoryId  # Get products by category (Public)
POST   /api/products               # Create product (Admin, Product Manager)
PATCH  /api/products/:id           # Update product (Admin, Product Manager)
DELETE /api/products/:id           # Delete product (Admin, Product Manager)
```

### Comment Endpoints

```http
GET    /api/comments/product/:productId    # Get comments for product (Public)
POST   /api/comments               # Create comment (Authenticated users)
PATCH  /api/comments/:id           # Update own comment (Owner only)
DELETE /api/comments/:id           # Delete own comment (Owner or Admin)
```

### Order Endpoints

```http
GET    /api/orders                 # List own orders (User) or all orders (Admin)
GET    /api/orders/:id             # Get order by ID (Owner or Admin)
POST   /api/orders                 # Create order (Authenticated users)
PATCH  /api/orders/:id/status      # Update order status (Admin only)
DELETE /api/orders/:id             # Cancel order (Owner within time limit, or Admin)
```

---

## 🔐 Authentication Flow

### Registration Flow

```text
1. User submits registration form (email, password)
   ↓
2. AuthController receives request
   ↓
3. Validate DTO (email format, password strength)
   ↓
4. AuthService checks if email already exists
   ↓
5. Better Auth hashes password with Argon2
   ↓
6. Create User record in database (role: USER by default)
   ↓
7. Create empty Profile and Settings records
   ↓
8. Return success response (without auto-login)
```

### Login Flow

```text
1. User submits login credentials (email, password)
   ↓
2. AuthController receives request
   ↓
3. Validate DTO
   ↓
4. AuthService verifies credentials via Better Auth
   ↓
5. Better Auth validates password hash using Argon2
   ↓
6. Create session token and store in Session table
   ↓
7. Set secure HTTP-only cookie with session token
   ↓
8. Return user data (without password)
```

### Session Validation Flow

```text
1. Request arrives with session cookie
   ↓
2. AuthGuard intercepts request
   ↓
3. Extract session token from cookie
   ↓
4. Validate token against Session table
   ↓
5. Check if session is expired
   ↓
6. Load User data from database
   ↓
7. Attach user object to request
   ↓
8. Proceed to route handler
```

### Logout Flow

```text
1. User requests logout
   ↓
2. AuthController receives request
   ↓
3. Extract session token from cookie
   ↓
4. Delete session from Session table
   ↓
5. Clear session cookie
   ↓
6. Return success response
```

### Security Measures

- **Password Hashing**: Argon2 (winner of Password Hashing Competition, handled by Better Auth)
- **Session Tokens**: Cryptographically secure random tokens
- **HTTP-Only Cookies**: Prevent XSS attacks
- **CSRF Protection**: Token validation for state-changing operations
- **Session Expiration**: Configurable timeout (e.g., 7 days)
- **Secure Flag**: HTTPS-only cookies in production

---

## 🛡 Authorization Rules (CASL)

### CASL Ability Definition

CASL uses a subject-based permission system. We define abilities using the `can` and `cannot`
methods.

### Actions

```typescript
type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete'
// 'manage' is a special action that represents any action
```

### Subjects

```typescript
type Subjects =
  | 'User'
  | 'Profile'
  | 'Settings'
  | 'Category'
  | 'Product'
  | 'Comment'
  | 'Order'
  | 'all'
// 'all' represents any subject
```

### Permission Matrix

| Role                | Subject  | Actions                      | Conditions                                                     |
| ------------------- | -------- | ---------------------------- | -------------------------------------------------------------- |
| **ADMIN**           | all      | manage                       | None (full access)                                             |
| **PRODUCT_MANAGER** | Category | create, read, update, delete | None                                                           |
| **PRODUCT_MANAGER** | Product  | create, read, update, delete | None                                                           |
| **PRODUCT_MANAGER** | User     | read                         | None                                                           |
| **PRODUCT_MANAGER** | Profile  | read                         | None                                                           |
| **PRODUCT_MANAGER** | Comment  | read                         | None                                                           |
| **PRODUCT_MANAGER** | Order    | read                         | None                                                           |
| **USER**            | Category | read                         | None                                                           |
| **USER**            | Product  | read                         | None                                                           |
| **USER**            | Profile  | read, update                 | userId === currentUser.id                                      |
| **USER**            | Settings | read, update                 | userId === currentUser.id                                      |
| **USER**            | Comment  | create                       | None                                                           |
| **USER**            | Comment  | read                         | None                                                           |
| **USER**            | Comment  | update, delete               | comment.userId === currentUser.id                              |
| **USER**            | Order    | create                       | order.userId === currentUser.id                                |
| **USER**            | Order    | read                         | order.userId === currentUser.id                                |
| **USER**            | Order    | delete                       | order.userId === currentUser.id AND order.status === 'PENDING' |

### CASL Ability Factory Implementation

```typescript
// casl/casl-ability.factory.ts

import { AbilityBuilder, PureAbility } from '@casl/ability'
import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { Role } from '../common/enums/role.enum'

type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete'
type Subjects =
  | 'User'
  | 'Profile'
  | 'Settings'
  | 'Category'
  | 'Product'
  | 'Comment'
  | 'Order'
  | 'all'

export type AppAbility = PureAbility<[Actions, Subjects]>

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(PureAbility)

    // Define abilities based on role using strategy pattern
    const abilityDefiners: Record<Role, (builder: typeof can, userId: string) => void> = {
      [Role.ADMIN]: this.defineAdminAbilities,
      [Role.PRODUCT_MANAGER]: this.defineProductManagerAbilities,
      [Role.USER]: this.defineUserAbilities
    }

    const defineAbilities = abilityDefiners[user.role]
    if (defineAbilities) {
      defineAbilities(can, user.id)
    }

    return build()
  }

  private defineAdminAbilities(can: AbilityBuilder<AppAbility>['can']): void {
    // Admin has full access to all resources
    can('manage', 'all')
  }

  private defineProductManagerAbilities(can: AbilityBuilder<AppAbility>['can']): void {
    // Product Manager can manage products and categories
    can(['create', 'read', 'update', 'delete'], ['Category', 'Product'])

    // Product Manager can view other resources
    can('read', ['User', 'Profile', 'Comment', 'Order'])
  }

  private defineUserAbilities(can: AbilityBuilder<AppAbility>['can'], userId: string): void {
    // Regular users can read public resources
    can('read', ['Category', 'Product', 'Comment'])

    // Users can manage their own profile and settings
    can(['read', 'update'], 'Profile', { userId })
    can(['read', 'update'], 'Settings', { userId })

    // Users can create comments and manage their own
    can('create', 'Comment')
    can(['update', 'delete'], 'Comment', { userId })

    // Users can create and manage their own orders
    can('create', 'Order', { userId })
    can('read', 'Order', { userId })
    can('delete', 'Order', { userId, status: 'PENDING' })
  }
}
```

### Policy Guards Usage

```typescript
// Example: Protecting a route with CASL

@Controller('products')
export class ProductsController {
  @Get()
  @Public() // No authentication required
  findAll() {
    // Anyone can read products
  }

  @Post()
  @UseGuards(AuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('create', 'Product'))
  create(@Body() createProductDto: CreateProductDto) {
    // Only Admin and Product Manager can create
  }

  @Patch(':id')
  @UseGuards(AuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('update', 'Product'))
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    // Only Admin and Product Manager can update
  }
}
```

### Attribute-Based Access Control (ABAC) Example

```typescript
// Example: User can only update their own comment

@Patch(':id')
@UseGuards(AuthGuard, PoliciesGuard)
@CheckPolicies(new UpdateCommentPolicyHandler())
async update(
  @Param('id') id: string,
  @Body() updateCommentDto: UpdateCommentDto,
  @CurrentUser() user: User,
) {
  const comment = await this.commentsService.findOne(id);

  // PoliciesGuard will check: ability.can('update', comment)
  // This will pass only if comment.userId === user.id

  return this.commentsService.update(id, updateCommentDto);
}

// Policy Handler
export class UpdateCommentPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, comment: Comment) {
    return ability.can('update', 'Comment', comment);
  }
}
```

---

## 📅 Implementation Phases

### Phase 1: Project Setup & Configuration (Days 1-2)

**Tasks:**

1. Install dependencies

   ```bash
   bun add @prisma/client better-auth @thallesp/nestjs-better-auth @casl/ability
   bun add -d prisma
   bun add @nestjs/config class-validator class-transformer argon2
   ```

2. Initialize Prisma

   ```bash
   bunx prisma init --datasource-provider sqlite
   ```

3. Configure environment variables
   - Create `.env` file
   - Set `DATABASE_URL`, `SESSION_SECRET`, etc.

4. Create Prisma schema (as defined above)

5. Run initial migration

   ```bash
   bunx prisma migrate dev --name init
   ```

6. Generate Prisma Client

   ```bash
   bunx prisma generate
   ```

**Deliverables:**

- ✅ All dependencies installed
- ✅ Prisma configured with SQLite
- ✅ Database schema created
- ✅ Environment configuration ready

---

### Phase 2: Core Infrastructure (Days 3-4)

**Tasks:**

1. Create PrismaModule and PrismaService
   - Singleton Prisma Client
   - Lifecycle hooks for connection management

2. Create common utilities
   - Role enum
   - Base DTOs
   - HTTP exception filter
   - Validation pipe configuration

3. Set up global middleware
   - CORS configuration
   - Helmet for security headers
   - Request logging

4. Create base module structure
   - Generate all modules using NestJS CLI
   - Set up module imports/exports

**Deliverables:**

- ✅ PrismaService available globally
- ✅ Common utilities and enums defined
- ✅ All modules scaffolded
- ✅ Global middleware configured

---

### Phase 3: Authentication System (Days 5-7)

**Tasks:**

1. Integrate Better Auth
   - Configure Better Auth with Prisma
   - Set up session management
   - Configure password hashing with Argon2

2. Create AuthModule
   - AuthService with Better Auth integration
   - AuthController with endpoints
   - DTOs for register/login

3. Implement AuthGuard
   - Session validation
   - User extraction from request
   - @CurrentUser() decorator

4. Create authentication endpoints
   - POST /auth/register
   - POST /auth/login
   - POST /auth/logout
   - GET /auth/me

5. Add security features
   - CSRF protection
   - Secure cookie configuration

**Deliverables:**

- ✅ Users can register and login
- ✅ Sessions are managed securely
- ✅ AuthGuard protects routes
- ✅ @CurrentUser() decorator works

---

### Phase 4: Authorization System (Days 8-9)

**Tasks:**

1. Create CaslModule
   - CaslAbilityFactory
   - Define abilities for each role
   - Policy handler interface

2. Implement PoliciesGuard
   - Check abilities against resources
   - Support for attribute-based conditions
   - Integration with AuthGuard

3. Create authorization decorators
   - @CheckPolicies() decorator
   - @Public() decorator for public routes

4. Test authorization rules
   - Unit tests for ability factory
   - Integration tests for guards

**Deliverables:**

- ✅ CASL integrated with NestJS
- ✅ PoliciesGuard enforces permissions
- ✅ All roles have correct abilities
- ✅ Attribute-based rules work

---

### Phase 5: User Management (Days 10-12)

**Tasks:**

1. Implement UsersModule
   - UsersService with CRUD operations
   - UsersController with all endpoints
   - DTOs for create/update/assign-role

2. Implement ProfilesModule
   - ProfilesService
   - ProfilesController
   - DTOs for profile management

3. Implement SettingsModule
   - SettingsService
   - SettingsController
   - DTOs for settings management

4. Add authorization checks
   - Admin can manage all users
   - Users can manage own profile/settings
   - Product Managers can view users

5. Create seed data
   - Admin user
   - Product Manager user
   - Regular users

**Deliverables:**

- ✅ User CRUD operations work
- ✅ Profile management functional
- ✅ Settings management functional
- ✅ Role assignment works (Admin only)
- ✅ Seed data script created

---

### Phase 6: Product Catalog (Days 13-15)

**Tasks:**

1. Implement CategoriesModule
   - CategoriesService with CRUD
   - CategoriesController
   - DTOs for category management

2. Implement ProductsModule
   - ProductsService with CRUD
   - ProductsController
   - DTOs for product management
   - Slug generation

3. Add authorization checks
   - Public can read categories/products
   - Admin & Product Manager can manage

4. Implement filtering and pagination
   - Query parameters for filtering
   - Pagination helpers
   - Search functionality

5. Create seed data
   - Sample categories
   - Sample products

**Deliverables:**

- ✅ Category CRUD operations work
- ✅ Product CRUD operations work
- ✅ Products linked to categories
- ✅ Filtering and pagination work
- ✅ Seed data for products/categories

---

### Phase 7: Comments System (Days 16-17)

**Tasks:**

1. Implement CommentsModule
   - CommentsService with CRUD
   - CommentsController
   - DTOs for comment management

2. Add authorization checks
   - Authenticated users can create comments
   - Users can update/delete own comments
   - Admin can delete any comment

3. Implement ownership validation
   - Check comment.userId matches current user
   - Use CASL conditions for ABAC

4. Add comment features
   - Optional rating (1-5 stars)
   - Timestamps
   - Link to product and user

**Deliverables:**

- ✅ Users can comment on products
- ✅ Users can update own comments
- ✅ Users can delete own comments
- ✅ Admin can moderate comments

---

### Phase 8: Order System (Days 18-20)

**Tasks:**

1. Implement OrdersModule
   - OrdersService with order creation
   - OrdersController
   - DTOs for order management

2. Implement order creation flow
   - Validate product availability
   - Calculate total amount
   - Create order with items
   - Use fake payment method

3. Add authorization checks
   - Users can create own orders
   - Users can view own orders
   - Admin can view all orders
   - Admin can update order status

4. Implement order cancellation
   - Users can cancel PENDING orders
   - Admin can cancel any order

5. Add order features
   - Unique order number generation
   - Order status tracking
   - Order history

**Deliverables:**

- ✅ Users can create orders
- ✅ Order items linked to products
- ✅ Fake payment simulation works
- ✅ Order status management works
- ✅ Users can view order history

---

### Phase 9: Testing (Days 21-23)

**Tasks:**

1. Write unit tests
   - Services (all modules)
   - Guards (Auth, Policies)
   - Ability factory

2. Write integration tests
   - Authentication flow
   - Authorization scenarios
   - CRUD operations

3. Write e2e tests
   - Complete user journeys
   - Role-based access scenarios
   - Error handling

4. Test coverage
   - Aim for >80% coverage
   - Focus on critical paths

**Deliverables:**

- ✅ Unit tests for all services
- ✅ Integration tests for key flows
- ✅ E2E tests for user journeys
- ✅ Test coverage report

---

### Phase 10: Documentation & Polish (Days 24-25)

**Tasks:**

1. Create usage guide
   - How to run the project
   - How to seed data
   - How to test different roles

2. Add logging
   - Request/response logging
   - Error logging
   - Audit logging for sensitive operations

3. Performance optimization
   - Database query optimization
   - Caching strategies (if needed)
   - Response time monitoring

4. Security audit
   - Review all endpoints
   - Check authorization rules
   - Validate input sanitization

**Deliverables:**

- ✅ Usage guide in README
- ✅ Logging implemented
- ✅ Security audit completed
- ✅ Project ready for demo

---

## 🧪 Testing Strategy

### Unit Testing

**Scope:** Individual components in isolation

**Tools:**

- Jest (test runner)
- @nestjs/testing (NestJS testing utilities)

**Coverage:**

1. **Services**
   - Mock Prisma Client
   - Test business logic
   - Test error handling

2. **Guards**
   - Mock ExecutionContext
   - Test authorization logic
   - Test edge cases

3. **Ability Factory**
   - Test each role's abilities
   - Test conditions
   - Test edge cases

**Example:**

```typescript
describe('UsersService', () => {
  let service: UsersService
  let prisma: PrismaService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ]
    }).compile()

    service = module.get<UsersService>(UsersService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should create a user', async () => {
    // Test implementation
  })
})
```

---

### Integration Testing

**Scope:** Multiple components working together

**Tools:**

- Jest
- @nestjs/testing
- In-memory SQLite database

**Coverage:**

1. **Authentication Flow**
   - Register → Login → Access protected route
   - Invalid credentials handling
   - Session expiration

2. **Authorization Scenarios**
   - Admin accessing all resources
   - Product Manager managing products
   - User accessing own resources
   - User accessing others' resources (should fail)

3. **CRUD Operations**
   - Create → Read → Update → Delete flows
   - Validation errors
   - Database constraints

**Example:**

```typescript
describe('Authentication Integration', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = module.createNestApplication()
    await app.init()

    prisma = app.get<PrismaService>(PrismaService)
  })

  it('should register and login a user', async () => {
    // Test implementation
  })
})
```

---

### E2E Testing

**Scope:** Complete user journeys from API perspective

**Tools:**

- Jest
- Supertest (HTTP assertions)
- Test database

**Coverage:**

1. **User Journey: Regular User**
   - Register account
   - Login
   - View products
   - Create comment
   - Create order
   - View order history

2. **User Journey: Product Manager**
   - Login
   - Create category
   - Create product
   - Update product
   - View orders (read-only)

3. **User Journey: Admin**
   - Login
   - Create user
   - Assign Product Manager role
   - Manage all resources
   - View all orders

4. **Error Scenarios**
   - Unauthorized access attempts
   - Invalid input data
   - Resource not found
   - Duplicate entries

**Example:**

```typescript
describe('E2E: User Journey', () => {
  let app: INestApplication
  let sessionCookie: string

  beforeAll(async () => {
    // Setup app
  })

  it('should complete a purchase flow', async () => {
    // 1. Register
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'user@test.com', password: 'password123' })
      .expect(201)

    // 2. Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })
      .expect(200)

    sessionCookie = loginRes.headers['set-cookie']

    // 3. View products
    const productsRes = await request(app.getHttpServer()).get('/products').expect(200)

    // 4. Create order
    await request(app.getHttpServer())
      .post('/orders')
      .set('Cookie', sessionCookie)
      .send({
        items: [{ productId: productsRes.body[0].id, quantity: 1 }],
        shippingAddress: '123 Main St',
        billingAddress: '123 Main St'
      })
      .expect(201)
  })
})
```

---

### Test Data Management

**Strategies:**

1. **Seed Data**
   - Create `prisma/seed.ts`
   - Populate with realistic test data
   - Run before tests: `bunx prisma db seed`

2. **Factories**
   - Create factory functions for entities
   - Generate test data programmatically
   - Ensure data consistency

3. **Database Reset**
   - Reset database between test suites
   - Use transactions for test isolation
   - Clean up after tests

**Example Seed Script:**

```typescript
// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'argon2'

const prisma = new PrismaClient()

const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    hashLength: 32,
    parallelism: 1
  })
}

const clearDatabase = async (): Promise<void> => {
  console.log('🧹 Clearing existing data...')

  // Delete in correct order to respect foreign key constraints
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.session.deleteMany()
  await prisma.settings.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Database cleared')
}

const main = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seed...')

    // Clear existing data first (idempotent)
    await clearDatabase()

    // Seed all data in a single transaction for atomicity
    await prisma.$transaction(async tx => {
      // Seed Users
      console.log('👥 Seeding users...')
      const users = [
        {
          email: 'admin@example.com',
          password: await hashPassword('admin123'),
          role: Role.ADMIN,
          profile: { firstName: 'Admin', lastName: 'User' }
        },
        {
          email: 'manager@example.com',
          password: await hashPassword('manager123'),
          role: Role.PRODUCT_MANAGER,
          profile: { firstName: 'Product', lastName: 'Manager' }
        },
        {
          email: 'user@example.com',
          password: await hashPassword('user123'),
          role: Role.USER,
          profile: { firstName: 'Regular', lastName: 'User' }
        }
      ]

      await Promise.all(
        users.map(userData =>
          tx.user.create({
            data: {
              email: userData.email,
              password: userData.password,
              role: userData.role,
              profile: {
                create: {
                  firstName: userData.profile.firstName,
                  lastName: userData.profile.lastName
                }
              },
              settings: {
                create: {}
              }
            }
          })
        )
      )
      console.log('✅ Users seeded')

      // Seed Categories
      console.log('📁 Seeding categories...')
      const electronics = await tx.category.create({
        data: {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and gadgets'
        }
      })

      const clothing = await tx.category.create({
        data: {
          name: 'Clothing',
          slug: 'clothing',
          description: 'Fashion and apparel'
        }
      })

      const books = await tx.category.create({
        data: {
          name: 'Books',
          slug: 'books',
          description: 'Books and literature'
        }
      })

      const homeGarden = await tx.category.create({
        data: {
          name: 'Home & Garden',
          slug: 'home-garden',
          description: 'Home improvement and gardening supplies'
        }
      })
      console.log('✅ Categories seeded')

      // Seed Products
      console.log('📦 Seeding products...')
      await tx.product.createMany({
        data: [
          // Electronics (3 products)
          {
            name: 'Laptop Pro 15"',
            slug: 'laptop-pro-15',
            description: 'High-performance laptop with 16GB RAM and 512GB SSD',
            price: 1299.99,
            stock: 15,
            categoryId: electronics.id
          },
          {
            name: 'Wireless Headphones',
            slug: 'wireless-headphones',
            description: 'Noise-cancelling Bluetooth headphones with 30-hour battery',
            price: 199.99,
            stock: 45,
            categoryId: electronics.id
          },
          {
            name: 'Smart Watch',
            slug: 'smart-watch',
            description: 'Fitness tracker with heart rate monitor and GPS',
            price: 299.99,
            stock: 30,
            categoryId: electronics.id
          },
          // Clothing (3 products)
          {
            name: 'Cotton T-Shirt',
            slug: 'cotton-t-shirt',
            description: 'Comfortable 100% organic cotton t-shirt',
            price: 24.99,
            stock: 100,
            categoryId: clothing.id
          },
          {
            name: 'Denim Jeans',
            slug: 'denim-jeans',
            description: 'Classic fit denim jeans with stretch comfort',
            price: 59.99,
            stock: 75,
            categoryId: clothing.id
          },
          {
            name: 'Winter Jacket',
            slug: 'winter-jacket',
            description: 'Waterproof insulated jacket for cold weather',
            price: 149.99,
            stock: 40,
            categoryId: clothing.id
          },
          // Books (3 products)
          {
            name: 'TypeScript Handbook',
            slug: 'typescript-handbook',
            description: 'Complete guide to TypeScript programming',
            price: 39.99,
            stock: 50,
            categoryId: books.id
          },
          {
            name: 'Clean Code',
            slug: 'clean-code',
            description: 'A handbook of agile software craftsmanship',
            price: 44.99,
            stock: 35,
            categoryId: books.id
          },
          {
            name: 'Design Patterns',
            slug: 'design-patterns',
            description: 'Elements of reusable object-oriented software',
            price: 49.99,
            stock: 25,
            categoryId: books.id
          },
          // Home & Garden (3 products)
          {
            name: 'LED Desk Lamp',
            slug: 'led-desk-lamp',
            description: 'Adjustable LED lamp with USB charging port',
            price: 34.99,
            stock: 60,
            categoryId: homeGarden.id
          },
          {
            name: 'Plant Starter Kit',
            slug: 'plant-starter-kit',
            description: 'Complete kit for growing herbs indoors',
            price: 29.99,
            stock: 80,
            categoryId: homeGarden.id
          },
          {
            name: 'Tool Set',
            slug: 'tool-set',
            description: '50-piece home repair tool set with carrying case',
            price: 79.99,
            stock: 20,
            categoryId: homeGarden.id
          }
        ]
      })
      console.log('✅ Products seeded')
    })

    console.log('🎉 Seeding completed successfully')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

### Test Coverage Goals

| Component       | Target Coverage |
| --------------- | --------------- |
| Services        | 90%+            |
| Controllers     | 85%+            |
| Guards          | 95%+            |
| Ability Factory | 100%            |
| DTOs            | 80%+            |
| **Overall**     | **85%+**        |

---

### Continuous Testing

**During Development:**

- Run tests in watch mode: `bun test:watch`
- Run specific test suites: `bun test users.service.spec.ts`
- Check coverage: `bun test:cov`

**Before Commits:**

- Run all tests: `bun test`
- Run e2e tests: `bun test:e2e`
- Ensure no failing tests

**CI/CD Pipeline:**

- Run tests on every push
- Block merges if tests fail
- Generate coverage reports

---

## 🚀 Getting Started

### Prerequisites

- **Bun** (v1.0+) - [Install Bun](https://bun.sh/)
- **Node.js** (v18+) - For compatibility
- **Git** - Version control

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd 20251102-nest-auth-permission

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
bunx prisma migrate dev

# Seed database with test data
bunx prisma db seed

# Generate Prisma Client
bunx prisma generate
```

### Running the Application

```bash
# Development mode with hot reload
bun run dev

# Production mode
bun run build
bun run start:prod

# Run tests
bun test

# Run e2e tests
bun test:e2e

# Check test coverage
bun test:cov
```

### Accessing the Application

- **API Base URL**: <http://localhost:3000/api>
- **Prisma Studio**: `bunx prisma studio` (Database GUI)

### Test Accounts

After seeding, use these accounts to test different roles:

| Role            | Email                 | Password   |
| --------------- | --------------------- | ---------- |
| Admin           | `admin@example.com`   | admin123   |
| Product Manager | `manager@example.com` | manager123 |
| Regular User    | `user@example.com`    | user123    |

---

## 📚 Additional Resources

### Documentation Links

- [**NestJS**](https://docs.nestjs.com/)
- [**Better Auth**](https://www.better-auth.com/docs)
- [**Prisma**](https://www.prisma.io/docs)
- [**CASL**](https://casl.js.org/v6/en/guide/intro)
- [**TypeScript**](https://www.typescriptlang.org/docs/)

### Learning Resources

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [CASL with NestJS](https://casl.js.org/v6/en/package/casl-nestjs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Better Auth Examples](https://www.better-auth.com/docs/examples)

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Contributing

This is a demonstration project. Feel free to fork and modify for your own learning purposes.

---

## 🎯 Project Goals

This project demonstrates:

✅ **Modern Authentication** - Using Better Auth for secure user management ✅ **Fine-Grained
Authorization** - CASL for role-based and attribute-based access control ✅ **Clean Architecture** -
Separation of concerns with NestJS modules ✅ **Type Safety** - End-to-end TypeScript with Prisma ✅
**Best Practices** - Security, testing, and documentation ✅ **Real-World Use Case** - E-commerce
API with practical features

---

**Ready to implement? Follow the phases sequentially and build a robust authentication &
authorization system!** 🚀
