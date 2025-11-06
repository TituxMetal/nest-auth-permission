import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LoggerService } from './common/logger.service'
import { PrismaService } from './database/prisma.service'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const mockLoggerService = {
      info: mock(() => {})
    }

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: PrismaService, useValue: {} }
      ]
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  afterEach(() => {
    mock.clearAllMocks()
  })

  describe('appController', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined()
    })
  })

  describe('getHello', () => {
    it('should return hello message', () => {
      const result = appController.getHello()
      expect(result).toEqual({ message: 'Hello World!' })
    })
  })
})
