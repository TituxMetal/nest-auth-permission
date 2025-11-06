import { Body, Controller, Post } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { LoggerService } from '~/common/logger.service'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService
  ) {}

  @Post('signup')
  @AllowAnonymous()
  async signup(@Body() dto: SignupDto) {
    const signupUser = await this.authService.signup(dto)

    this.logger.info('Signup successful', { action: 'signup', signupUser })

    return signupUser
  }
}
