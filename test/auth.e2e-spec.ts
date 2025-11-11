import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { Server } from 'node:http'
import request from 'supertest'
import { AppModule } from '~/app.module'
import { PrismaService } from '~/database/prisma.service'
import { createAuthenticatedUser } from './helpers/auth.helper'
import { cleanupTestDatabase, setupTestDatabase, TestDatabase } from './helpers/testDatabase'

interface BetterAuthErrorResponse {
  code: string
  message: string
}

describe('Auth (e2e)', () => {
  let app: INestApplication<Server>
  let testDb: TestDatabase

  beforeAll(async () => {
    testDb = await setupTestDatabase()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue(testDb.prisma)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
    await cleanupTestDatabase(testDb.prisma, testDb.dbPath)
  })

  describe('POST /api/sign-up/email', () => {
    it('should successfully create a new user with valid data', async () => {
      const data = { email: 'test@example.com', password: 'password123', name: 'Test User' }

      const response = await request(app.getHttpServer()).post('/api/auth/sign-up/email').send(data)
      const user = await testDb.prisma.user.findUnique({
        where: { email: data.email },
        include: { role: true }
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['set-cookie']).toBeDefined()
      expect(user).toBeDefined()
      expect(user!.email).toBe(data.email)
      expect(user!.role!.name).toBe('USER')
    })

    it('should successfully create an admin user when email matches ADMIN_EMAIL', async () => {
      const data = { email: 'admin@example.com', password: 'password123', name: 'Admin User' }
      process.env.ADMIN_EMAIL = data.email

      const response = await request(app.getHttpServer()).post('/api/auth/sign-up/email').send(data)
      const user = await testDb.prisma.user.findUnique({
        where: { email: data.email },
        include: { role: true }
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['set-cookie']).toBeDefined()
      expect(user).toBeDefined()
      expect(user!.email).toBe(data.email)
      expect(user!.role!.name).toBe('ADMIN')
    })

    it('should reject signup with invalid email', async () => {
      const data = { email: 'invalid-email', password: 'password123', name: 'Test User' }

      const response = await request(app.getHttpServer()).post('/api/auth/sign-up/email').send(data)
      const errorBody = response.body as BetterAuthErrorResponse
      const user = await testDb.prisma.user.findUnique({
        where: { email: data.email }
      })

      expect(response.statusCode).toBe(400)
      expect(response.headers['set-cookie']).not.toBeDefined()
      expect(errorBody.code).toEqual('INVALID_EMAIL')
      expect(errorBody.message).toContain('Invalid email')
      expect(user).toBeNull()
    })

    it('should reject signup with short password', async () => {
      const data = { email: 'short@example.com', password: 'short', name: 'Invalid User' }

      const response = await request(app.getHttpServer()).post('/api/auth/sign-up/email').send(data)
      const errorBody = response.body as BetterAuthErrorResponse
      const user = await testDb.prisma.user.findUnique({
        where: { email: data.email }
      })

      expect(response.statusCode).toBe(400)
      expect(errorBody.code).toEqual('PASSWORD_TOO_SHORT')
      expect(errorBody.message).toContain('Password too short')
      expect(response.headers['set-cookie']).not.toBeDefined()
      expect(user).toBeNull()
    })

    it('should reject signup with duplicate email', async () => {
      const data = { email: 'duplicate@example.com', password: 'password123', name: 'Test User' }

      await request(app.getHttpServer()).post('/api/auth/sign-up/email').send(data)

      const response = await request(app.getHttpServer()).post('/api/auth/sign-up/email').send(data)
      const errorBody = response.body as BetterAuthErrorResponse
      const user = await testDb.prisma.user.findUnique({
        where: { email: data.email }
      })

      expect(response.statusCode).toBe(422)
      expect(errorBody.code).toEqual('USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')
      expect(errorBody.message).toContain('User already exists. Use another email.')
      expect(response.headers['set-cookie']).not.toBeDefined()
      expect(user).toBeDefined()
    })
  })

  describe('POST /api/sign-in/email', () => {
    const data = { email: 'test-sign-in@example.com', password: 'password123' }
    beforeAll(async () => {
      await createAuthenticatedUser(app, data)
    })

    it('should successfully sign in with valid credentials', async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/sign-in/email').send(data)

      expect(response.statusCode).toBe(200)
      expect(response.headers['set-cookie']).toBeDefined()
    })

    it('should reject sign in with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email: data.email, password: 'wrong-password' })
      const errorBody = response.body as BetterAuthErrorResponse

      expect(response.statusCode).toBe(401)
      expect(response.headers['set-cookie']).not.toBeDefined()
      expect(errorBody.code).toEqual('INVALID_EMAIL_OR_PASSWORD')
      expect(errorBody.message).toContain('Invalid email or password')
    })

    it('should reject sign in with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email: 'wrong@example.com', password: data.password })
      const errorBody = response.body as BetterAuthErrorResponse

      expect(response.statusCode).toBe(401)
      expect(response.headers['set-cookie']).not.toBeDefined()
      expect(errorBody.code).toEqual('INVALID_EMAIL_OR_PASSWORD')
      expect(errorBody.message).toContain('Invalid email or password')
    })
  })
})
