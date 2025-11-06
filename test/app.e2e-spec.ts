import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { type Server } from 'node:http'
import request from 'supertest'
import { AppModule } from '~/app.module'
import { LoggerService } from '~/common/logger.service'

describe('AppController (e2e)', () => {
  let app: INestApplication<Server>
  const mockLoggerService = {
    info: mock(() => {})
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(LoggerService)
      .useValue(mockLoggerService)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/')

    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({ message: 'Hello World!' })
    expect(mockLoggerService.info).toHaveBeenCalledWith('Hello World!', { action: 'getHello' })
  })
})
