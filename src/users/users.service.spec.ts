import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'
import { UsersService } from './users.service'

const roles = ['USER', 'ADMIN', 'PRODUCT_MANAGER']

const usersFactory = (numberOfUsers: number) => {
  const users = []

  for (let i = 1; i <= numberOfUsers; i++) {
    const user = {
      id: `user-${i}`,
      email: `user${i}@example.com`,
      name: `User ${i}`,
      emailVerified: false,
      image: null,
      roleId: `role-${i}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: {
        id: `role-${i}`,
        name: roles[(i - 1) % 3],
        description: 'Role description',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    users.push(user)
  }

  return users
}

describe('UsersService', () => {
  let service: UsersService
  let prismaFindMany: ReturnType<typeof mock>
  let prismaFindUnique: ReturnType<typeof mock>
  let prismaUpdateRole: ReturnType<typeof mock>
  let prismaDelete: ReturnType<typeof mock>
  let txCreateUser: ReturnType<typeof mock>
  let txCreateAccount: ReturnType<typeof mock>
  let txUpsertRole: ReturnType<typeof mock>
  let txUpdateUser: ReturnType<typeof mock>
  let txAccountUpdateMany: ReturnType<typeof mock>
  let loggerInfo: ReturnType<typeof mock>
  let loggerError: ReturnType<typeof mock>

  beforeEach(async () => {
    const mockUser = usersFactory(1)[0]

    prismaFindMany = mock(() => Promise.resolve(usersFactory(10)))
    prismaFindUnique = mock(() => Promise.resolve(usersFactory(1)[0]))
    prismaUpdateRole = mock(() => Promise.resolve(mockUser))
    prismaDelete = mock(() => Promise.resolve(mockUser))
    txCreateUser = mock(() => Promise.resolve(mockUser))
    txCreateAccount = mock(() => Promise.resolve({}))
    txUpsertRole = mock(() =>
      Promise.resolve({
        id: 'role-1',
        name: 'USER',
        description: 'Regular user',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    )
    txUpdateUser = mock(() => Promise.resolve(mockUser))
    txAccountUpdateMany = mock(() => Promise.resolve({}))
    loggerInfo = mock(() => {})
    loggerError = mock(() => {})

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: prismaFindMany,
              findUnique: prismaFindUnique,
              update: prismaUpdateRole,
              delete: prismaDelete
            },
            $transaction: mock((callback: (tx: Partial<PrismaService>) => Promise<unknown>) => {
              return callback({
                role: { upsert: txUpsertRole } as unknown as PrismaService['role'],
                user: {
                  create: txCreateUser,
                  update: txUpdateUser
                } as unknown as PrismaService['user'],
                account: {
                  create: txCreateAccount,
                  updateMany: txAccountUpdateMany
                } as unknown as PrismaService['account']
              } as Partial<PrismaService>)
            })
          }
        },
        {
          provide: LoggerService,
          useValue: { info: loggerInfo, error: loggerError }
        }
      ]
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  afterEach(() => {
    mock.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return all users with roles', async () => {
      const result = await service.findAll()

      expect(prismaFindMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { role: true }
      })

      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(10)
      expect(result[0].name).toBe('User 1')
      expect(result[0].role?.name).toBeDefined()
      const roleName = result[0].role?.name as string
      expect(roles).toContain(roleName)
    })
  })

  describe('findOne', () => {
    it('should return the user by ID', async () => {
      const mockUser = usersFactory(1)[0]
      const userId = mockUser.id

      const result = await service.findOne(userId)

      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result.id).toBe(userId)
      expect(result.role?.name).toBe('USER')
    })
  })

  describe('create', () => {
    it('should create a new user as well as an account for hashed password', async () => {
      const dto = {
        email: 'user1@example.com',
        name: 'User 1',
        password: 'password123'
      }

      const result = await service.create(dto)

      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result!.email).toBe(dto.email)
      expect(result!.name).toBe(dto.name)
      expect(result!.role?.name).toBe('USER')
      expect(txCreateUser).toHaveBeenCalled()
      expect(txCreateAccount).toHaveBeenCalled()
      expect(txUpsertRole).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update the user by its ID and return the updated user', async () => {
      const userId = 'user-1'
      const dto = {
        name: 'Updated User',
        email: 'updated@example.com',
        password: 'newpassword123'
      }
      const updatedUser = { ...usersFactory(1)[0], name: dto.name, email: dto.email }

      txUpdateUser.mockImplementationOnce(() => Promise.resolve(updatedUser))

      const result = await service.update(userId, dto)

      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result!.id).toBe(userId)
      expect(result!.name).toBe(dto.name)
      expect(result!.email).toBe(dto.email)
      expect(txUpdateUser).toHaveBeenCalled()
      expect(txAccountUpdateMany).toHaveBeenCalled()
    })
  })

  describe('updateRole', () => {
    it('should update the user role by its ID and return the updated user', async () => {
      const userId = 'user-1'
      const roleId = 'role-2'

      prismaUpdateRole.mockImplementationOnce(() =>
        Promise.resolve({ ...usersFactory(1)[0], roleId })
      )
      const result = await service.updateRole(userId, roleId)

      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result.id).toBe(userId)
      expect(result.roleId).toBe(roleId)
      expect(prismaUpdateRole).toHaveBeenCalled()
      expect(prismaUpdateRole).toHaveBeenCalledWith({
        where: { id: userId },
        data: { roleId },
        include: { role: true }
      })
    })
  })

  describe('remove', () => {
    it('should delete the user by its ID and return the deleted user', async () => {
      const userId = 'user-1'

      prismaDelete.mockImplementationOnce(() => Promise.resolve(usersFactory(1)[0]))
      const result = await service.remove(userId)

      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result.id).toBe(userId)
      expect(prismaDelete).toHaveBeenCalled()
      expect(prismaDelete).toHaveBeenCalledWith({
        where: { id: userId },
        include: { role: true }
      })
    })
  })
})
