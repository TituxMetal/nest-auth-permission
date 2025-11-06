import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService as NestAuthService } from '@thallesp/nestjs-better-auth'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Server } from 'node:http'
import { LoggerService } from 'src/common/logger.service'
import { PrismaService } from 'src/database/prisma.service'
import request from 'supertest'
import { AppModule } from '../src/app.module'

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

interface ErrorResponse {
  statusCode: number
  message: string | string[]
  error: string
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
      const data = { email: 'test@example.com', password: 'password123', name: 'Test User' }
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(data)
        .expect(201)

      const body = response.body as { user: unknown; token: unknown }
      expect(body).toHaveProperty('user')
      expect(body).toHaveProperty('token')
      expect(body.user).toBeDefined()
      expect(body.token).toBeDefined()
    })

    it('should reject signup with invalid email', async () => {
      const data = { email: 'not-an-email', password: 'password123', name: 'Test User' }

      const response = await request(app.getHttpServer()).post('/auth/signup').send(data)

      const body = response.body as ErrorResponse
      expect(body.message).toContain('email must be an email')
      expect(body.error).toBe('Bad Request')
      expect(body.statusCode).toBe(400)
    })

    it('should reject signup with short password', async () => {
      const data = { email: 'test@example.com', password: 'pass', name: 'Test User' }

      const response = await request(app.getHttpServer()).post('/auth/signup').send(data)

      const body = response.body as ErrorResponse
      expect(body.message).toContain('password must be longer than or equal to 8 characters')
      expect(body.error).toBe('Bad Request')
      expect(body.statusCode).toBe(400)
    })

    it('should reject signup with missing name', async () => {
      const data = { email: 'test@example.com', password: 'password123' }

      const response = await request(app.getHttpServer()).post('/auth/signup').send(data)

      const body = response.body as ErrorResponse
      expect(body.message).toContain('name should not be empty')
      expect(body.error).toBe('Bad Request')
      expect(body.statusCode).toBe(400)
    })
  })
})
