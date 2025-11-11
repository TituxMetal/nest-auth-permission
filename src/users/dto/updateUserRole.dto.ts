import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsString()
  roleId!: string
}
