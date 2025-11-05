import { Module } from '@nestjs/common'
import { LoggerService } from './logger.service'

@Module({
  providers: [{ provide: LoggerService, useFactory: () => new LoggerService('CommonModule') }],
  exports: [LoggerService]
})
export class CommonModule {}
