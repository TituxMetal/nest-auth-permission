// test/helpers/auth.helper.ts
import { INestApplication } from '@nestjs/common'
import { Server } from 'node:http'
import request from 'supertest'

export type AuthenticatedUser = {
  user: {
    id: string
    email: string
    name: string
  }
  token: string
}

export interface SignupResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export const createAuthenticatedUser = async (
  app: INestApplication<Server>,
  userData?: { email?: string; password?: string; name?: string }
): Promise<AuthenticatedUser> => {
  const email = userData?.email ?? `test-${Date.now()}@example.com`
  const password = userData?.password ?? 'password123'
  const name = userData?.name ?? 'Test User'

  const response = await request(app.getHttpServer())
    .post('/api/auth/sign-up/email')
    .send({ email, password, name })
    .expect(200)
  const body = response.body as SignupResponse

  const setCookieHeader = response.headers['set-cookie']

  if (!setCookieHeader) {
    throw new Error('No set-cookie header found in signup response')
  }

  const cookies: string[] = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  const sessionCookie = cookies.find((cookie: string) =>
    cookie.startsWith('better-auth.session_token')
  )

  if (!sessionCookie) {
    throw new Error('No session cookie found in signup response')
  }

  return {
    user: {
      id: body.user.id,
      email: body.user.email,
      name: body.user.name
    },
    token: sessionCookie
  }
}
