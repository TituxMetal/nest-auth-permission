import { Injectable } from '@nestjs/common'
import { PrismaService } from './database/prisma.service'

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): { message: string } {
    return { message: 'Hello World!' }
  }

  async getRoles() {
    const roles = await this.prisma.role.findMany()

    return roles
  }
}
