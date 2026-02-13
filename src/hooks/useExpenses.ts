import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesService } from '@/services/expenses'
import type { CreateExpenseData, UpdateExpenseData } from '@/services/expenses'

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesService.getAll(),
  })
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expensesService.getById(id),
    enabled: !!id,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseData) => expensesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseData }) =>
      expensesService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expenses', id] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

// CRUD Hooks adapter for generic CRUD components
export const expensesCrudHooks = {
  useList: useExpenses,
  useItem: useExpense,
  useCreate: useCreateExpense,
  useUpdate: useUpdateExpense,
  useDelete: useDeleteExpense,
}
