import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verifyPassword, signToken, setSessionCookie } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

interface UserRow extends RowDataPacket {
  id: string
  name: string
  email: string
  password_hash: string
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    )

    if (rows.length === 0) {
      return NextResponse.json({ message: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    const user = rows[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json({ message: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })
    await setSessionCookie(token)

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Erro no login:', error)
    const detailMsg = err?.message ? `: ${err.message}` : ''
    return NextResponse.json({ message: `Erro interno no servidor${detailMsg}` }, { status: 500 })
  }
}
