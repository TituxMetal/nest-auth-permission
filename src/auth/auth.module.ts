import { Module } from '@nestjs/common'
import {
  AuthModule as NestAuthModule,
  AuthService as NestAuthService
} from '@thallesp/nestjs-better-auth'
import { CommonModule } from '~/common/common.module'
import { DatabaseModule } from '~/database/database.module'
import { PrismaService } from '~/database/prisma.service'
import { createBetterAuthConfig } from './auth.config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    NestAuthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({
        auth: createBetterAuthConfig(prisma)
      })
    })
  ],
  controllers: [AuthController],
  providers: [NestAuthService, AuthService],
  exports: [AuthService]
})
export class AuthModule {}
