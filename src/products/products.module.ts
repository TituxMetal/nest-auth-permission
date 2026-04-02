import { Module } from '@nestjs/common'
import { CommonModule } from '~/common/common.module'
import { DatabaseModule } from '~/database/database.module'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}
