import { Controller, Get } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { AppService } from './app.service'
import { LoggerService } from './common/logger.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: LoggerService
  ) {}

  @AllowAnonymous()
  @Get()
  getHello(): { message: string } {
    this.logger.info('Hello World!', { action: 'getHello' })

    return this.appService.getHello()
  }
}
