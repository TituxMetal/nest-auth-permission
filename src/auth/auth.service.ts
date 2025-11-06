import { User } from '@generated'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'
// import { type authInstance } from './auth.config'
import { AuthService as NestAuthService } from '@thallesp/nestjs-better-auth'
import { SignupDto } from './dto/signup.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly nestAuthService: NestAuthService,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async signup(dto: SignupDto) {
    const result = await this.nestAuthService.api.signUpEmail({
      body: { name: dto.name, email: dto.email, password: dto.password }
    })

    const isProd = this.config.get<string>('NODE_ENV') === 'production' || false

    if (!isProd) this.logger.info('User signed up', { email: dto.email, name: dto.name })

    const isAdmin = this.isAdminEmail(dto.email)

    if (!isProd) this.logger.info('User role assigned', { role: isAdmin ? 'ADMIN' : 'USER' })

    const newUser = await this.assignUserRole(dto.email, isAdmin)

    if (newUser && !isProd) this.logger.info('Successfully signed up user:', { user: newUser })

    return result
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
