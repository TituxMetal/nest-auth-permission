import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { Roles } from '@thallesp/nestjs-better-auth'
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto } from './dto'
import { UserWithRole } from './types'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserWithRole[]> {
    return this.usersService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserWithRole> {
    return this.usersService.findOne(id)
  }

  @Roles(['ADMIN'])
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserWithRole | null> {
    return this.usersService.create(dto)
  }

  @Roles(['ADMIN'])
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserWithRole | null> {
    return this.usersService.update(id, dto)
  }

  @Roles(['ADMIN'])
  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto): Promise<UserWithRole> {
    return this.usersService.updateRole(id, dto.roleId)
  }

  @Roles(['ADMIN'])
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserWithRole> {
    return this.usersService.remove(id)
  }
}
