import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePatient, useCreatePatient, useUpdatePatient } from '@/hooks/usePatients'
import {
  PATIENT_STATUS_LABELS,
  PAYMENT_FREQUENCY_LABELS,
  DAY_LABELS,
} from '@/lib/constants'
import { FormField } from '@/components/shared/FormField'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Patient, PatientStatus, PaymentFrequency } from '@/types'

interface PatientFormData {
  fullName: string
  idNumber: string
  dateOfBirth: string
  phone: string
  parentPhone: string
  email: string
  address: string
  initialDiagnosis: string
  medicalBackground: string
  referralSource: string
  emergencyContact: string
  emergencyPhone: string
  status: PatientStatus
  recurringDay: string
  recurringTime: string
  paymentFrequency: PaymentFrequency
  sessionPrice: string
  monthlyPrice: string
  notes: string
}

const EMPTY_FORM: PatientFormData = {
  fullName: '',
  idNumber: '',
  dateOfBirth: '',
  phone: '',
  parentPhone: '',
  email: '',
  address: '',
  initialDiagnosis: '',
  medicalBackground: '',
  referralSource: '',
  emergencyContact: '',
  emergencyPhone: '',
  status: 'active',
  recurringDay: '',
  recurringTime: '',
  paymentFrequency: 'per_session',
  sessionPrice: '',
  monthlyPrice: '',
  notes: '',
}

type FormErrors = Partial<Record<keyof PatientFormData, string>>

function toFormData(patient: Patient): PatientFormData {
  return {
    fullName: patient.fullName,
    idNumber: patient.idNumber,
    dateOfBirth: patient.dateOfBirth,
    phone: patient.phone,
    parentPhone: patient.parentPhone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    initialDiagnosis: patient.initialDiagnosis ?? '',
    medicalBackground: patient.medicalBackground ?? '',
    referralSource: patient.referralSource ?? '',
    emergencyContact: patient.emergencyContact ?? '',
    emergencyPhone: patient.emergencyPhone ?? '',
    status: patient.status,
    recurringDay: patient.recurringDay !== undefined ? String(patient.recurringDay) : '',
    recurringTime: patient.recurringTime ?? '',
    paymentFrequency: patient.paymentFrequency,
    sessionPrice: String(patient.sessionPrice),
    monthlyPrice: patient.monthlyPrice !== undefined ? String(patient.monthlyPrice) : '',
    notes: patient.notes ?? '',
  }
}

function fromFormData(data: PatientFormData) {
  return {
    fullName: data.fullName.trim(),
    idNumber: data.idNumber.trim(),
    dateOfBirth: data.dateOfBirth,
    phone: data.phone.trim(),
    parentPhone: data.parentPhone.trim() || undefined,
    email: data.email.trim() || undefined,
    address: data.address.trim() || undefined,
    initialDiagnosis: data.initialDiagnosis.trim() || undefined,
    medicalBackground: data.medicalBackground.trim() || undefined,
    referralSource: data.referralSource.trim() || undefined,
    emergencyContact: data.emergencyContact.trim() || undefined,
    emergencyPhone: data.emergencyPhone.trim() || undefined,
    status: data.status,
    recurringDay: data.recurringDay ? Number(data.recurringDay) : undefined,
    recurringTime: data.recurringTime || undefined,
    paymentFrequency: data.paymentFrequency,
    sessionPrice: Number(data.sessionPrice) || 0,
    monthlyPrice: data.monthlyPrice ? Number(data.monthlyPrice) : undefined,
    notes: data.notes.trim() || undefined,
  }
}

function validate(data: PatientFormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.fullName.trim()) errors.fullName = 'שדה חובה'
  if (!data.idNumber.trim()) errors.idNumber = 'שדה חובה'
  if (!data.dateOfBirth) errors.dateOfBirth = 'שדה חובה'
  if (!data.phone.trim()) errors.phone = 'שדה חובה'
  if (!data.sessionPrice || Number(data.sessionPrice) <= 0) errors.sessionPrice = 'יש להזין מחיר תקין'
  if (data.paymentFrequency === 'monthly' && (!data.monthlyPrice || Number(data.monthlyPrice) <= 0)) {
    errors.monthlyPrice = 'יש להזין מחיר חודשי'
  }
  return errors
}

const INPUT = 'h-10 px-3 rounded-md border border-input bg-background text-sm w-full'
const TEXTAREA = 'px-3 py-2 rounded-md border border-input bg-background text-sm w-full min-h-[80px] resize-y'
const SELECT = 'h-10 px-3 rounded-md border border-input bg-background text-sm w-full'

export default function PatientFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { data: patient, isLoading } = usePatient(id ?? '')
  const createMutation = useCreatePatient()
  const updateMutation = useUpdatePatient()

  const [form, setForm] = useState<PatientFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (patient) setForm(toFormData(patient))
  }, [patient])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof PatientFormData]) {
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
            toast.success('פרטי המטופל עודכנו')
            navigate(`/patients/${id}`)
          },
          onError: () => toast.error('שגיאה בעדכון המטופל'),
        },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: (created) => {
          toast.success('המטופל נוסף בהצלחה')
          navigate(`/patients/${created.id}`)
        },
        onError: () => toast.error('שגיאה בהוספת המטופל'),
      })
    }
  }

  if (isEdit && isLoading) return <LoadingSpinner />

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{isEdit ? 'עריכת מטופל' : 'מטופל חדש'}</h2>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* Personal Info */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold mb-2">פרטים אישיים</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="שם מלא" htmlFor="fullName" required error={errors.fullName}>
              <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} className={INPUT} />
            </FormField>
            <FormField label="מספר זהות" htmlFor="idNumber" required error={errors.idNumber}>
              <input id="idNumber" name="idNumber" value={form.idNumber} onChange={handleChange} className={INPUT} />
            </FormField>
            <FormField label="תאריך לידה" htmlFor="dateOfBirth" required error={errors.dateOfBirth}>
              <input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className={INPUT} />
            </FormField>
            <FormField label="טלפון" htmlFor="phone" required error={errors.phone}>
              <input id="phone" name="phone" type="tel" dir="ltr" value={form.phone} onChange={handleChange} className={INPUT} />
            </FormField>
            <FormField label="טלפון הורה" htmlFor="parentPhone">
              <input id="parentPhone" name="parentPhone" type="tel" dir="ltr" value={form.parentPhone} onChange={handleChange} className={INPUT} />
            </FormField>
            <FormField label="אימייל" htmlFor="email">
              <input id="email" name="email" type="email" dir="ltr" value={form.email} onChange={handleChange} className={INPUT} />
            </FormField>
            <FormField label="כתובת" htmlFor="address">
              <input id="address" name="address" value={form.address} onChange={handleChange} className={INPUT} />
            </FormField>
          </div>
        </fieldset>

        {/* Medical Info */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold mb-2">מידע רפואי</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="אבחנה ראשונית" htmlFor="initialDiagnosis">
              <textarea id="initialDiagnosis" name="initialDiagnosis" value={form.initialDiagnosis} onChange={handleChange} className={TEXTAREA} />
            </FormField>
            <FormField label="רקע רפואי" htmlFor="medicalBackground">
              <textarea id="medicalBackground" name="medicalBackground" value={form.medicalBackground} onChange={handleChange} className={TEXTAREA} />
            </FormField>
            <FormField label="מקור הפניה" htmlFor="referralSource">
              <input id="referralSource" name="referralSource" value={form.referralSource} onChange={handleChange} className={INPUT} />
            </FormField>
            <FormField label="איש קשר לחירום" htmlFor="emergencyContact">
              <input id="emergencyContact" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} className={INPUT} />
            </FormField>
            <FormField label="טלפון חירום" htmlFor="emergencyPhone">
              <input id="emergencyPhone" name="emergencyPhone" type="tel" dir="ltr" value={form.emergencyPhone} onChange={handleChange} className={INPUT} />
            </FormField>
          </div>
        </fieldset>

        {/* Status & Payment */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold mb-2">סטטוס ותשלום</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="סטטוס" htmlFor="status">
              <select id="status" name="status" value={form.status} onChange={handleChange} className={SELECT}>
                {Object.entries(PATIENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="תדירות תשלום" htmlFor="paymentFrequency">
              <select id="paymentFrequency" name="paymentFrequency" value={form.paymentFrequency} onChange={handleChange} className={SELECT}>
                {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="מחיר טיפול (₪)" htmlFor="sessionPrice" required error={errors.sessionPrice}>
              <input id="sessionPrice" name="sessionPrice" type="number" min="0" dir="ltr" value={form.sessionPrice} onChange={handleChange} className={INPUT} />
            </FormField>
            {form.paymentFrequency === 'monthly' && (
              <FormField label="מחיר חודשי (₪)" htmlFor="monthlyPrice" required error={errors.monthlyPrice}>
                <input id="monthlyPrice" name="monthlyPrice" type="number" min="0" dir="ltr" value={form.monthlyPrice} onChange={handleChange} className={INPUT} />
              </FormField>
            )}
          </div>
        </fieldset>

        {/* Recurring Appointments */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold mb-2">פגישות קבועות</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="יום קבוע" htmlFor="recurringDay">
              <select id="recurringDay" name="recurringDay" value={form.recurringDay} onChange={handleChange} className={SELECT}>
                <option value="">ללא</option>
                {Object.entries(DAY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="שעה קבועה" htmlFor="recurringTime">
              <input id="recurringTime" name="recurringTime" type="time" dir="ltr" value={form.recurringTime} onChange={handleChange} className={INPUT} />
            </FormField>
          </div>
        </fieldset>

        {/* Notes */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold mb-2">הערות</legend>
          <FormField label="הערות כלליות" htmlFor="notes">
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} className={TEXTAREA} />
          </FormField>
        </fieldset>

        {/* Actions */}
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
