import type { TherapySession } from '@/types'
import { getAll, setAll, generateId, now } from './api'

const KEY = 'clinic_sessions'

export type CreateSessionData = Omit<TherapySession, 'id' | 'sessionNumber' | 'isPaid' | 'paymentId' | 'createdAt' | 'updatedAt'>
export type UpdateSessionData = Partial<CreateSessionData>

export const sessionsService = {
  async getAll(): Promise<TherapySession[]> {
    return getAll<TherapySession>(KEY)
  },

  async getById(id: string): Promise<TherapySession | undefined> {
    return getAll<TherapySession>(KEY).find(s => s.id === id)
  },

  async getByPatientId(patientId: string): Promise<TherapySession[]> {
    return getAll<TherapySession>(KEY).filter(s => s.patientId === patientId)
  },

  async create(data: CreateSessionData): Promise<TherapySession> {
    const sessions = getAll<TherapySession>(KEY)

    // Calculate session number (auto-increment per patient)
    const patientSessions = sessions.filter(s => s.patientId === data.patientId)
    const maxSessionNumber = patientSessions.length > 0
      ? Math.max(...patientSessions.map(s => s.sessionNumber))
      : 0

    const session: TherapySession = {
      ...data,
      id: generateId(),
      sessionNumber: maxSessionNumber + 1,
      isPaid: false,
      createdAt: now(),
      updatedAt: now(),
    }
    sessions.push(session)
    setAll(KEY, sessions)
    return session
  },

  async update(id: string, data: UpdateSessionData): Promise<TherapySession> {
    const sessions = getAll<TherapySession>(KEY)
    const index = sessions.findIndex(s => s.id === id)
    if (index === -1) throw new Error('Session not found')
    sessions[index] = { ...sessions[index], ...data, updatedAt: now() }
    setAll(KEY, sessions)
    return sessions[index]
  },

  async remove(id: string): Promise<void> {
    const sessions = getAll<TherapySession>(KEY).filter(s => s.id !== id)
    setAll(KEY, sessions)
  },
}
