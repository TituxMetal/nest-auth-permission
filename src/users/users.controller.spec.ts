import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let controller: UsersController
  let serviceFindAll: ReturnType<typeof mock>
  let serviceFindOne: ReturnType<typeof mock>
  let serviceCreate: ReturnType<typeof mock>
  let serviceUpdate: ReturnType<typeof mock>
  let serviceUpdateRole: ReturnType<typeof mock>
  let serviceRemove: ReturnType<typeof mock>

  beforeEach(async () => {
    serviceFindAll = mock(() => Promise.resolve([]))
    serviceFindOne = mock(() => Promise.resolve({}))
    serviceCreate = mock(() => Promise.resolve({}))
    serviceUpdate = mock(() => Promise.resolve({}))
    serviceUpdateRole = mock(() => Promise.resolve({}))
    serviceRemove = mock(() => Promise.resolve({}))

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: serviceFindAll,
            findOne: serviceFindOne,
            create: serviceCreate,
            update: serviceUpdate,
            updateRole: serviceUpdateRole,
            remove: serviceRemove
          }
        }
      ]
    }).compile()

    controller = module.get<UsersController>(UsersController)
  })

  describe('findAll', () => {
    it('should call usersService.findAll() and return the result', async () => {
      const result = await controller.findAll()

      expect(serviceFindAll).toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should call usersService.findOne(id) with the correct id parameter', async () => {
      const userId = 'user-123'
      await controller.findOne(userId)

      expect(serviceFindOne).toHaveBeenCalledWith(userId)
    })
  })

  describe('create', () => {
    it('should call usersService.create(dto) with the correct dto parameter', async () => {
      const dto = {
        email: 'user1@example.com',
        name: 'User 1',
        password: 'password123'
      }

      await controller.create(dto)

      expect(serviceCreate).toHaveBeenCalledWith(dto)
    })
  })

  describe('update', () => {
    it('should call usersService.update(id, dto) with the correct id and dto parameters', async () => {
      const userId = 'user-123'
      const dto = {
        name: 'Updated User',
        email: 'updated@example.com',
        password: 'newpassword123'
      }

      await controller.update(userId, dto)

      expect(serviceUpdate).toHaveBeenCalledWith(userId, dto)
    })
  })

  describe('updateRole', () => {
    it('should call usersService.updateRole(id, dto.roleId) with the correct id and dto.roleId parameters', async () => {
      const userId = 'user-123'
      const dto = { roleId: 'role-123' }

      await controller.updateRole(userId, dto)

      expect(serviceUpdateRole).toHaveBeenCalledWith(userId, dto.roleId)
    })
  })

  describe('remove', () => {
    it('should call usersService.remove(id) with the correct id parameter', async () => {
      const userId = 'user-123'

      await controller.remove(userId)

      expect(serviceRemove).toHaveBeenCalledWith(userId)
    })
  })
})
