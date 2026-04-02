import { Prisma, PrismaClient, Product, Role, User } from '@generated'

const databaseUrl = 'file:./prisma/dev.db'

console.log(`Database url: ${databaseUrl}`)

const prisma = new PrismaClient()

type RoleCreateInput = Prisma.RoleCreateInput
type UserCreateManyInput = Prisma.UserCreateManyInput
type ProductCreateInput = Prisma.ProductCreateInput

const roleDefinitions: RoleCreateInput[] = [
  { name: 'ADMIN', description: 'Administrator role' },
  { name: 'PRODUCT_MANAGER', description: 'Product Manager role' },
  { name: 'USER', description: 'Regular user role' }
]

const clearDatabase = async (): Promise<void> => {
  console.log('🧹 Clearing existing data...')

  try {
    await prisma.$transaction(async tx => {
      const products = await tx.product.deleteMany()
      console.log(`Products deleted: ${products.count}`)

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

  console.log(
    'Roles created:',
    roles.map(role => role.name)
  )

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
      roleId: adminRole.id,
      roleName: adminRole.name
    },
    {
      email: 'manager@example.com',
      name: 'Manager User',
      roleId: managerRole.id,
      roleName: managerRole.name
    },
    {
      email: 'user@example.com',
      name: 'Regular User',
      roleId: userRole.id,
      roleName: userRole.name
    }
  ]

  const createdUsers = await Promise.all(users.map(user => prisma.user.create({ data: user })))

  console.log(
    'Users created:',
    createdUsers.map(user => user.name)
  )

  return createdUsers
}

const seedProducts = async (): Promise<Product[]> => {
  const productDefinitions: ProductCreateInput[] = [
    {
      name: 'Product A',
      description: 'Description for Product A',
      price: 19.99,
      stock: 100
    },
    {
      name: 'Product B',
      description: 'Description for Product B',
      price: 29.99,
      stock: 50
    },
    {
      name: 'Product C',
      description: 'Description for Product C',
      price: 9.99,
      stock: 200
    }
  ]

  const products = await Promise.all(
    productDefinitions.map(productData => prisma.product.create({ data: productData }))
  )

  console.log(
    'Products created:',
    products.map(product => product.name)
  )

  return products
}

const seedDatabase = async (): Promise<void> => {
  console.log('👤 Seeding roles...')
  const roles = await seedRoles()
  console.log(`Created ${roles.length} roles`)

  console.log('👤 Seeding users...')
  const users = await seedUsers(roles)
  console.log(`Created ${users.length} users`)

  console.log('📦 Seeding products...')
  const products = await seedProducts()
  console.log(`Created ${products.length} products`)
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
