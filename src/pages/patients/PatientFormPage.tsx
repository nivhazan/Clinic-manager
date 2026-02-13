import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePatient, useCreatePatient, useUpdatePatient } from '@/hooks/usePatients'
import { ensureRecurringAppointmentsForPatient } from '@/services/recurring'
import {
  PATIENT_STATUS_LABELS,
  PAYMENT_FREQUENCY_LABELS,
  DAY_LABELS,
} from '@/lib/constants'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Input,
  Textarea,
  FormField,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  toast,
} from '@/components/ui'
import { NativeSelect } from '@/components/ui/Select'
import { SkeletonCard } from '@/components/ui/Skeleton'
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

const statusOptions = Object.entries(PATIENT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const frequencyOptions = Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const dayOptions = [
  { value: '', label: 'ללא' },
  ...Object.entries(DAY_LABELS).map(([value, label]) => ({ value, label })),
]

export default function PatientFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { data: patient, isLoading } = usePatient(id ?? '')
  const queryClient = useQueryClient()
  const createMutation = useCreatePatient()
  const updateMutation = useUpdatePatient()

  const [form, setForm] = useState<PatientFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (patient) setForm(toFormData(patient))
  }, [patient])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
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
      toast.error({ title: 'יש לתקן את השדות המסומנים' })
      return
    }

    const data = fromFormData(form)

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, data },
        {
          onSuccess: () => {
            const count = ensureRecurringAppointmentsForPatient(id!)
            if (count > 0) {
              queryClient.invalidateQueries({ queryKey: ['appointments'] })
            }
            toast.success({ title: 'פרטי המטופל עודכנו' })
            navigate(`/patients/${id}`)
          },
          onError: () => toast.error({ title: 'שגיאה בעדכון המטופל' }),
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: created => {
          const count = ensureRecurringAppointmentsForPatient(created.id)
          if (count > 0) {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
          }
          toast.success({ title: 'המטופל נוסף בהצלחה' })
          navigate(`/patients/${created.id}`)
        },
        onError: () => toast.error({ title: 'שגיאה בהוספת המטופל' }),
      })
    }
  }

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title="עריכת מטופל" backTo="/patients" />
        <div className="space-y-6 max-w-3xl">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title={isEdit ? 'עריכת מטופל' : 'מטופל חדש'}
        backTo={isEdit ? `/patients/${id}` : '/patients'}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>פרטים אישיים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="שם מלא" htmlFor="fullName" required error={errors.fullName}>
                <Input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  error={!!errors.fullName}
                />
              </FormField>
              <FormField label="מספר זהות" htmlFor="idNumber" required error={errors.idNumber}>
                <Input
                  id="idNumber"
                  name="idNumber"
                  value={form.idNumber}
                  onChange={handleChange}
                  error={!!errors.idNumber}
                />
              </FormField>
              <FormField label="תאריך לידה" htmlFor="dateOfBirth" required error={errors.dateOfBirth}>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  error={!!errors.dateOfBirth}
                />
              </FormField>
              <FormField label="טלפון" htmlFor="phone" required error={errors.phone}>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                />
              </FormField>
              <FormField label="טלפון הורה" htmlFor="parentPhone">
                <Input
                  id="parentPhone"
                  name="parentPhone"
                  type="tel"
                  dir="ltr"
                  value={form.parentPhone}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="אימייל" htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="כתובת" htmlFor="address" className="md:col-span-2">
                <Input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Medical Info */}
        <Card>
          <CardHeader>
            <CardTitle>מידע רפואי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="אבחנה ראשונית" htmlFor="initialDiagnosis">
                <Textarea
                  id="initialDiagnosis"
                  name="initialDiagnosis"
                  value={form.initialDiagnosis}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="רקע רפואי" htmlFor="medicalBackground">
                <Textarea
                  id="medicalBackground"
                  name="medicalBackground"
                  value={form.medicalBackground}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="מקור הפניה" htmlFor="referralSource">
                <Input
                  id="referralSource"
                  name="referralSource"
                  value={form.referralSource}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="איש קשר לחירום" htmlFor="emergencyContact">
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  value={form.emergencyContact}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="טלפון חירום" htmlFor="emergencyPhone">
                <Input
                  id="emergencyPhone"
                  name="emergencyPhone"
                  type="tel"
                  dir="ltr"
                  value={form.emergencyPhone}
                  onChange={handleChange}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Status & Payment */}
        <Card>
          <CardHeader>
            <CardTitle>סטטוס ותשלום</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="סטטוס" htmlFor="status">
                <NativeSelect
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={statusOptions}
                />
              </FormField>
              <FormField label="תדירות תשלום" htmlFor="paymentFrequency">
                <NativeSelect
                  id="paymentFrequency"
                  name="paymentFrequency"
                  value={form.paymentFrequency}
                  onChange={handleChange}
                  options={frequencyOptions}
                />
              </FormField>
              <FormField
                label="מחיר טיפול (₪)"
                htmlFor="sessionPrice"
                required
                error={errors.sessionPrice}
              >
                <Input
                  id="sessionPrice"
                  name="sessionPrice"
                  type="number"
                  min="0"
                  dir="ltr"
                  value={form.sessionPrice}
                  onChange={handleChange}
                  error={!!errors.sessionPrice}
                />
              </FormField>
              {form.paymentFrequency === 'monthly' && (
                <FormField
                  label="מחיר חודשי (₪)"
                  htmlFor="monthlyPrice"
                  required
                  error={errors.monthlyPrice}
                >
                  <Input
                    id="monthlyPrice"
                    name="monthlyPrice"
                    type="number"
                    min="0"
                    dir="ltr"
                    value={form.monthlyPrice}
                    onChange={handleChange}
                    error={!!errors.monthlyPrice}
                  />
                </FormField>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recurring Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>פגישות קבועות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="יום קבוע" htmlFor="recurringDay">
                <NativeSelect
                  id="recurringDay"
                  name="recurringDay"
                  value={form.recurringDay}
                  onChange={handleChange}
                  options={dayOptions}
                />
              </FormField>
              <FormField label="שעה קבועה" htmlFor="recurringTime">
                <Input
                  id="recurringTime"
                  name="recurringTime"
                  type="time"
                  dir="ltr"
                  value={form.recurringTime}
                  onChange={handleChange}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>הערות</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField label="הערות כלליות" htmlFor="notes">
              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Button type="submit" loading={isPending}>
            {isPending ? 'שומר...' : 'שמירה'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            ביטול
          </Button>
        </div>
      </form>
    </div>
  )
}
