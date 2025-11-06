import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService as NestAuthService } from '@thallesp/nestjs-better-auth'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'

const mockSignupResult = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  token: 'session-token'
}

// Mock role from database
const mockUserRole = {
  id: 'role-user-id',
  name: 'USER',
  description: 'Regular user',
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('AuthService', () => {
  let service: AuthService
  let nestAuthService: NestAuthService
  let txRoleUpsert: ReturnType<typeof mock>
  let txUserUpdate: ReturnType<typeof mock>
  let signUpEmailMock: ReturnType<typeof mock>

  beforeEach(async () => {
    signUpEmailMock = mock(() => Promise.resolve(mockSignupResult))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: NestAuthService,
          useValue: {
            api: {
              signUpEmail: signUpEmailMock
            }
          }
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: mock((callback: (tx: Partial<PrismaService>) => Promise<unknown>) => {
              txRoleUpsert = mock(() => Promise.resolve(mockUserRole))
              txUserUpdate = mock(() => Promise.resolve({ id: 'user-123', roleId: 'role-user-id' }))

              return callback({
                role: { upsert: txRoleUpsert } as unknown as PrismaService['role'],
                user: { update: txUserUpdate } as unknown as PrismaService['user']
              } as Partial<PrismaService>)
            })
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: mock((key: string) => {
              if (key === 'ADMIN_EMAIL') return 'admin@example.com'
              if (key === 'NODE_ENV') return 'test'
              return undefined
            })
          }
        },
        {
          provide: LoggerService,
          useValue: {
            info: mock(() => {}),
            error: mock(() => {})
          }
        }
      ]
    }).compile()

    service = module.get<AuthService>(AuthService)
    nestAuthService = module.get<NestAuthService>(NestAuthService)
  })

  afterEach(() => {
    mock.clearAllMocks()
  })

  describe('signup', () => {
    it('should create a regular user with USER role', async () => {
      // Arrange - set up test data
      const signupDto = {
        email: 'regular@example.com',
        password: 'password123',
        name: 'Regular User'
      } as SignupDto

      // Act - call the method you're testing
      const result = await service.signup(signupDto)

      // Assert - verify the behavior
      expect(nestAuthService.api.signUpEmail).toHaveBeenCalledWith({
        body: signupDto
      })
      expect(result).toEqual(mockSignupResult)
      expect(txRoleUpsert).toHaveBeenCalledWith({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER', description: 'Regular user' }
      })
      expect(txUserUpdate).toHaveBeenCalledWith({
        where: { email: signupDto.email },
        data: { roleId: mockUserRole.id }
      })
    })

    it('should create an admin user when email matches ADMIN_EMAIL', async () => {
      // Arrange - admin email that matches config
      const signupDto = {
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User'
      } as SignupDto

      // Act
      const result = await service.signup(signupDto)

      // Assert - should create ADMIN role, not USER
      expect(nestAuthService.api.signUpEmail).toHaveBeenCalledWith({
        body: signupDto
      })
      expect(result).toEqual(mockSignupResult)
      expect(txRoleUpsert).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN', description: 'Administrator' }
      })
      expect(txUserUpdate).toHaveBeenCalledWith({
        where: { email: signupDto.email },
        data: { roleId: mockUserRole.id }
      })
    })

    it('should handle case-insensitive admin email matching', async () => {
      // Arrange - uppercase admin email
      const signupDto = {
        email: 'ADMIN@EXAMPLE.COM',
        password: 'password123',
        name: 'Admin User'
      } as SignupDto

      // Act
      await service.signup(signupDto)

      // Assert - should still create ADMIN role
      expect(txRoleUpsert).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN', description: 'Administrator' }
      })
    })

    it('should throw generic error when Better Auth rejects duplicate email', () => {
      // Arrange - Override the mock to throw an error (simulating duplicate email)
      signUpEmailMock.mockImplementation(() => {
        throw new Error('Email already in use')
      })

      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      // Act & Assert - Expect a generic error (not the specific "Email already in use")
      expect(service.signup(signupDto)).rejects.toThrow('Unable to create account')
    })
  })
})
