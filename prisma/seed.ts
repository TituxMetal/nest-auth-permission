import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { Prisma, PrismaClient, Role, User } from './generated/prisma/client'

const databaseUrl = 'file:./prisma/dev.db'

console.log(`Database url: ${databaseUrl}`)

const prisma = new PrismaClient({
  adapter: new PrismaLibSQL({ url: databaseUrl })
})

type RoleCreateInput = Prisma.RoleCreateInput
type UserCreateManyInput = Prisma.UserCreateManyInput

const roleDefinitions: RoleCreateInput[] = [
  { name: 'ADMIN', description: 'Administrator role' },
  { name: 'PRODUCT_MANAGER', description: 'Product Manager role' },
  { name: 'USER', description: 'Regular user role' }
]

const clearDatabase = async (): Promise<void> => {
  console.log('🧹 Clearing existing data...')

    try {
      await prisma.$transaction(async tx => {
        const users = await tx.user.deleteMany()
        console.log(`Users deleted: ${users.count}`)

        const roles = await tx.role.deleteMany()
        console.log(`Roles deleted: ${roles.count}`)
      })
    } catch (error) {
      console.error('❌ Clearing database failed:', error)
    }
}

const seedRoles = async (): Promise<Role[]> => {
  const roles = await Promise.all(
    roleDefinitions.map(roleData => prisma.role.create({ data: roleData }))
  )

  console.log('Roles created:', roles.map(role => role.name))

  return roles
}

const seedUsers = async (roles: Role[]): Promise<User[]> => {
  const adminRole = roles.find(role => role.name === 'ADMIN')!
  const managerRole = roles.find(role => role.name === 'PRODUCT_MANAGER')!
  const userRole = roles.find(role => role.name === 'USER')!

  const users: UserCreateManyInput[] = [
    {
      email: 'admin@example.com',
      name: 'Admin User',
      roleId: adminRole.id
    },
    {
      email: 'manager@example.com',
      name: 'Manager User',
      roleId: managerRole.id
    },
    {
      email: 'user@example.com',
      name: 'Regular User',
      roleId: userRole.id
    }
  ]

  const createdUsers = await Promise.all(
    users.map(user => prisma.user.create({ data: user }))
  )

  console.log('Users created:', createdUsers.map(user => user.name))

  return createdUsers

}

const seedDatabase = async (): Promise<void> => {
  console.log('👤 Seeding roles...')
  const roles = await seedRoles()
  console.log(`Created ${roles.length} roles`)

  console.log('👤 Seeding users...')
  const users = await seedUsers(roles)
  console.log(`Created ${users.length} users`)
}

const main = async (): Promise<void> => {
  console.log('🌱 Starting database seed...\n')

  await clearDatabase()
  await seedDatabase()

  console.log('\n🎉 Seeding completed successfully')
}

main()
  .catch(error => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
