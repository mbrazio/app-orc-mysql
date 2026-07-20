import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, icon, color, budget_limit } = body

    const limit = budget_limit != null && budget_limit !== '' ? Number(budget_limit) : null

    await pool.execute(
      'UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon), color = COALESCE(?, color), budget_limit = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [name, icon, color, limit, id, user.id]
    )

    return NextResponse.json({ id, name, icon, color, budget_limit: limit })
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Regra 1: Soft Delete (substituindo exclusão física por atualização de deleted_at)
    await pool.execute(
      'UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, user.id]
    )

    return NextResponse.json({ id })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
