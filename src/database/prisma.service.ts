import { PrismaClient } from '@generated'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get<string>('DATABASE_URL')
        }
      },
      log: ['query', 'info', 'warn', 'error']
    })
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }
}
