import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Server } from 'node:http'
import { LoggerService } from 'src/common/logger.service'
import { PrismaService } from 'src/database/prisma.service'
import request from 'supertest'
import { AppModule } from '../src/app.module'

describe('Error Handling (e2e)', () => {
  let app: INestApplication<Server>
  const mockPrismaService = {
    role: {
      findMany: () => Promise.resolve([])
    }
  }
  const mockLoggerService = {
    info: () => {},
    warn: () => {},
    error: () => {}
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(LoggerService)
      .useValue(mockLoggerService)
      .compile()

    app = moduleFixture.createNestApplication()

    // Apply same configuration as main.ts
    const { ValidationPipe } = await import('@nestjs/common')
    const helmet = await import('helmet')
    const { HttpExceptionFilter } = await import('../src/common/filters/httpException.filter')

    app.use(helmet.default())
    app.useGlobalFilters(new HttpExceptionFilter())
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    )

    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('404 Not Found', () => {
    it('should return structured 404 error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/not-found')
        .expect(HttpStatus.NOT_FOUND)

      expect(response.body).toHaveProperty('statusCode', 404)
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('path', '/demo/not-found')
      expect(response.body).toHaveProperty('method', 'GET')
      expect(response.body).toHaveProperty('message', 'This resource does not exist')
      expect(response.body).toHaveProperty('error', 'NotFoundException')
    })

    it('should return 404 for user not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/user/999')
        .expect(HttpStatus.NOT_FOUND)

      expect(response.body).toMatchObject({
        statusCode: 404,
        path: '/demo/user/999',
        message: 'User with ID "999" not found'
      })
    })
  })

  describe('400 Bad Request', () => {
    it('should return structured 400 error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/bad-request')
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body).toMatchObject({
        statusCode: 400,
        path: '/demo/bad-request',
        method: 'GET',
        message: 'Invalid input parameters',
        error: 'BadRequestException'
      })
    })
  })

  describe('500 Internal Server Error', () => {
    it('should return structured 500 error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/server-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(response.body).toMatchObject({
        statusCode: 500,
        path: '/demo/server-error',
        method: 'GET',
        message: 'Something went wrong on the server'
      })
    })

    it('should handle unexpected Error objects', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/unexpected-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(response.body).toMatchObject({
        statusCode: 500,
        path: '/demo/unexpected-error',
        message: 'Unexpected error occurred',
        error: 'Error'
      })
    })

    it('should handle thrown strings', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/throw-string')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(response.body).toMatchObject({
        statusCode: 500,
        path: '/demo/throw-string',
        message: 'An unexpected error occurred',
        error: 'UnknownError'
      })
    })
  })

  describe('Error Response Structure', () => {
    it('should always include timestamp in ISO format', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/not-found')
        .expect(HttpStatus.NOT_FOUND)

      const errorBody = response.body as { timestamp: string }
      expect(errorBody.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should include request path and method', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/bad-request')
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body).toMatchObject({
        path: '/demo/bad-request',
        method: 'GET'
      })
    })

    it('should not expose stack traces in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const response = await request(app.getHttpServer())
        .get('/demo/unexpected-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(response.body).not.toHaveProperty('stack')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Success Cases', () => {
    it('should successfully return user when ID matches', async () => {
      const response = await request(app.getHttpServer())
        .get('/demo/user/123')
        .expect(HttpStatus.OK)

      expect(response.body).toEqual({
        id: '123',
        name: 'Demo User'
      })
    })
  })
})
