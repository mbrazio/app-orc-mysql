import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import pool from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

interface GoalRow extends RowDataPacket {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  color: string
  created_at: string
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const [rows] = await pool.execute<GoalRow[]>(
      "SELECT id, user_id, name, target_amount, current_amount, DATE_FORMAT(deadline, '%Y-%m-%d') as deadline, color, created_at FROM goals WHERE user_id = ? AND deleted_at IS NULL ORDER BY deadline ASC",
      [user.id]
    )

    const goals = rows.map((g) => ({
      ...g,
      target_amount: Number(g.target_amount),
      current_amount: Number(g.current_amount),
    }))

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Erro ao buscar metas:', error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, target_amount, deadline, color } = body

    if (!name || target_amount == null || target_amount <= 0 || !color) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes ou target_amount inválido' }, { status: 400 })
    }

    const id = uuidv4()

    await pool.execute(
      'INSERT INTO goals (id, user_id, name, target_amount, current_amount, deadline, color) VALUES (?, ?, ?, ?, 0.00, ?, ?)',
      [id, user.id, name, target_amount, deadline || null, color]
    )

    return NextResponse.json(
      {
        id,
        user_id: user.id,
        name,
        target_amount: Number(target_amount),
        current_amount: 0,
        deadline: deadline || null,
        color,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar meta:', error)
    return NextResponse.json({ message: 'Erro ao criar meta' }, { status: 500 })
  }
}
