import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name!: string

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string

  @IsOptional()
  @IsUUID()
  roleId?: string
}
