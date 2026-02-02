import type { Appointment } from '@/types'
import { getAll, setAll, generateId, now } from './api'

const KEY = 'clinic_appointments'

export type CreateAppointmentData = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateAppointmentData = Partial<CreateAppointmentData>

export const appointmentsService = {
  async getAll(): Promise<Appointment[]> {
    return getAll<Appointment>(KEY)
  },

  async getById(id: string): Promise<Appointment | undefined> {
    return getAll<Appointment>(KEY).find(a => a.id === id)
  },

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    return getAll<Appointment>(KEY).filter(a => a.patientId === patientId)
  },

  async create(data: CreateAppointmentData): Promise<Appointment> {
    const appointments = getAll<Appointment>(KEY)
    const appointment: Appointment = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    appointments.push(appointment)
    setAll(KEY, appointments)
    return appointment
  },

  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    const appointments = getAll<Appointment>(KEY)
    const index = appointments.findIndex(a => a.id === id)
    if (index === -1) throw new Error('Appointment not found')
    appointments[index] = { ...appointments[index], ...data, updatedAt: now() }
    setAll(KEY, appointments)
    return appointments[index]
  },

  async remove(id: string): Promise<void> {
    const appointments = getAll<Appointment>(KEY).filter(a => a.id !== id)
    setAll(KEY, appointments)
  },
}
