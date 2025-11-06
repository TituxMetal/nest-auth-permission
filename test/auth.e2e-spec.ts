import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Server } from 'node:http'
import { LoggerService } from 'src/common/logger.service'
import { PrismaService } from 'src/database/prisma.service'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { AuthService as NestAuthService } from '@thallesp/nestjs-better-auth'

type MockPrismaTransaction = {
  role: {
    upsert: ReturnType<typeof mock>
  }
  user: {
    update: ReturnType<typeof mock>
  }
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: false,
  image: null,
  roleId: 'role-user-id',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockRole = {
  id: 'role-user-id',
  name: 'USER',
  description: 'Regular user',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockSignupResponse = {
  user: mockUser,
  token: 'test-session-token'
}

describe('Auth (e2e)', () => {
  let app: INestApplication<Server>

  beforeEach(async () => {
    const mockPrismaService = {
      $transaction: mock(
        <T>(callback: (tx: MockPrismaTransaction) => Promise<T>): Promise<T> =>
          callback({
            role: {
              upsert: mock(() => Promise.resolve(mockRole))
            },
            user: {
              update: mock(() => Promise.resolve({ ...mockUser, roleId: mockRole.id }))
            }
          })
      ),
      user: {
        findUnique: mock(() => Promise.resolve({ ...mockUser, role: mockRole }))
      }
    }

    const mockNestAuthService = {
      api: {
        signUpEmail: mock(() => Promise.resolve(mockSignupResponse))
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(NestAuthService)
      .useValue(mockNestAuthService)
      .overrideProvider(LoggerService)
      .useValue({
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {}
      })
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))

    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /auth/signup', () => {
    it('should successfully create a new user with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' })
        .expect(201)

      const body = response.body as { user: unknown; token: unknown }
      expect(body).toHaveProperty('user')
      expect(body).toHaveProperty('token')
      expect(body.user).toBeDefined()
      expect(body.token).toBeDefined()
    })

    it('should reject signup with invalid email', async () => {
      // TODO(human): Implement validation test
      // 1. POST to /auth/signup with invalid email (e.g., "not-an-email")
      // 2. Expect status 400 (Bad Request)
      // 3. Expect error message about validation
    })

    it('should reject signup with short password', async () => {
      // TODO(human): Implement validation test
      // 1. POST to /auth/signup with password < 8 characters
      // 2. Expect status 400
      // 3. Check error mentions password length
    })

    it('should reject signup with missing name', async () => {
      // TODO(human): Implement validation test
      // 1. POST to /auth/signup without name field
      // 2. Expect status 400
      // 3. Check error mentions name is required
    })
  })
})
