import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Server } from 'node:http'
import { LoggerService } from 'src/common/logger.service'
import { PrismaService } from 'src/database/prisma.service'
import request from 'supertest'
import { AppModule } from '../src/app.module'

interface RoleResponse {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

describe('AppController (e2e)', () => {
  let app: INestApplication<Server>
  const mockRoles: RoleResponse[] = [
    {
      id: '1',
      name: 'admin',
      description: 'Administrator',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'user',
      description: 'Regular user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  const mockPrismaService = {
    role: {
      findMany: () => Promise.resolve(mockRoles)
    }
  }
  const mockLoggerService = {
    info: () => {}
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(LoggerService)
      .useValue(mockLoggerService)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect({ message: 'Hello World!' })
  })

  it('/roles (GET) should return array of roles', async () => {
    const response = await request(app.getHttpServer()).get('/roles').expect(200)
    const roles = response.body as RoleResponse[]

    expect(roles).toHaveLength(2)
    expect(roles[0]).toHaveProperty('name')
    expect(roles[0]).toHaveProperty('description')
  })

  it('/roles (GET) should not return user data', async () => {
    const response = await request(app.getHttpServer()).get('/roles').expect(200)
    const roles = response.body as RoleResponse[]

    expect(roles[0]).not.toHaveProperty('email')
    expect(roles[0]).not.toHaveProperty('password')
  })
})
