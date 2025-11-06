import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { CommonModule } from './common/common.module'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, CommonModule, AuthModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
