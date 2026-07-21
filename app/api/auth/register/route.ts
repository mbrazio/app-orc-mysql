import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import pool from '@/lib/db'
import { hashPassword, signToken, setSessionCookie } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

interface UserRow extends RowDataPacket {
  id: string
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    const [existing] = await pool.execute<UserRow[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existing.length > 0) {
      return NextResponse.json({ message: 'E-mail já cadastrado.' }, { status: 400 })
    }

    const userId = uuidv4()
    const passwordHash = await hashPassword(password)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      await connection.execute(
        'INSERT INTO users (id, name, email, password_hash, currency) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, passwordHash, 'BRL']
      )

      // Inserir categorias padrão do sistema
      const defaultCategories = [
        [uuidv4(), userId, 'Alimentação', 'Utensils', '#EF4444', 1],
        [uuidv4(), userId, 'Transporte', 'Car', '#3B82F6', 1],
        [uuidv4(), userId, 'Moradia', 'Home', '#10B981', 1],
        [uuidv4(), userId, 'Saúde', 'HeartPulse', '#F59E0B', 1],
        [uuidv4(), userId, 'Lazer', 'Gamepad2', '#8B5CF6', 1],
        [uuidv4(), userId, 'Salário', 'Briefcase', '#10B981', 1],
      ]

      for (const cat of defaultCategories) {
        await connection.execute(
          'INSERT INTO categories (id, user_id, name, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?)',
          cat
        )
      }

      await connection.commit()
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }

    const token = await signToken({ userId, email, name })
    await setSessionCookie(token)

    return NextResponse.json({ user: { id: userId, name, email } })
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string }
    console.error('Erro no cadastro:', error)
    const detailMsg = err?.message ? `: ${err.message}` : ''
    return NextResponse.json(
      { message: `Erro ao cadastrar usuário${detailMsg}` },
      { status: 500 }
    )
  }
}
