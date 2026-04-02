import { PrismaClient } from '@generated'
import { hash, verify } from 'argon2'
import { betterAuth, BetterAuthOptions } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

export const createBetterAuthConfig = (prisma: PrismaClient) => {
  const config = {
    baseURL: process.env.BETTER_AUTH_BASE_URL ?? 'http://localhost:3000/api/auth',
    database: prismaAdapter(prisma, {
      provider: 'sqlite'
    }),
    user: {
      additionalFields: {
        role: {
          type: 'string' as const,
          required: false,
          returned: true,
          fieldName: 'roleName'
        }
      }
    },
    emailAndPassword: {
      enabled: true,
      // Better Auth handles signup directly — hooks assign roles after signup
      minPasswordLength: 8,
      autoSignIn: true,
      password: {
        hash: async (password: string) => await hash(password),
        verify: async ({ hash: hashedPassword, password }) => verify(hashedPassword, password)
      }
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24 // 1 day
    },
    // Hooks are used to inject custom logic into Better Auth lifecycle
    // This allows us to assign roles after user signup
    hooks: {}
  } satisfies BetterAuthOptions

  return betterAuth(config)
}

export type AuthInstance = ReturnType<typeof createBetterAuthConfig>['api']
