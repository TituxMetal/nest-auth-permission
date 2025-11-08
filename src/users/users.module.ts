import { Module } from '@nestjs/common'
import { CommonModule } from '~/common/common.module'
import { DatabaseModule } from '~/database/database.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
