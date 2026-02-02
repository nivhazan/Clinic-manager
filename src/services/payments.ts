import type { Payment, TherapySession, Appointment } from '@/types'
import { getAll, setAll, generateId, now } from './api'

const KEY = 'clinic_payments'
const SESSIONS_KEY = 'clinic_sessions'
const APPOINTMENTS_KEY = 'clinic_appointments'

export type CreatePaymentData = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdatePaymentData = Partial<CreatePaymentData>

export const paymentsService = {
  async getAll(): Promise<Payment[]> {
    return getAll<Payment>(KEY)
  },

  async getById(id: string): Promise<Payment | undefined> {
    return getAll<Payment>(KEY).find(p => p.id === id)
  },

  async getByPatientId(patientId: string): Promise<Payment[]> {
    return getAll<Payment>(KEY).filter(p => p.patientId === patientId)
  },

  async getByAppointmentId(appointmentId: string): Promise<Payment[]> {
    return getAll<Payment>(KEY).filter(p => p.appointmentId === appointmentId)
  },

  async create(data: CreatePaymentData): Promise<Payment> {
    const payments = getAll<Payment>(KEY)
    const payment: Payment = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    payments.push(payment)
    setAll(KEY, payments)

    // Mark linked session as paid
    if (data.sessionId) {
      const sessions = getAll<TherapySession>(SESSIONS_KEY)
      const sessionIndex = sessions.findIndex(s => s.id === data.sessionId)
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          isPaid: true,
          paymentId: payment.id,
          updatedAt: now(),
        }
        setAll(SESSIONS_KEY, sessions)
      }
    }

    // Mark linked appointment as paid
    if (data.appointmentId) {
      const appointments = getAll<Appointment>(APPOINTMENTS_KEY)
      const appointmentIndex = appointments.findIndex(a => a.id === data.appointmentId)
      if (appointmentIndex !== -1) {
        appointments[appointmentIndex] = {
          ...appointments[appointmentIndex],
          isPaid: true,
          updatedAt: now(),
        }
        setAll(APPOINTMENTS_KEY, appointments)
      }
    }

    return payment
  },

  async update(id: string, data: UpdatePaymentData): Promise<Payment> {
    const payments = getAll<Payment>(KEY)
    const index = payments.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Payment not found')
    payments[index] = { ...payments[index], ...data, updatedAt: now() }
    setAll(KEY, payments)
    return payments[index]
  },

  async remove(id: string): Promise<void> {
    const payments = getAll<Payment>(KEY).filter(p => p.id !== id)
    setAll(KEY, payments)
  },
}
