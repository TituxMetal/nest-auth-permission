// test/helpers/testDatabase.ts
import { PrismaClient } from '@generated'
import { execSync } from 'child_process'
import { randomBytes } from 'crypto'
import { unlinkSync } from 'fs'

export type TestDatabase = {
  prisma: PrismaClient
  dbPath: string
}

export const setupTestDatabase = async (): Promise<TestDatabase> => {
  const dbName = `test-${randomBytes(8).toString('hex')}.db`
  /**
   * @copilot
   * /dev/shm is a RAM disk on Linux systems.
   * It is absolutely expected to NOT SUPPORT OTHER SYSTEMS AT ALL
   */
  const dbPath = `/dev/shm/${dbName}`
  const DATABASE_URL = `file:${dbPath}`

  const prisma = new PrismaClient({
    datasources: {
      db: { url: DATABASE_URL }
    }
  })

  await prisma.$connect()

  try {
    execSync('bunx --bun prisma db push --skip-generate --accept-data-loss', {
      env: { ...process.env, DATABASE_URL },
      stdio: 'pipe'
    })
  } catch (error) {
    await prisma.$disconnect()
    throw new Error(
      `Failed to push database schema: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  return { prisma, dbPath }
}

export const cleanupTestDatabase = async (prisma: PrismaClient, dbPath: string): Promise<void> => {
  // Delete all records in correct order (respects foreign key constraints)
  // Order: child tables first, then parent tables
  await prisma.verification.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany() // References user
  await prisma.user.deleteMany() // References role
  await prisma.role.deleteMany()

  // Disconnect before deleting the database file
  await prisma.$disconnect()

  // Delete the database file
  try {
    unlinkSync(dbPath)
  } catch (error) {
    // Ignore if file doesn't exist
    console.warn(`Failed to delete test database at ${dbPath}:`, error)
  }
}
