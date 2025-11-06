import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param
} from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { AppService } from './app.service'
import { LoggerService } from './common/logger.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: LoggerService
  ) {}

  @Get()
  getHello(): { message: string } {
    return this.appService.getHello()
  }

  @AllowAnonymous()
  @Get('roles')
  async getRoles() {
    const roles = await this.appService.getRoles()

    this.logger.info('Roles retrieved', { action: 'getRoles', roles })

    return roles
  }

  // Error handling demo endpoints
  @Get('demo/not-found')
  demoNotFound(): never {
    throw new NotFoundException('This resource does not exist')
  }

  @Get('demo/bad-request')
  demoBadRequest(): never {
    throw new BadRequestException('Invalid input parameters')
  }

  @Get('demo/server-error')
  demoServerError(): never {
    throw new InternalServerErrorException('Something went wrong on the server')
  }

  @Get('demo/unexpected-error')
  demoUnexpectedError(): never {
    throw new Error('Unexpected error occurred')
  }

  @Get('demo/throw-string')
  demoThrowString(): never {
    // Intentionally throwing a non-Error object to test error handling robustness
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw 'Plain string error'
  }

  @Get('demo/user/:id')
  demoUserNotFound(@Param('id') id: string) {
    const validId = '123'

    if (id !== validId) {
      throw new NotFoundException(`User with ID "${id}" not found`)
    }

    return { id, name: 'Demo User' }
  }
}
