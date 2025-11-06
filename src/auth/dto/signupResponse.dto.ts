export class SignupResponseDto {
  user!: {
    id: string
    email: string
    name: string
    image: string | null | undefined
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  }
  token!: string | null
}
