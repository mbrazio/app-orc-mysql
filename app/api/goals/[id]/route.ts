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
    const { name, target_amount, deadline, color } = body

    await pool.execute(
      `UPDATE goals SET 
        name = COALESCE(?, name),
        target_amount = COALESCE(?, target_amount),
        deadline = ?,
        color = COALESCE(?, color)
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [name ?? null, target_amount ?? null, deadline ?? null, color ?? null, id, user.id]
    )

    return NextResponse.json({ id, ...body })
  } catch (error) {
    console.error('Erro ao atualizar meta:', error)
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
      'UPDATE goals SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [id, user.id]
    )

    return NextResponse.json({ id })
  } catch (error) {
    console.error('Erro ao excluir meta:', error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
