import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import pool from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { toDecimal } from '@/lib/finance-math'
import { RowDataPacket } from 'mysql2'

interface GoalRow extends RowDataPacket {
  id: string
  current_amount: number
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { id: goalId } = await params
    const body = await request.json()
    const { amount, date, note } = body

    if (amount == null || amount <= 0 || !date) {
      return NextResponse.json({ message: 'Valor deve ser positivo e data é obrigatória' }, { status: 400 })
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Buscar a meta pertencente ao usuário
      const [goals] = await connection.execute<GoalRow[]>(
        'SELECT id, current_amount FROM goals WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        [goalId, user.id]
      )

      if (goals.length === 0) {
        await connection.rollback()
        return NextResponse.json({ message: 'Meta não encontrada' }, { status: 404 })
      }

      const goal = goals[0]
      const contribId = uuidv4()

      // 1. Inserir a contribuição na tabela goal_contributions
      await connection.execute(
        'INSERT INTO goal_contributions (id, goal_id, amount, date, note) VALUES (?, ?, ?, ?, ?)',
        [contribId, goalId, amount, date, note || null]
      )

      // 2. Somar o novo valor com Decimal.js (Regra financeira)
      const newCurrentAmount = toDecimal(goal.current_amount).plus(toDecimal(amount)).toNumber()

      // 3. Atualizar o current_amount da meta
      await connection.execute(
        'UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?',
        [newCurrentAmount, goalId, user.id]
      )

      await connection.commit()

      return NextResponse.json({
        contribution: { id: contribId, goal_id: goalId, amount, date, note },
        newCurrentAmount,
      })
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Erro ao adicionar contribuição:', error)
    return NextResponse.json({ message: 'Erro interno ao adicionar contribuição' }, { status: 500 })
  }
}
