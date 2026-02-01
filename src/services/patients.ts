import type { Patient } from '@/types'
import { getAll, setAll, generateId, now } from './api'

const KEY = 'clinic_patients'

export type CreatePatientData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>
export type UpdatePatientData = Partial<CreatePatientData>

export const patientsService = {
  async getAll(): Promise<Patient[]> {
    return getAll<Patient>(KEY)
  },

  async getById(id: string): Promise<Patient | undefined> {
    return getAll<Patient>(KEY).find(p => p.id === id)
  },

  async create(data: CreatePatientData): Promise<Patient> {
    const patients = getAll<Patient>(KEY)
    const patient: Patient = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    patients.push(patient)
    setAll(KEY, patients)
    return patient
  },

  async update(id: string, data: UpdatePatientData): Promise<Patient> {
    const patients = getAll<Patient>(KEY)
    const index = patients.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Patient not found')
    patients[index] = { ...patients[index], ...data, updatedAt: now() }
    setAll(KEY, patients)
    return patients[index]
  },

  async remove(id: string): Promise<void> {
    const patients = getAll<Patient>(KEY).filter(p => p.id !== id)
    setAll(KEY, patients)
  },
}
