import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { Server } from 'node:http'
import request from 'supertest'
import { AppModule } from '~/app.module'
import { PrismaService } from '~/database/prisma.service'
import { UserWithRole } from '~/users/types'
import { AuthenticatedUser, createAuthenticatedUser } from './helpers/auth.helper'
import { cleanupTestDatabase, setupTestDatabase, TestDatabase } from './helpers/testDatabase'

interface ErrorResponse {
  message: string | string[]
  error: string
  statusCode: number
}

describe('Users (e2e)', () => {
  let app: INestApplication<Server>
  let testDb: TestDatabase
  let authenticatedUser: AuthenticatedUser

  beforeAll(async () => {
    testDb = await setupTestDatabase()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue(testDb.prisma)
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    )
    await app.init()

    authenticatedUser = await createAuthenticatedUser(app, { email: 'auth@example.com' })
  })

  afterAll(async () => {
    await app.close()
    await cleanupTestDatabase(testDb.prisma, testDb.dbPath)
  })

  describe('GET /users', () => {
    it('should return all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as UserWithRole[]

      expect(response.statusCode).toBe(200)
      expect(responseBody).toBeInstanceOf(Array)
      expect(responseBody.length).toBe(1)
    })
  })

  describe('GET /users/:id', () => {
    it('should return the user by ID', async () => {
      const user = await createAuthenticatedUser(app, {
        email: 'user-by-id@example.com',
        name: 'User By ID'
      })
      const response = await request(app.getHttpServer())
        .get(`/users/${user.user.id}`)
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as UserWithRole

      expect(response.statusCode).toBe(200)
      expect(responseBody.id).toBe(user.user.id)
      expect(responseBody.email).toBe(user.user.email)
    })

    it('should return 404 when user not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/test-user-id')
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toContain('User not found')
      expect(responseBody.error).toBe('Not Found')
    })
  })

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const data = { email: 'new-user@example.com', password: 'password123', name: 'New User' }

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(data)
        .set('Cookie', authenticatedUser.token)
      const user = (await testDb.prisma.user.findUnique({
        where: { email: data.email },
        include: { role: true }
      })) as UserWithRole

      expect(response.statusCode).toBe(201)
      expect(user.email).toBe(data.email)
      expect(user.name).toBe(data.name)
    })

    it('should return validation error when short password', async () => {
      const data = {
        email: 'short-password@example.com',
        password: 'short',
        name: 'Short Password'
      }

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(data)
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain(
        'password must be longer than or equal to 8 characters'
      )
    })

    it('should return validation error when invalid email', async () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Invalid Email'
      }

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(data)
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain('email must be an email')
    })

    it('should return generic message on duplicate email', async () => {
      const data = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Duplicate User'
      }

      await request(app.getHttpServer())
        .post('/users')
        .send(data)
        .set('Cookie', authenticatedUser.token)

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(data)
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(422)
      expect(responseBody.message).toContain('Invalid Credentials')
    })
  })

  describe('PATCH /users/:id', () => {
    it('should return 404 when user not found', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/test-user-id')
        .send({ email: 'updated@example.com' })
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toContain('User not found')
    })

    it('should successfully update the user email', async () => {
      const user = await createAuthenticatedUser(app, {
        email: 'user-update-email@example.com',
        name: 'User To Update'
      })

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.user.id}`)
        .send({ email: 'updated@example.com' })
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as UserWithRole

      expect(response.statusCode).toBe(200)
      expect(responseBody.email).toBe('updated@example.com')
    })

    it('should successfully update the user name', async () => {
      const user = await createAuthenticatedUser(app, {
        email: 'user-update-name@example.com',
        name: 'User To Update'
      })

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.user.id}`)
        .send({ name: 'Updated User' })
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as UserWithRole

      expect(response.statusCode).toBe(200)
      expect(responseBody.name).toBe('Updated User')
    })

    it('should successfully update the user password', async () => {
      const user = await createAuthenticatedUser(app, {
        email: 'user-update-password@example.com',
        name: 'User To Update'
      })

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.user.id}`)
        .send({ password: 'newpassword123' })
        .set('Cookie', authenticatedUser.token)

      expect(response.statusCode).toBe(200)
    })
  })

  describe('PATCH /users/:id/role', () => {
    it('should successfully update the user role', async () => {
      const user = await createAuthenticatedUser(app, {
        email: 'user-update-role@example.com',
        name: 'User To Update'
      })
      const role = await testDb.prisma.role.create({
        data: { name: 'NEW_ROLE', description: 'New role' }
      })

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.user.id}/role`)
        .send({ roleId: role.id })
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as UserWithRole

      expect(response.statusCode).toBe(200)
      expect(responseBody.roleId).toBe(role.id)
    })

    it('should return 404 when user not found', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/test-user-id/role')
        .send({ roleId: 'arbitrary-role-id' })
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toContain('User not found')
    })
  })

  describe('DELETE /users/:id', () => {
    it('should successfully delete the user', async () => {
      const user = await createAuthenticatedUser(app, {
        email: 'user-to-delete@example.com',
        name: 'User To Delete'
      })

      const response = await request(app.getHttpServer())
        .delete(`/users/${user.user.id}`)
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as UserWithRole

      expect(response.statusCode).toBe(200)
      expect(responseBody.id).toBe(user.user.id)
    })

    it('should return 404 when user not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/test-user-id')
        .set('Cookie', authenticatedUser.token)

      expect(response.statusCode).toBe(404)
    })
  })
})
