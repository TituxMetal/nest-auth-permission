import { User } from '@generated'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService as NestAuthService } from '@thallesp/nestjs-better-auth'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'
import { SignupDto } from './dto/signup.dto'
import { SignupResponseDto } from './dto/signupResponse.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly nestAuthService: NestAuthService,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async signup(dto: SignupDto): Promise<SignupResponseDto> {
    const isProd = this.config.get<string>('NODE_ENV') === 'production'

    try {
      const result = await this.nestAuthService.api.signUpEmail({
        body: { name: dto.name, email: dto.email, password: dto.password }
      })

      if (!isProd)
        this.logger.info('User signed up in service', { email: dto.email, name: dto.name })

      const isAdmin = this.isAdminEmail(dto.email)

      if (!isProd)
        this.logger.info('User role assigned in auth service', { role: isAdmin ? 'ADMIN' : 'USER' })

      const newUser = await this.assignUserRole(dto.email, isAdmin)

      if (newUser && !isProd)
        this.logger.info('Successfully signed up user in service:', { user: newUser })

      return result
    } catch (error) {
      if (!isProd) {
        this.logger.error('Failed to sign up user in service', {
          error: error instanceof Error ? error.message : String(error)
        })
      }

      throw new Error('Unable to create account')
    }
  }

  private isAdminEmail(email: string): boolean {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL')

    return adminEmail?.toLowerCase() === email.toLowerCase()
  }

  private async assignUserRole(email: string, isAdmin: boolean): Promise<User> {
    const adminOrUserRole = isAdmin ? 'ADMIN' : 'USER'

    return await this.prisma.$transaction(async tx => {
      const role = await tx.role.upsert({
        where: { name: adminOrUserRole },
        update: {},
        create: { name: adminOrUserRole, description: isAdmin ? 'Administrator' : 'Regular user' }
      })

      return await tx.user.update({ where: { email }, data: { roleId: role.id } })
    })
  }
}
