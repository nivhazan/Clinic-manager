import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePayment, useCreatePayment, useUpdatePayment } from '@/hooks/usePayments'
import { usePatients } from '@/hooks/usePatients'
import { usePatientAppointments } from '@/hooks/useAppointments'
import { usePatientSessions } from '@/hooks/useSessions'
import { ensureSessionForAppointment } from '@/services/sessions'
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/constants'
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
  Alert,
  toast,
} from '@/components/ui'
import { NativeSelect } from '@/components/ui/Select'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { PaymentMethod, PaymentType } from '@/types'

interface PaymentFormData {
  patientId: string
  sessionId: string
  appointmentId: string
  date: string
  amount: string
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  notes: string
}

const EMPTY_FORM: PaymentFormData = {
  patientId: '',
  sessionId: '',
  appointmentId: '',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  paymentMethod: 'cash',
  paymentType: 'session',
  notes: '',
}

type FormErrors = Partial<Record<keyof PaymentFormData, string>>

function toFormData(payment: any): PaymentFormData {
  return {
    patientId: payment.patientId,
    sessionId: payment.sessionId ?? '',
    appointmentId: payment.appointmentId ?? '',
    date: payment.date,
    amount: String(payment.amount),
    paymentMethod: payment.paymentMethod,
    paymentType: payment.paymentType,
    notes: payment.notes ?? '',
  }
}

function fromFormData(data: PaymentFormData, billingPeriod?: string) {
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return {
    patientId: data.patientId,
    sessionId: data.sessionId.trim() || undefined,
    appointmentId: data.appointmentId.trim() || undefined,
    date: data.date,
    amount: Number(data.amount),
    paymentMethod: data.paymentMethod,
    paymentType: data.paymentType,
    billingPeriod: data.paymentType === 'monthly' ? billingPeriod || currentPeriod : undefined,
    notes: data.notes.trim() || undefined,
  }
}

function validate(data: PaymentFormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.patientId) errors.patientId = 'שדה חובה'
  if (!data.date) errors.date = 'שדה חובה'
  if (!data.amount || Number(data.amount) <= 0) errors.amount = 'יש להזין סכום תקין'
  return errors
}

const paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const paymentTypeOptions = Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export default function PaymentFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: payment, isLoading: paymentLoading } = usePayment(id ?? '')
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const createMutation = useCreatePayment()
  const updateMutation = useUpdatePayment()

  const [form, setForm] = useState<PaymentFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [sessionAutoResolved, setSessionAutoResolved] = useState(false)

  // Load patient sessions and appointments when patientId changes
  const { data: sessions = [] } = usePatientSessions(form.patientId)
  const { data: appointments = [] } = usePatientAppointments(form.patientId)

  useEffect(() => {
    if (payment) {
      setForm(toFormData(payment))
    } else {
      const prefilledPatientId = searchParams.get('patientId')
      const prefilledSessionId = searchParams.get('sessionId')
      const prefilledAppointmentId = searchParams.get('appointmentId')
      const prefilledAmount = searchParams.get('amount')
      const prefilledDate = searchParams.get('date')
      const prefilledPaymentType = searchParams.get('paymentType') as PaymentType | null
      if (
        prefilledPatientId ||
        prefilledSessionId ||
        prefilledAppointmentId ||
        prefilledAmount ||
        prefilledPaymentType ||
        prefilledDate
      ) {
        setForm(prev => ({
          ...prev,
          ...(prefilledPatientId && { patientId: prefilledPatientId }),
          ...(prefilledSessionId && { sessionId: prefilledSessionId }),
          ...(prefilledAppointmentId && { appointmentId: prefilledAppointmentId }),
          ...(prefilledAmount && { amount: prefilledAmount }),
          ...(prefilledDate && { date: prefilledDate }),
          ...(prefilledPaymentType && { paymentType: prefilledPaymentType }),
        }))
      }
    }
  }, [payment, searchParams])

  // Auto-fill appointmentId when session is selected
  useEffect(() => {
    if (form.sessionId && sessions.length > 0) {
      const selectedSession = sessions.find(s => s.id === form.sessionId)
      if (selectedSession?.appointmentId && !form.appointmentId) {
        setForm(prev => ({ ...prev, appointmentId: selectedSession.appointmentId || '' }))
      }
    }
  }, [form.sessionId, sessions])

  // Auto-select/create session when appointmentId is prefilled
  useEffect(() => {
    if (!form.appointmentId || form.sessionId || isEdit || sessionAutoResolved) return

    const linkedSession = sessions.find(s => s.appointmentId === form.appointmentId)
    if (linkedSession) {
      setForm(prev => ({ ...prev, sessionId: linkedSession.id }))
      setSessionAutoResolved(true)
      return
    }

    const resolved = ensureSessionForAppointment(form.appointmentId)
    if (resolved) {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setForm(prev => ({ ...prev, sessionId: resolved.id }))
    }
    setSessionAutoResolved(true)
  }, [form.appointmentId, form.sessionId, sessions, isEdit, sessionAutoResolved, queryClient])

  const prefillWarning = useMemo(() => {
    const urlAppointmentId = searchParams.get('appointmentId')
    if (!urlAppointmentId || isEdit) return ''
    if (!sessionAutoResolved) return ''
    if (form.sessionId) return ''
    return 'לא ניתן לקשר טיפול לפגישה זו - ניתן לבחור ידנית'
  }, [searchParams, isEdit, sessionAutoResolved, form.sessionId])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof PaymentFormData]) {
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

    const billingPeriodFromUrl = searchParams.get('billingPeriod') ?? undefined
    const data = fromFormData(form, billingPeriodFromUrl)

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, data },
        {
          onSuccess: () => {
            toast.success({ title: 'התשלום עודכן' })
            navigate('/payments')
          },
          onError: () => toast.error({ title: 'שגיאה בעדכון התשלום' }),
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          if (data.sessionId) {
            toast.success({ title: 'התשלום נשמר והטיפול סומן כשולם' })
          } else if (data.appointmentId) {
            toast.success({ title: 'התשלום נשמר והתור סומן כשולם' })
          } else {
            toast.success({ title: 'התשלום נוסף בהצלחה' })
          }
          navigate('/payments')
        },
        onError: () => toast.error({ title: 'שגיאה בהוספת התשלום' }),
      })
    }
  }

  if ((isEdit && paymentLoading) || patientsLoading) {
    return (
      <div>
        <PageHeader title={isEdit ? 'עריכת תשלום' : 'תשלום חדש'} backTo="/payments" />
        <div className="space-y-6 max-w-2xl">
          <SkeletonCard />
        </div>
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const activePatients = patients.filter(p => p.status === 'active')

  const unpaidSessions = sessions.filter(s => !s.isPaid)
  const paidSessions = sessions.filter(s => s.isPaid)
  const eligibleAppointments = appointments.filter(
    a => a.status === 'completed' || a.status === 'confirmed'
  )

  const patientOptions = [
    { value: '', label: 'בחר מטופל' },
    ...activePatients.map(p => ({ value: p.id, label: p.fullName })),
  ]

  const appointmentOptions = [
    { value: '', label: 'ללא קישור לפגישה' },
    ...eligibleAppointments.map(apt => ({
      value: apt.id,
      label: `${new Intl.DateTimeFormat('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(apt.date))} - ${apt.time}`,
    })),
  ]

  return (
    <div>
      <PageHeader title={isEdit ? 'עריכת תשלום' : 'תשלום חדש'} backTo="/payments" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>פרטי תשלום</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="מטופל" htmlFor="patientId" required error={errors.patientId}>
                <NativeSelect
                  id="patientId"
                  name="patientId"
                  value={form.patientId}
                  onChange={handleChange}
                  options={patientOptions}
                  error={!!errors.patientId}
                />
              </FormField>

              <FormField label="טיפול לחיוב" htmlFor="sessionId">
                <select
                  id="sessionId"
                  name="sessionId"
                  value={form.sessionId}
                  onChange={handleChange}
                  disabled={!form.patientId}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pe-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">ללא קישור לטיפול</option>
                  {unpaidSessions.length > 0 && (
                    <optgroup label="טיפולים ללא תשלום">
                      {unpaidSessions.map(session => (
                        <option key={session.id} value={session.id}>
                          טיפול #{session.sessionNumber} -{' '}
                          {new Intl.DateTimeFormat('he-IL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }).format(new Date(session.sessionDate))}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {paidSessions.length > 0 && (
                    <optgroup label="טיפולים ששולמו">
                      {paidSessions.map(session => (
                        <option key={session.id} value={session.id}>
                          טיפול #{session.sessionNumber} -{' '}
                          {new Intl.DateTimeFormat('he-IL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }).format(new Date(session.sessionDate))}{' '}
                          (שולם)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </FormField>

              {prefillWarning && (
                <div className="col-span-full">
                  <Alert variant="warning">{prefillWarning}</Alert>
                </div>
              )}

              <FormField label="תאריך תשלום" htmlFor="date" required error={errors.date}>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  error={!!errors.date}
                />
              </FormField>

              <FormField label="סכום (₪)" htmlFor="amount" required error={errors.amount}>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  value={form.amount}
                  onChange={handleChange}
                  error={!!errors.amount}
                />
              </FormField>

              <FormField label="אמצעי תשלום" htmlFor="paymentMethod" required>
                <NativeSelect
                  id="paymentMethod"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  options={paymentMethodOptions}
                />
              </FormField>

              <FormField label="סוג תשלום" htmlFor="paymentType" required>
                <NativeSelect
                  id="paymentType"
                  name="paymentType"
                  value={form.paymentType}
                  onChange={handleChange}
                  options={paymentTypeOptions}
                />
              </FormField>

              <FormField label="פגישה מקושרת (אופציונלי)" htmlFor="appointmentId">
                <NativeSelect
                  id="appointmentId"
                  name="appointmentId"
                  value={form.appointmentId}
                  onChange={handleChange}
                  options={appointmentOptions}
                  disabled={!form.patientId}
                />
              </FormField>

              <FormField label="הערות" htmlFor="notes" className="md:col-span-2">
                <Textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Button type="submit" loading={isPending}>
            {isPending ? 'שומר...' : 'שמירה'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/payments')}>
            ביטול
          </Button>
        </div>
      </form>
    </div>
  )
}
