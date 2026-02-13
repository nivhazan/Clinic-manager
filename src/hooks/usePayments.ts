import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsService } from '@/services/payments'
import type { CreatePaymentData, UpdatePaymentData } from '@/services/payments'

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsService.getAll(),
  })
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsService.getById(id),
    enabled: !!id,
  })
}

export function usePatientPayments(patientId: string) {
  return useQuery({
    queryKey: ['payments', 'patient', patientId],
    queryFn: () => paymentsService.getByPatientId(patientId),
    enabled: !!patientId,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePaymentData) => paymentsService.create(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'patient', variables.patientId] })
      // Always invalidate sessions + appointments so debt sections recompute
      queryClient.invalidateQueries({ queryKey: ['sessions'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'all' })
      if (variables.sessionId) {
        queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
        queryClient.invalidateQueries({ queryKey: ['sessions', 'patient', variables.patientId] })
      }
      if (variables.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['appointments', variables.appointmentId] })
        queryClient.invalidateQueries({ queryKey: ['appointments', 'patient', variables.patientId] })
      }
    },
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentData }) =>
      paymentsService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payments', id] })
      if (_result.patientId) {
        queryClient.invalidateQueries({ queryKey: ['payments', 'patient', _result.patientId] })
      }
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => paymentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}
