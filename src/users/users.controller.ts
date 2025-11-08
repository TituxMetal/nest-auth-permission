import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
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

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserWithRole> {
    return this.usersService.create(dto)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserWithRole> {
    return this.usersService.update(id, dto)
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto): Promise<UserWithRole> {
    return this.usersService.updateRole(id, dto.roleId)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserWithRole> {
    return this.usersService.remove(id)
  }
}
