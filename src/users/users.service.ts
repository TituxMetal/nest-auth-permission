import { Prisma } from '@generated'
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { hash } from 'argon2'
import { LoggerService } from '~/common/logger.service'
import { PrismaService } from '~/database/prisma.service'
import { CreateUserDto, UpdateUserDto } from './dto'
import { UserWithRole } from './types'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {}

  async findAll(): Promise<UserWithRole[]> {
    this.logger.info('Fetching all users in service', { action: 'findAll' })

    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { role: true }
    })

    this.logger.info('Users fetched successfully in service', {
      action: 'findAll',
      count: users.length
    })

    return users
  }

  async findOne(id: string): Promise<UserWithRole> {
    this.logger.info('Fetching user by ID in service', { action: 'findOne', userId: id })

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { role: true }
      })

      if (!user) {
        throw new NotFoundException('User not found')
      }

      this.logger.info('User fetched successfully in service', { action: 'findOne', userId: id })

      return user
    } catch (error) {
      this.logger.error('Failed to fetch user in service', {
        action: 'findOne',
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  }

  async create(dto: CreateUserDto): Promise<UserWithRole | null> {
    this.logger.info('Creating user in service', { action: 'create', email: dto.email })

    try {
      const hashedPassword = await hash(dto.password)

      const user = await this.prisma.$transaction(async tx => {
        let roleId = dto.roleId

        if (!roleId) {
          const userRole = await tx.role.upsert({
            where: { name: 'USER' },
            update: {},
            create: { name: 'USER', description: 'Regular user' }
          })

          roleId = userRole.id
        }

        const createdUser = await tx.user.create({
          include: { role: true },
          data: {
            email: dto.email,
            name: dto.name,
            roleId
          }
        })
        await tx.account.create({
          data: {
            userId: createdUser.id,
            providerId: 'credential',
            accountId: createdUser.id,
            password: hashedPassword
          }
        })

        return createdUser
      })

      this.logger.info('User created successfully in service', {
        action: 'create',
        userId: user.id
      })

      return user
    } catch (error) {
      this.logger.error('Failed to create user in service', {
        action: 'create',
        error: error instanceof Error ? error.message : String(error)
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn('Duplicate email detected in service', { action: 'create' })
        throw new UnprocessableEntityException('Invalid Credentials')
      }

      throw error
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserWithRole | null> {
    this.logger.info('Updating user in service', { action: 'update', userId: id })

    try {
      const hashedPassword = dto.password && (await hash(dto.password))

      const updatedUser = await this.prisma.$transaction(async tx => {
        const user = await tx.user.update({
          where: { id },
          data: {
            name: dto.name,
            email: dto.email
          },
          include: { role: true }
        })

        if (hashedPassword) {
          await tx.account.updateMany({
            where: {
              userId: id,
              accountId: id,
              providerId: 'credential'
            },
            data: { password: hashedPassword }
          })
        }

        return user
      })

      this.logger.info('User updated successfully in service', {
        action: 'update',
        userId: id
      })

      return updatedUser
    } catch (error) {
      this.logger.error('Failed to update user in service', {
        action: 'update',
        error: error instanceof Error ? error.message : String(error)
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found')
      }

      throw error
    }
  }

  async updateRole(id: string, roleId: string): Promise<UserWithRole> {
    this.logger.info('Updating user role in service', { action: 'updateRole', userId: id, roleId })

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { roleId },
        include: { role: true }
      })

      this.logger.info('User role updated successfully in service', {
        action: 'updateRole',
        userId: id
      })

      return updatedUser
    } catch (error) {
      this.logger.error('Failed to update user role in service', {
        action: 'updateRole',
        error: error instanceof Error ? error.message : String(error)
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found')
      }

      throw error
    }
  }

  async remove(id: string): Promise<UserWithRole> {
    this.logger.info('Deleting user in service', { action: 'remove', userId: id })

    try {
      const deletedUser = await this.prisma.user.delete({
        where: { id },
        include: { role: true }
      })

      this.logger.info('User deleted successfully in service', {
        action: 'remove',
        userId: id
      })

      return deletedUser
    } catch (error) {
      this.logger.error('Failed to delete user in service', {
        action: 'remove',
        error: error instanceof Error ? error.message : String(error)
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found')
      }

      throw error
    }
  }
}
