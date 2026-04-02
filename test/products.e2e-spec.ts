import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { Server } from 'node:http'
import request from 'supertest'
import { AppModule } from '~/app.module'
import { PrismaService } from '~/database/prisma.service'
import { Product } from '~/products/types'
import { AuthenticatedUser, createAdminUser, createAuthenticatedUser } from './helpers/auth.helper'
import { cleanupTestDatabase, setupTestDatabase, TestDatabase } from './helpers/testDatabase'

interface ErrorResponse {
  message: string | string[]
  error: string
  statusCode: number
}

describe('Products (e2e)', () => {
  let app: INestApplication<Server>
  let testDb: TestDatabase
  let authenticatedUser: AuthenticatedUser
  let adminUser: AuthenticatedUser

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

    adminUser = await createAdminUser(app)
    authenticatedUser = await createAuthenticatedUser(app, { email: 'product-user@example.com' })
  })

  afterAll(async () => {
    await app.close()
    await cleanupTestDatabase(testDb.prisma, testDb.dbPath)
  })

  describe('GET /products', () => {
    it('should return an empty product list initially', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as Product[]

      expect(response.statusCode).toBe(200)
      expect(responseBody).toBeInstanceOf(Array)
      expect(responseBody.length).toBe(0)
    })
  })

  describe('POST /products', () => {
    it('should create a product as admin', async () => {
      const data = { name: 'Test Product', description: 'A test product', price: 29.99, stock: 10 }

      const response = await request(app.getHttpServer())
        .post('/products')
        .send(data)
        .set('Cookie', adminUser.token)
      const responseBody = response.body as Product

      expect(response.statusCode).toBe(201)
      expect(responseBody.name).toBe(data.name)
      expect(responseBody.description).toBe(data.description)
      expect(responseBody.price).toBe(data.price)
      expect(responseBody.stock).toBe(data.stock)
    })

    it('should return 400 when name is missing', async () => {
      const data = { price: 10.0 }

      const response = await request(app.getHttpServer())
        .post('/products')
        .send(data)
        .set('Cookie', adminUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain('name should not be empty')
    })

    it('should return 400 when price is negative', async () => {
      const data = { name: 'Negative Price', price: -5 }

      const response = await request(app.getHttpServer())
        .post('/products')
        .send(data)
        .set('Cookie', adminUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain('price must not be less than 0')
    })

    it('should default stock to 0 when not provided', async () => {
      const data = { name: 'No Stock Product', price: 5.0 }

      const response = await request(app.getHttpServer())
        .post('/products')
        .send(data)
        .set('Cookie', adminUser.token)
      const responseBody = response.body as Product

      expect(response.statusCode).toBe(201)
      expect(responseBody.stock).toBe(0)
    })
  })

  describe('GET /products/:id', () => {
    it('should return a product by ID', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Find Me', price: 15.0 })
        .set('Cookie', adminUser.token)
      const created = createResponse.body as Product

      const response = await request(app.getHttpServer())
        .get(`/products/${created.id}`)
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as Product

      expect(response.statusCode).toBe(200)
      expect(responseBody.id).toBe(created.id)
      expect(responseBody.name).toBe('Find Me')
    })

    it('should return 404 when product not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/non-existent-id')
        .set('Cookie', authenticatedUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toContain('Product not found')
    })
  })

  describe('PATCH /products/:id', () => {
    it('should update a product as admin', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Update Me', price: 20.0 })
        .set('Cookie', adminUser.token)
      const created = createResponse.body as Product

      const response = await request(app.getHttpServer())
        .patch(`/products/${created.id}`)
        .send({ name: 'Updated Name', price: 25.0 })
        .set('Cookie', adminUser.token)
      const responseBody = response.body as Product

      expect(response.statusCode).toBe(200)
      expect(responseBody.name).toBe('Updated Name')
      expect(responseBody.price).toBe(25.0)
    })

    it('should return 404 when updating non-existent product', async () => {
      const response = await request(app.getHttpServer())
        .patch('/products/non-existent-id')
        .send({ name: 'Ghost' })
        .set('Cookie', adminUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toContain('Product not found')
    })
  })

  describe('DELETE /products/:id', () => {
    it('should delete a product as admin', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Delete Me', price: 10.0 })
        .set('Cookie', adminUser.token)
      const created = createResponse.body as Product

      const response = await request(app.getHttpServer())
        .delete(`/products/${created.id}`)
        .set('Cookie', adminUser.token)
      const responseBody = response.body as Product

      expect(response.statusCode).toBe(200)
      expect(responseBody.id).toBe(created.id)
    })

    it('should return 404 when deleting non-existent product', async () => {
      const response = await request(app.getHttpServer())
        .delete('/products/non-existent-id')
        .set('Cookie', adminUser.token)
      const responseBody = response.body as ErrorResponse

      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toContain('Product not found')
    })
  })

  describe('Auth Guard — Unauthenticated access', () => {
    it('should return 401 for GET /products without cookie', async () => {
      const response = await request(app.getHttpServer()).get('/products')

      expect(response.statusCode).toBe(401)
    })

    it('should return 401 for POST /products without cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Unauth Product', price: 10.0 })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Auth Guard — Role-based access (USER role)', () => {
    it('should allow GET /products for USER role', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Cookie', authenticatedUser.token)

      expect(response.statusCode).toBe(200)
    })

    it('should deny POST /products for USER role', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Denied', price: 10.0 })
        .set('Cookie', authenticatedUser.token)

      expect(response.statusCode).toBe(403)
    })

    it('should deny PATCH /products/:id for USER role', async () => {
      const response = await request(app.getHttpServer())
        .patch('/products/any-id')
        .send({ name: 'Denied' })
        .set('Cookie', authenticatedUser.token)

      expect(response.statusCode).toBe(403)
    })

    it('should deny DELETE /products/:id for USER role', async () => {
      const response = await request(app.getHttpServer())
        .delete('/products/any-id')
        .set('Cookie', authenticatedUser.token)

      expect(response.statusCode).toBe(403)
    })
  })
})
