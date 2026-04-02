import { Prisma } from '@generated'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'
import { ProductsService } from './products.service'

const productsFactory = (count: number) => {
  const products = []

  for (let i = 1; i <= count; i++) {
    products.push({
      id: `product-${i}`,
      name: `Product ${i}`,
      description: `Description for product ${i}`,
      price: i * 10.99,
      stock: i * 5,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  return products
}

describe('ProductsService', () => {
  let service: ProductsService
  let prismaFindMany: ReturnType<typeof mock>
  let prismaFindUnique: ReturnType<typeof mock>
  let prismaCreate: ReturnType<typeof mock>
  let prismaUpdate: ReturnType<typeof mock>
  let prismaDelete: ReturnType<typeof mock>
  let loggerInfo: ReturnType<typeof mock>
  let loggerError: ReturnType<typeof mock>

  beforeEach(async () => {
    const mockProduct = productsFactory(1)[0]

    prismaFindMany = mock(() => Promise.resolve(productsFactory(5)))
    prismaFindUnique = mock(() => Promise.resolve(mockProduct))
    prismaCreate = mock(() => Promise.resolve(mockProduct))
    prismaUpdate = mock(() => Promise.resolve(mockProduct))
    prismaDelete = mock(() => Promise.resolve(mockProduct))
    loggerInfo = mock(() => {})
    loggerError = mock(() => {})

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: prismaFindMany,
              findUnique: prismaFindUnique,
              create: prismaCreate,
              update: prismaUpdate,
              delete: prismaDelete
            }
          }
        },
        {
          provide: LoggerService,
          useValue: { info: loggerInfo, error: loggerError, warn: mock(() => {}) }
        }
      ]
    }).compile()

    service = module.get<ProductsService>(ProductsService)
  })

  afterEach(() => {
    mock.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return all products ordered by createdAt desc', async () => {
      const result = await service.findAll()

      expect(prismaFindMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      })
      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(5)
      expect(result[0].name).toBe('Product 1')
    })
  })

  describe('findOne', () => {
    it('should return the product by ID', async () => {
      const mockProduct = productsFactory(1)[0]

      const result = await service.findOne(mockProduct.id)

      expect(prismaFindUnique).toHaveBeenCalledWith({
        where: { id: mockProduct.id }
      })
      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result.id).toBe(mockProduct.id)
      expect(result.name).toBe(mockProduct.name)
    })

    it('should throw NotFoundException when product does not exist', () => {
      prismaFindUnique.mockImplementationOnce(() => Promise.resolve(null))

      expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create a new product and return it', async () => {
      const dto = {
        name: 'New Product',
        description: 'A new product',
        price: 29.99,
        stock: 10
      }

      const result = await service.create(dto)

      expect(prismaCreate).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          stock: dto.stock
        }
      })
      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result).toBeDefined()
    })

    it('should default stock to 0 when not provided', async () => {
      const dto = {
        name: 'No Stock Product',
        price: 15.0
      }

      await service.create(dto)

      expect(prismaCreate).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: undefined,
          price: dto.price,
          stock: 0
        }
      })
    })

    it('should throw BadRequestException when stock is negative', () => {
      const dto = { name: 'Negative Stock', price: 10.0, stock: -5 }

      expect(service.create(dto)).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('should update the product and return it', async () => {
      const productId = 'product-1'
      const dto = { name: 'Updated Product', price: 39.99 }
      const updatedProduct = { ...productsFactory(1)[0], ...dto }

      prismaUpdate.mockImplementationOnce(() => Promise.resolve(updatedProduct))

      const result = await service.update(productId, dto)

      expect(prismaUpdate).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          name: dto.name,
          description: undefined,
          price: dto.price,
          stock: undefined
        }
      })
      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result.name).toBe(dto.name)
    })

    it('should throw NotFoundException when product does not exist', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.18.0'
      })
      prismaUpdate.mockImplementationOnce(() => Promise.reject(error))

      expect(service.update('non-existent', { name: 'Test' })).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when stock is negative', () => {
      expect(service.update('product-1', { stock: -5 })).rejects.toThrow(BadRequestException)
    })
  })

  describe('remove', () => {
    it('should delete the product and return it', async () => {
      const productId = 'product-1'

      prismaDelete.mockImplementationOnce(() => Promise.resolve(productsFactory(1)[0]))
      const result = await service.remove(productId)

      expect(prismaDelete).toHaveBeenCalledWith({
        where: { id: productId }
      })
      expect(loggerInfo).toHaveBeenCalledTimes(2)
      expect(result.id).toBe(productId)
    })

    it('should throw NotFoundException when product does not exist', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.18.0'
      })
      prismaDelete.mockImplementationOnce(() => Promise.reject(error))

      expect(service.remove('non-existent')).rejects.toThrow(NotFoundException)
    })
  })
})
