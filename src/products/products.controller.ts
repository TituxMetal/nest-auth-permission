import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { Roles } from '@thallesp/nestjs-better-auth'
import { CreateProductDto, UpdateProductDto } from './dto'
import { Product } from './types'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id)
  }

  @Roles(['ADMIN'])
  @Post()
  async create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto)
  }

  @Roles(['ADMIN'])
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<Product> {
    return this.productsService.update(id, dto)
  }

  @Roles(['ADMIN'])
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Product> {
    return this.productsService.remove(id)
  }
}
