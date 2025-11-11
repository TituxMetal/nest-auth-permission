import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'
import { SignupHook, SignupHookContext } from './signup.hook'

// Mock data for tests
const mockUserRole = {
  id: 'role-user-id',
  name: 'USER',
  description: 'Regular user',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockAdminRole = {
  id: 'role-admin-id',
  name: 'ADMIN',
  description: 'Administrator',
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('SignupHook', () => {
  let signupHook: SignupHook
  let txRoleUpsert: ReturnType<typeof mock>
  let txUserUpdate: ReturnType<typeof mock>
  let prismaFindUnique: ReturnType<typeof mock>

  beforeEach(async () => {
    txRoleUpsert = mock(() => Promise.resolve(mockUserRole))
    txUserUpdate = mock(() => Promise.resolve({}))
    prismaFindUnique = mock(() => Promise.resolve(mockUserRole))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignupHook,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: prismaFindUnique } as unknown as PrismaService['user'],
            $transaction: mock((callback: (tx: Partial<PrismaService>) => Promise<unknown>) =>
              callback({
                role: { upsert: txRoleUpsert } as unknown as PrismaService['role'],
                user: { update: txUserUpdate } as unknown as PrismaService['user']
              } as Partial<PrismaService>)
            )
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

    signupHook = module.get<SignupHook>(SignupHook)
  })

  afterEach(() => {
    mock.clearAllMocks()
  })

  describe('handle', () => {
    it('should assign USER role to regular users', async () => {
      const ctx = {
        body: {
          email: 'regular@test.com',
          password: 'password123',
          name: 'Regular User'
        }
      } as SignupHookContext

      prismaFindUnique.mockResolvedValueOnce(mockUserRole)
      txRoleUpsert.mockResolvedValue(mockUserRole)
      await signupHook.handle(ctx)

      expect(prismaFindUnique).toHaveBeenCalledWith({ where: { email: ctx.body.email } })
      expect(txRoleUpsert).toHaveBeenCalledWith({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER', description: 'Regular user' }
      })
      expect(txUserUpdate).toHaveBeenCalledWith({
        where: { email: ctx.body.email },
        data: { roleId: 'role-user-id' }
      })
    })

    it('should assign ADMIN role when email matches ADMIN_EMAIL', async () => {
      const ctx = {
        body: {
          email: 'admin@example.com',
          password: 'password123',
          name: 'Admin User'
        }
      } as SignupHookContext

      prismaFindUnique.mockResolvedValueOnce(mockAdminRole)
      txRoleUpsert.mockResolvedValue(mockAdminRole)
      await signupHook.handle(ctx)

      expect(prismaFindUnique).toHaveBeenCalledWith({ where: { email: ctx.body.email } })
      expect(txRoleUpsert).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN', description: 'Administrator' }
      })
      expect(txUserUpdate).toHaveBeenCalledWith({
        where: { email: ctx.body.email },
        data: { roleId: 'role-admin-id' }
      })
    })

    it('should handle case-insensitive admin email matching', async () => {
      const ctx = {
        body: {
          email: 'ADMIN@EXAMPLE.COM',
          password: 'password123',
          name: 'Admin User'
        }
      } as SignupHookContext

      prismaFindUnique.mockResolvedValueOnce(mockAdminRole)
      txRoleUpsert.mockResolvedValueOnce(mockAdminRole)
      await signupHook.handle(ctx)

      expect(prismaFindUnique).toHaveBeenCalledWith({ where: { email: ctx.body.email } })
      expect(txRoleUpsert).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN', description: 'Administrator' }
      })
      expect(txUserUpdate).toHaveBeenCalledWith({
        where: { email: ctx.body.email },
        data: { roleId: 'role-admin-id' }
      })
    })

    it('should throw generic error when role assignment fails', () => {
      const ctx = {
        body: {
          email: 'regular@test.com',
          password: 'password123',
          name: 'Regular User'
        }
      } as SignupHookContext

      prismaFindUnique.mockResolvedValueOnce(mockUserRole)
      txRoleUpsert.mockRejectedValue(new Error('Database error'))
      const hookPromise = signupHook.handle(ctx)

      expect(prismaFindUnique).toHaveBeenCalledWith({ where: { email: ctx.body.email } })
      expect(hookPromise).rejects.toThrow('Unable to create account')
      expect(txRoleUpsert).toHaveBeenCalledWith({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER', description: 'Regular user' }
      })
      expect(txUserUpdate).not.toHaveBeenCalled()
    })
  })
})
