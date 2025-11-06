import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { LoggerService } from '~/common/logger.service'
import { AuthController } from './auth.controller'
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

describe('AuthController', () => {
  let controller: AuthController
  let mockSignup: ReturnType<typeof mock>
  let mockInfoLogger: ReturnType<typeof mock>

  beforeEach(async () => {
    mockSignup = mock(() => Promise.resolve(mockSignupResult))
    mockInfoLogger = mock(() => {})
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: mockSignup
          }
        },
        {
          provide: LoggerService,
          useValue: {
            info: mockInfoLogger
          }
        }
      ]
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  afterEach(() => {
    mock.clearAllMocks()
  })

  describe('signup', () => {
    it('should call authService.signup and return the result', async () => {
      // Arrange
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      } as SignupDto

      // Act
      const result = await controller.signup(signupDto)

      // Assert
      expect(mockSignup).toHaveBeenCalledWith(signupDto)
      expect(result).toEqual(mockSignupResult)
      expect(mockInfoLogger).toHaveBeenCalledWith('Signup successful', {
        action: 'signup',
        signupUser: mockSignupResult
      })
    })
  })
})
