import type { Expense } from '@/types'
import { getAll, setAll, generateId, now } from './api'

const KEY = 'clinic_expenses'

export type CreateExpenseData = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateExpenseData = Partial<CreateExpenseData>

export const expensesService = {
  async getAll(): Promise<Expense[]> {
    return getAll<Expense>(KEY)
  },

  async getById(id: string): Promise<Expense | undefined> {
    return getAll<Expense>(KEY).find(e => e.id === id)
  },

  async create(data: CreateExpenseData): Promise<Expense> {
    const expenses = getAll<Expense>(KEY)
    const expense: Expense = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    expenses.push(expense)
    setAll(KEY, expenses)
    return expense
  },

  async update(id: string, data: UpdateExpenseData): Promise<Expense> {
    const expenses = getAll<Expense>(KEY)
    const index = expenses.findIndex(e => e.id === id)
    if (index === -1) throw new Error('Expense not found')
    expenses[index] = { ...expenses[index], ...data, updatedAt: now() }
    setAll(KEY, expenses)
    return expenses[index]
  },

  async remove(id: string): Promise<void> {
    const expenses = getAll<Expense>(KEY).filter(e => e.id !== id)
    setAll(KEY, expenses)
  },
}
