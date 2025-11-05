import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LoggerService } from './common/logger.service'
import { PrismaService } from './database/prisma.service'

describe('AppController', () => {
  let appController: AppController
  const mockRoles = [
    {
      id: '1',
      name: 'admin',
      description: 'Administrator',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'user',
      description: 'Regular user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  beforeEach(async () => {
    const mockPrismaService = {
      role: {
        findMany: mock(() => Promise.resolve(mockRoles))
      }
    }
    const mockLoggerService = {
      info: mock(() => {})
    }

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService }
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

  describe('getRoles', () => {
    it('should return array of roles', async () => {
      const result = await appController.getRoles()
      expect(result).toEqual(mockRoles)
      expect(result).toHaveLength(2)
    })

    it('should return roles with correct structure', async () => {
      const result = await appController.getRoles()
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('description')
      expect(result[0]).toHaveProperty('id')
    })

    it('should not return user-specific fields', async () => {
      const result = await appController.getRoles()
      expect(result[0]).not.toHaveProperty('email')
      expect(result[0]).not.toHaveProperty('emailVerified')
      expect(result[0]).not.toHaveProperty('password')
    })
  })
})
