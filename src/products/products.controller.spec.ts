import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

describe('ProductsController', () => {
  let controller: ProductsController
  let serviceFindAll: ReturnType<typeof mock>
  let serviceFindOne: ReturnType<typeof mock>
  let serviceCreate: ReturnType<typeof mock>
  let serviceUpdate: ReturnType<typeof mock>
  let serviceRemove: ReturnType<typeof mock>

  beforeEach(async () => {
    serviceFindAll = mock(() => Promise.resolve([]))
    serviceFindOne = mock(() => Promise.resolve({}))
    serviceCreate = mock(() => Promise.resolve({}))
    serviceUpdate = mock(() => Promise.resolve({}))
    serviceRemove = mock(() => Promise.resolve({}))

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: serviceFindAll,
            findOne: serviceFindOne,
            create: serviceCreate,
            update: serviceUpdate,
            remove: serviceRemove
          }
        }
      ]
    }).compile()

    controller = module.get<ProductsController>(ProductsController)
  })

  describe('findAll', () => {
    it('should call productsService.findAll() and return the result', async () => {
      const result = await controller.findAll()

      expect(serviceFindAll).toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should call productsService.findOne(id) with the correct id parameter', async () => {
      const productId = 'product-123'
      await controller.findOne(productId)

      expect(serviceFindOne).toHaveBeenCalledWith(productId)
    })
  })

  describe('create', () => {
    it('should call productsService.create(dto) with the correct dto parameter', async () => {
      const dto = {
        name: 'New Product',
        description: 'A description',
        price: 29.99,
        stock: 10
      }

      await controller.create(dto)

      expect(serviceCreate).toHaveBeenCalledWith(dto)
    })
  })

  describe('update', () => {
    it('should call productsService.update(id, dto) with the correct id and dto parameters', async () => {
      const productId = 'product-123'
      const dto = {
        name: 'Updated Product',
        price: 39.99
      }

      await controller.update(productId, dto)

      expect(serviceUpdate).toHaveBeenCalledWith(productId, dto)
    })
  })

  describe('remove', () => {
    it('should call productsService.remove(id) with the correct id parameter', async () => {
      const productId = 'product-123'

      await controller.remove(productId)

      expect(serviceRemove).toHaveBeenCalledWith(productId)
    })
  })
})
