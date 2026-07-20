import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'finance_flow_mysql_jwt_secret_key_default_32chars'
)

export const AUTH_COOKIE_NAME = 'auth_token'

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export async function signToken(payload: { userId: string; email: string; name: string }): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET_KEY)
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; name: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    }
  } catch {
    return null
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) return null

  const decoded = await verifyToken(token)
  if (!decoded) return null

  return {
    id: decoded.userId,
    email: decoded.email,
    name: decoded.name,
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
