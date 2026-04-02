import { Prisma } from '@generated'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'
import { CreateProductDto, UpdateProductDto } from './dto'
import { Product } from './types'

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {}

  async findAll(): Promise<Product[]> {
    this.logger.info('Fetching all products in service', { action: 'findAll' })

    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })

    this.logger.info('Products fetched successfully in service', {
      action: 'findAll',
      count: products.length
    })

    return products
  }

  async findOne(id: string): Promise<Product> {
    this.logger.info('Fetching product by ID in service', { action: 'findOne', productId: id })

    try {
      const product = await this.prisma.product.findUnique({
        where: { id }
      })

      if (!product) {
        throw new NotFoundException('Product not found')
      }

      this.logger.info('Product fetched successfully in service', {
        action: 'findOne',
        productId: id
      })

      return product
    } catch (error) {
      this.logger.error('Failed to fetch product in service', {
        action: 'findOne',
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  }

  async create(dto: CreateProductDto): Promise<Product> {
    this.logger.info('Creating product in service', { action: 'create', name: dto.name })

    try {
      const stock = dto.stock ?? 0

      if (stock < 0) {
        throw new BadRequestException('Stock cannot be negative')
      }

      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          stock
        }
      })

      this.logger.info('Product created successfully in service', {
        action: 'create',
        productId: product.id
      })

      return product
    } catch (error) {
      this.logger.error('Failed to create product in service', {
        action: 'create',
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    this.logger.info('Updating product in service', { action: 'update', productId: id })

    try {
      if (dto.stock !== undefined && dto.stock < 0) {
        throw new BadRequestException('Stock cannot be negative')
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          stock: dto.stock
        }
      })

      this.logger.info('Product updated successfully in service', {
        action: 'update',
        productId: id
      })

      return product
    } catch (error) {
      this.logger.error('Failed to update product in service', {
        action: 'update',
        error: error instanceof Error ? error.message : String(error)
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Product not found')
      }

      throw error
    }
  }

  async remove(id: string): Promise<Product> {
    this.logger.info('Deleting product in service', { action: 'remove', productId: id })

    try {
      const deletedProduct = await this.prisma.product.delete({
        where: { id }
      })

      this.logger.info('Product deleted successfully in service', {
        action: 'remove',
        productId: id
      })

      return deletedProduct
    } catch (error) {
      this.logger.error('Failed to delete product in service', {
        action: 'remove',
        error: error instanceof Error ? error.message : String(error)
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Product not found')
      }

      throw error
    }
  }
}
