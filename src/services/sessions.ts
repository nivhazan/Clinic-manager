import type { TherapySession, Appointment } from '@/types'
import { getAll, setAll, generateId, now } from './api'

const KEY = 'clinic_sessions'
const APPOINTMENTS_KEY = 'clinic_appointments'

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

/**
 * Find or create a minimal session record linked to an appointment.
 * Used when billing from the calendar so that a sessionId is always available.
 * Synchronous — reads/writes localStorage directly.
 */
export function ensureSessionForAppointment(appointmentId: string): TherapySession | null {
  const appointments = getAll<Appointment>(APPOINTMENTS_KEY)
  const appointment = appointments.find(a => a.id === appointmentId)
  if (!appointment) return null

  const sessions = getAll<TherapySession>(KEY)

  // Return existing session linked to this appointment
  const existing = sessions.find(s => s.appointmentId === appointmentId)
  if (existing) return existing

  // Fallback: find an unpaid session for the same patient + date (not yet linked)
  const byPatientDate = sessions.find(
    s => s.patientId === appointment.patientId && s.sessionDate === appointment.date && !s.appointmentId && !s.isPaid,
  )
  if (byPatientDate) {
    // Link it to this appointment and persist
    byPatientDate.appointmentId = appointmentId
    byPatientDate.updatedAt = now()
    setAll(KEY, sessions)
    return byPatientDate
  }

  // Auto-increment session number for this patient
  const patientSessions = sessions.filter(s => s.patientId === appointment.patientId)
  const maxNum = patientSessions.length > 0
    ? Math.max(...patientSessions.map(s => s.sessionNumber))
    : 0

  const session: TherapySession = {
    id: generateId(),
    patientId: appointment.patientId,
    sessionDate: appointment.date,
    sessionNumber: maxNum + 1,
    appointmentId,
    goals: '',
    activitiesPerformed: '',
    progressLevel: 'moderate',
    cooperationLevel: 'good',
    summary: '',
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  }

  sessions.push(session)
  setAll(KEY, sessions)
  return session
}
