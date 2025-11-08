import { Prisma } from '@generated'

export type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true }
}>
