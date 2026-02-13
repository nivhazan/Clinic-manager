import type { Patient, Appointment } from '@/types'
import { getAll, setAll, generateId, now } from './api'
import { formatYMDLocal } from '@/lib/dates'

const PATIENTS_KEY = 'clinic_patients'
const APPOINTMENTS_KEY = 'clinic_appointments'

const RECURRING_WEEKS = 8

function generateForPatient(
  patient: Patient,
  appointments: Appointment[],
  today: Date,
): number {
  if (patient.status !== 'active') return 0
  if (patient.recurringDay == null || !patient.recurringTime) return 0

  const current = new Date(today)
  const daysUntilTarget = (patient.recurringDay - current.getDay() + 7) % 7
  current.setDate(current.getDate() + daysUntilTarget)

  let created = 0

  for (let i = 0; i < RECURRING_WEEKS; i++) {
    const dateStr = formatYMDLocal(current)

    const exists = appointments.some(
      a => a.patientId === patient.id && a.date === dateStr && a.time === patient.recurringTime,
    )

    if (!exists) {
      appointments.push({
        id: generateId(),
        patientId: patient.id,
        date: dateStr,
        time: patient.recurringTime!,
        duration: 45,
        sessionType: 'ongoing_therapy',
        status: 'scheduled',
        isPaid: false,
        createdAt: now(),
        updatedAt: now(),
      })
      created++
    }

    current.setDate(current.getDate() + 7)
  }

  return created
}

export function ensureRecurringAppointmentsForPatient(patientId: string): number {
  const patients = getAll<Patient>(PATIENTS_KEY)
  const patient = patients.find(p => p.id === patientId)
  if (!patient) return 0

  const appointments = getAll<Appointment>(APPOINTMENTS_KEY)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const created = generateForPatient(patient, appointments, today)
  if (created > 0) setAll(APPOINTMENTS_KEY, appointments)
  return created
}

export function ensureAllRecurringAppointments(): number {
  const patients = getAll<Patient>(PATIENTS_KEY)
  const appointments = getAll<Appointment>(APPOINTMENTS_KEY)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let total = 0
  for (const patient of patients) {
    total += generateForPatient(patient, appointments, today)
  }

  if (total > 0) setAll(APPOINTMENTS_KEY, appointments)
  return total
}
