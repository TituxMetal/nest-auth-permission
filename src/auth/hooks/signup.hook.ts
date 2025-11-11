import { User } from '@generated'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AfterHook, AuthHookContext, Hook } from '@thallesp/nestjs-better-auth'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'

// Extend Better Auth's context with typed body
export interface SignupHookContext extends AuthHookContext {
  body: {
    email: string
    password: string
    name: string
  }
}

@Hook()
@Injectable()
export class SignupHook {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService
  ) {}

  @AfterHook('/sign-up/email')
  async handle(ctx: SignupHookContext) {
    const email = ctx.body.email
    const isProd = this.config.get<string>('NODE_ENV') === 'production'

    // Check if user was actually created by Better Auth
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      // Signup failed (validation error, duplicate email, etc.)
      // Better Auth already returned appropriate error to client
      // Just exit gracefully without throwing
      if (!isProd) {
        this.logger.debug('Signup hook skipped - user not created', { email })
      }
      return
    }

    // User exists - assign role
    try {
      const isAdmin = this.isAdminEmail(email)

      if (!isProd)
        this.logger.info('User role assigned in signup hook', { role: isAdmin ? 'ADMIN' : 'USER' })

      const updatedUser = await this.assignUserRole(email, isAdmin)

      if (updatedUser && !isProd)
        this.logger.info('Successfully signed up user in signup hook:', { user: updatedUser })
    } catch (error) {
      if (!isProd) {
        this.logger.error('Failed to assign role in signup hook', {
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
