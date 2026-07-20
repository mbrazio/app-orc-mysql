import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import pool from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

interface TransactionJoinedRow extends RowDataPacket {
  id: string
  user_id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category_id: string | null
  date: string
  is_recurring: boolean
  recurrence_interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  created_at: string
  cat_id: string | null
  cat_name: string | null
  cat_icon: string | null
  cat_color: string | null
  cat_budget_limit: number | null
  cat_is_default: boolean | null
  cat_created_at: string | null
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let query = `
      SELECT 
        t.id, t.user_id, t.description, t.amount, t.type, t.category_id, 
        DATE_FORMAT(t.date, '%Y-%m-%d') as date, 
        t.is_recurring, t.recurrence_interval, t.created_at,
        c.id as cat_id, c.name as cat_name, c.icon as cat_icon, c.color as cat_color, 
        c.budget_limit as cat_budget_limit, c.is_default as cat_is_default, c.created_at as cat_created_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.deleted_at IS NULL
    `
    const params: (string | number)[] = [user.id]

    if (startDate) {
      query += ' AND t.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND t.date <= ?'
      params.push(endDate)
    }
    if (categoryId && categoryId !== 'all') {
      query += ' AND t.category_id = ?'
      params.push(categoryId)
    }
    if (type && type !== 'all') {
      query += ' AND t.type = ?'
      params.push(type)
    }
    if (search) {
      query += ' AND t.description LIKE ?'
      params.push(`%${search}%`)
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC'

    const [rows] = await pool.execute<TransactionJoinedRow[]>(query, params)

    const transactions = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      category_id: r.category_id,
      date: r.date,
      is_recurring: Boolean(r.is_recurring),
      recurrence_interval: r.recurrence_interval,
      created_at: r.created_at,
      categories: r.cat_id
        ? {
            id: r.cat_id,
            user_id: r.user_id,
            name: r.cat_name!,
            icon: r.cat_icon!,
            color: r.cat_color!,
            budget_limit: r.cat_budget_limit != null ? Number(r.cat_budget_limit) : null,
            is_default: Boolean(r.cat_is_default),
            created_at: r.cat_created_at!,
          }
        : null,
    }))

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
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
    const { description, amount, type, category_id, date, is_recurring, recurrence_interval } = body

    if (!description || amount == null || amount <= 0 || !type || !date) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes ou valor inválido' }, { status: 400 })
    }

    const id = uuidv4()

    await pool.execute(
      'INSERT INTO transactions (id, user_id, description, amount, type, category_id, date, is_recurring, recurrence_interval) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        user.id,
        description,
        amount,
        type,
        category_id || null,
        date,
        is_recurring ? 1 : 0,
        recurrence_interval || null,
      ]
    )

    return NextResponse.json(
      {
        id,
        user_id: user.id,
        description,
        amount: Number(amount),
        type,
        category_id: category_id || null,
        date,
        is_recurring: Boolean(is_recurring),
        recurrence_interval: recurrence_interval || null,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json({ message: 'Erro ao criar transação' }, { status: 500 })
  }
}
