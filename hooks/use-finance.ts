'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Category, Transaction, Goal } from '@/types'

// Chaves de Consulta (Query Keys)
export const financeKeys = {
  profile: ['profile'] as const,
  categories: ['categories'] as const,
  transactions: (filters?: {
    startDate?: string
    endDate?: string
    categoryId?: string
    type?: 'income' | 'expense' | 'all'
    search?: string
  }) => ['transactions', filters] as const,
  goals: ['goals'] as const,
  contributions: (goalId?: string) => ['contributions', goalId] as const,
}

// ----------------------------------------------------
// 1. HOOKS DE CATEGORIAS
// ----------------------------------------------------

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: financeKeys.categories,
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) {
        throw new Error('Falha ao carregar categorias')
      }
      const data = await res.json()
      return data.map((cat: Category) => ({
        ...cat,
        budget_limit: cat.budget_limit ? Number(cat.budget_limit) : null,
      }))
    },
  })
}

export function useAddCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newCategory: Omit<Category, 'id' | 'user_id' | 'is_default' | 'created_at'>) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao criar categoria')
      }
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updated: Partial<Category> & { id: string }) => {
      const res = await fetch(`/api/categories/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao atualizar categoria')
      }
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao excluir categoria')
      }
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// ----------------------------------------------------
// 2. HOOKS DE TRANSAÇÕES
// ----------------------------------------------------

export function useTransactions(filters?: {
  startDate?: string
  endDate?: string
  categoryId?: string
  type?: 'income' | 'expense' | 'all'
  search?: string
}) {
  return useQuery<Transaction[]>({
    queryKey: financeKeys.transactions(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.startDate) params.set('startDate', filters.startDate)
      if (filters?.endDate) params.set('endDate', filters.endDate)
      if (filters?.categoryId && filters.categoryId !== 'all') params.set('categoryId', filters.categoryId)
      if (filters?.type && filters.type !== 'all') params.set('type', filters.type)
      if (filters?.search) params.set('search', filters.search)

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Falha ao buscar transações')
      }
      const data = await res.json()

      return (data as Array<{
        id: string
        user_id: string
        description: string
        amount: string | number
        type: 'income' | 'expense'
        category_id: string | null
        date: string
        is_recurring: boolean
        recurrence_interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
        created_at: string
        categories: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          budget_limit: string | number | null
          is_default: boolean
          created_at: string
        } | null
      }>).map((t) => ({
        ...t,
        amount: Number(t.amount),
        categories: t.categories
          ? {
              ...t.categories,
              budget_limit: t.categories.budget_limit ? Number(t.categories.budget_limit) : null,
            }
          : null,
      }))
    },
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'categories'>) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao adicionar transação')
      }
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updated: Partial<Transaction> & { id: string }) => {
      const res = await fetch(`/api/transactions/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao atualizar transação')
      }
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao excluir transação')
      }
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// ----------------------------------------------------
// 3. HOOKS DE METAS (GOALS)
// ----------------------------------------------------

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: financeKeys.goals,
    queryFn: async () => {
      const res = await fetch('/api/goals')
      if (!res.ok) {
        throw new Error('Falha ao buscar metas')
      }
      const data = await res.json()
      return data.map((g: Goal) => ({
        ...g,
        target_amount: Number(g.target_amount),
        current_amount: Number(g.current_amount),
      }))
    },
  })
}

export function useAddGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newGoal: Omit<Goal, 'id' | 'user_id' | 'current_amount' | 'created_at'>) => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao criar meta')
      }
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.goals })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updated: Partial<Goal> & { id: string }) => {
      const res = await fetch(`/api/goals/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao atualizar meta')
      }
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.goals })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao excluir meta')
      }
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.goals })
    },
  })
}

// Adicionar Aporte/Contribuição e atualizar meta
export function useAddGoalContribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      goalId,
      amount,
      date,
      note,
    }: {
      goalId: string
      amount: number
      date: string
      note?: string
    }) => {
      const res = await fetch(`/api/goals/${goalId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, date, note }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Falha ao registrar aporte')
      }
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.goals })
    },
  })
}
