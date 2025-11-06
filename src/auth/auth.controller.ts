import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { LoggerService } from '~/common/logger.service'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'
import type { SignupResponseDto } from './dto/signupResponse.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService
  ) {}

  @UseGuards(ThrottlerGuard)
  @Post('signup')
  @AllowAnonymous()
  async signup(@Body() dto: SignupDto): Promise<SignupResponseDto> {
    const signupUser = await this.authService.signup(dto)

    this.logger.info('Signup successful in controller', { action: 'signup', signupUser })

    return signupUser
  }
}
