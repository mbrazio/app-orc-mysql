import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import pool from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

interface CategoryRow extends RowDataPacket {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  budget_limit: number | null
  is_default: boolean
  created_at: string
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const [rows] = await pool.execute<CategoryRow[]>(
      'SELECT id, user_id, name, icon, color, budget_limit, is_default, created_at FROM categories WHERE user_id = ? AND deleted_at IS NULL ORDER BY name ASC',
      [user.id]
    )

    const categories = rows.map((cat) => ({
      ...cat,
      is_default: Boolean(cat.is_default),
      budget_limit: cat.budget_limit != null ? Number(cat.budget_limit) : null,
    }))

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
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
    const { name, icon, color, budget_limit } = body

    if (!name || !icon || !color) {
      return NextResponse.json({ message: 'Campos nome, ícone e cor são obrigatórios' }, { status: 400 })
    }

    const id = uuidv4()
    const limit = budget_limit != null && budget_limit !== '' ? Number(budget_limit) : null

    await pool.execute(
      'INSERT INTO categories (id, user_id, name, icon, color, budget_limit, is_default) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [id, user.id, name, icon, color, limit]
    )

    const newCat = {
      id,
      user_id: user.id,
      name,
      icon,
      color,
      budget_limit: limit,
      is_default: false,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json(newCat, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json({ message: 'Erro ao criar categoria' }, { status: 500 })
  }
}
