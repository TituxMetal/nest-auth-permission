import { PrismaClient } from '@generated'
import { betterAuth, BetterAuthOptions } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

export const createBetterAuthConfig = (prisma: PrismaClient) => {
  const config = {
    baseURL: process.env.BETTER_AUTH_BASE_URL ?? 'http://localhost:3000/api/auth',
    database: prismaAdapter(prisma, {
      provider: 'sqlite'
    }),
    // Disable default signup endpoint since we have a custom one that does role assignment
    disabledPaths: ['/sign-up/email'],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24 // 1 day
    }
  } satisfies BetterAuthOptions

  return betterAuth(config)
}

export type authInstance = ReturnType<typeof createBetterAuthConfig>['api']
