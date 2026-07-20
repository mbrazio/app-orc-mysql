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

    const { description, amount, type, category_id, date, is_recurring, recurrence_interval } = body

    await pool.execute(
      `UPDATE transactions SET 
        description = COALESCE(?, description),
        amount = COALESCE(?, amount),
        type = COALESCE(?, type),
        category_id = ?,
        date = COALESCE(?, date),
        is_recurring = COALESCE(?, is_recurring),
        recurrence_interval = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [
        description ?? null,
        amount ?? null,
        type ?? null,
        category_id ?? null,
        date ?? null,
        is_recurring !== undefined ? (is_recurring ? 1 : 0) : null,
        recurrence_interval ?? null,
        id,
        user.id,
      ]
    )

    return NextResponse.json({ id, ...body })
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
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
      'UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, user.id]
    )

    return NextResponse.json({ id })
  } catch (error) {
    console.error('Erro ao excluir transação:', error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
