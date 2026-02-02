import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAppointment, useCreateAppointment, useUpdateAppointment } from '@/hooks/useAppointments'
import { usePatients } from '@/hooks/usePatients'
import {
  APPOINTMENT_STATUS_LABELS,
  SESSION_TYPE_LABELS,
} from '@/lib/constants'
import { FormField } from '@/components/shared/FormField'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { AppointmentStatus, SessionType } from '@/types'

interface AppointmentFormData {
  patientId: string
  date: string
  time: string
  duration: string
  sessionType: SessionType
  status: AppointmentStatus
  isPaid: boolean
  notes: string
}

const EMPTY_FORM: AppointmentFormData = {
  patientId: '',
  date: '',
  time: '',
  duration: '45',
  sessionType: 'ongoing_therapy',
  status: 'scheduled',
  isPaid: false,
  notes: '',
}

type FormErrors = Partial<Record<keyof AppointmentFormData, string>>

function toFormData(appointment: any): AppointmentFormData {
  return {
    patientId: appointment.patientId,
    date: appointment.date,
    time: appointment.time,
    duration: String(appointment.duration),
    sessionType: appointment.sessionType,
    status: appointment.status,
    isPaid: appointment.isPaid,
    notes: appointment.notes ?? '',
  }
}

function fromFormData(data: AppointmentFormData) {
  return {
    patientId: data.patientId,
    date: data.date,
    time: data.time,
    duration: Number(data.duration),
    sessionType: data.sessionType,
    status: data.status,
    isPaid: data.isPaid,
    notes: data.notes.trim() || undefined,
  }
}

function validate(data: AppointmentFormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.patientId) errors.patientId = 'שדה חובה'
  if (!data.date) errors.date = 'שדה חובה'
  if (!data.time) errors.time = 'שדה חובה'
  if (!data.duration || Number(data.duration) <= 0) errors.duration = 'יש להזין משך תקין'
  return errors
}

const INPUT = 'h-10 px-3 rounded-md border border-input bg-background text-sm w-full'
const TEXTAREA = 'px-3 py-2 rounded-md border border-input bg-background text-sm w-full min-h-[80px] resize-y'
const SELECT = 'h-10 px-3 rounded-md border border-input bg-background text-sm w-full'

export default function AppointmentFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { data: appointment, isLoading: appointmentLoading } = useAppointment(id ?? '')
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const createMutation = useCreateAppointment()
  const updateMutation = useUpdateAppointment()

  const [form, setForm] = useState<AppointmentFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (appointment) {
      setForm(toFormData(appointment))
    } else {
      const prefilledPatientId = searchParams.get('patientId')
      const prefilledDate = searchParams.get('date')
      if (prefilledPatientId || prefilledDate) {
        setForm(prev => ({
          ...prev,
          ...(prefilledPatientId && { patientId: prefilledPatientId }),
          ...(prefilledDate && { date: prefilledDate }),
        }))
      }
    }
  }, [appointment, searchParams])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    // Check if trying to cancel a paid appointment
    if (name === 'status' && value === 'canceled' && appointment?.isPaid) {
      if (!confirm('לתור הזה קיים תשלום מקושר. ביטול התור לא מוחק את התשלום. להמשיך?')) {
        return
      }
    }

    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name as keyof AppointmentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const data = fromFormData(form)

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, data },
        {
          onSuccess: () => {
            toast.success('הפגישה עודכנה')
            navigate('/calendar')
          },
          onError: () => toast.error('שגיאה בעדכון הפגישה'),
        },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('הפגישה נקבעה בהצלחה')
          navigate('/calendar')
        },
        onError: () => toast.error('שגיאה בקביעת הפגישה'),
      })
    }
  }

  if ((isEdit && appointmentLoading) || patientsLoading) return <LoadingSpinner />

  const isPending = createMutation.isPending || updateMutation.isPending
  const activePatients = patients.filter(p => p.status === 'active')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{isEdit ? 'עריכת פגישה' : 'תור חדש'}</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <fieldset className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="מטופל" htmlFor="patientId" required error={errors.patientId}>
              <select id="patientId" name="patientId" value={form.patientId} onChange={handleChange} className={SELECT}>
                <option value="">בחר מטופל</option>
                {activePatients.map(patient => (
                  <option key={patient.id} value={patient.id}>{patient.fullName}</option>
                ))}
              </select>
            </FormField>

            <FormField label="תאריך" htmlFor="date" required error={errors.date}>
              <input id="date" name="date" type="date" value={form.date} onChange={handleChange} className={INPUT} />
            </FormField>

            <FormField label="שעה" htmlFor="time" required error={errors.time}>
              <input id="time" name="time" type="time" dir="ltr" value={form.time} onChange={handleChange} className={INPUT} />
            </FormField>

            <FormField label="משך (דקות)" htmlFor="duration" required error={errors.duration}>
              <input id="duration" name="duration" type="number" min="1" dir="ltr" value={form.duration} onChange={handleChange} className={INPUT} />
            </FormField>

            <FormField label="סוג טיפול" htmlFor="sessionType" required>
              <select id="sessionType" name="sessionType" value={form.sessionType} onChange={handleChange} className={SELECT}>
                {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="סטטוס" htmlFor="status" required>
              <select id="status" name="status" value={form.status} onChange={handleChange} className={SELECT}>
                {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPaid"
              name="isPaid"
              type="checkbox"
              checked={form.isPaid}
              onChange={handleChange}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="isPaid" className="text-sm font-medium">שולם</label>
          </div>

          <FormField label="הערות" htmlFor="notes">
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} className={TEXTAREA} />
          </FormField>
        </fieldset>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={isPending}
            className="h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'שומר...' : 'שמירה'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-10 px-6 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  )
}
