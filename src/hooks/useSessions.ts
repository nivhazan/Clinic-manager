import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsService } from '@/services/sessions'
import type { CreateSessionData, UpdateSessionData } from '@/services/sessions'

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsService.getAll(),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => sessionsService.getById(id),
    enabled: !!id,
  })
}

export function usePatientSessions(patientId: string) {
  return useQuery({
    queryKey: ['sessions', 'patient', patientId],
    queryFn: () => sessionsService.getByPatientId(patientId),
    enabled: !!patientId,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSessionData) => sessionsService.create(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['sessions', 'patient', variables.patientId] })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionData }) =>
      sessionsService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['sessions', id] })
      // Also invalidate patient sessions if patientId changed
      if (_result.patientId) {
        queryClient.invalidateQueries({ queryKey: ['sessions', 'patient', _result.patientId] })
      }
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sessionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
