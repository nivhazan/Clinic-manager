import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePayment, useCreatePayment, useUpdatePayment } from '@/hooks/usePayments'
import { usePatients } from '@/hooks/usePatients'
import { usePatientAppointments } from '@/hooks/useAppointments'
import { usePatientSessions } from '@/hooks/useSessions'
import { ensureSessionForAppointment } from '@/services/sessions'
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/constants'
import { FormField } from '@/components/shared/FormField'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
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
    billingPeriod: data.paymentType === 'monthly' ? (billingPeriod || currentPeriod) : undefined,
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

const INPUT = 'h-10 px-3 rounded-md border border-input bg-background text-sm w-full'
const TEXTAREA = 'px-3 py-2 rounded-md border border-input bg-background text-sm w-full min-h-[80px] resize-y'
const SELECT = 'h-10 px-3 rounded-md border border-input bg-background text-sm w-full'

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
      if (prefilledPatientId || prefilledSessionId || prefilledAppointmentId || prefilledAmount || prefilledPaymentType || prefilledDate) {
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

  // Auto-select/create session when appointmentId is prefilled (e.g. from calendar "$")
  useEffect(() => {
    if (!form.appointmentId || form.sessionId || isEdit || sessionAutoResolved) return

    // Check React Query cache first
    const linkedSession = sessions.find(s => s.appointmentId === form.appointmentId)
    if (linkedSession) {
      setForm(prev => ({ ...prev, sessionId: linkedSession.id }))
      setSessionAutoResolved(true)
      return
    }

    // Find or create session directly from localStorage
    const resolved = ensureSessionForAppointment(form.appointmentId)
    if (resolved) {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setForm(prev => ({ ...prev, sessionId: resolved.id }))
    }
    setSessionAutoResolved(true)
  }, [form.appointmentId, form.sessionId, sessions, isEdit, sessionAutoResolved, queryClient])

  // Warning only when auto-resolution attempted and failed (appointment not found)
  const prefillWarning = useMemo(() => {
    const urlAppointmentId = searchParams.get('appointmentId')
    if (!urlAppointmentId || isEdit) return ''
    if (!sessionAutoResolved) return ''
    if (form.sessionId) return ''
    return 'לא ניתן לקשר טיפול לפגישה זו - ניתן לבחור ידנית'
  }, [searchParams, isEdit, sessionAutoResolved, form.sessionId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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
      return
    }

    const billingPeriodFromUrl = searchParams.get('billingPeriod') ?? undefined
    const data = fromFormData(form, billingPeriodFromUrl)

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, data },
        {
          onSuccess: () => {
            toast.success('התשלום עודכן')
            navigate('/payments')
          },
          onError: () => toast.error('שגיאה בעדכון התשלום'),
        },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          if (data.sessionId) {
            toast.success('התשלום נשמר והטיפול סומן כשולם')
          } else if (data.appointmentId) {
            toast.success('התשלום נשמר והתור סומן כשולם')
          } else {
            toast.success('התשלום נוסף בהצלחה')
          }
          navigate('/payments')
        },
        onError: () => toast.error('שגיאה בהוספת התשלום'),
      })
    }
  }

  if ((isEdit && paymentLoading) || patientsLoading) return <LoadingSpinner />

  const isPending = createMutation.isPending || updateMutation.isPending
  const activePatients = patients.filter(p => p.status === 'active')

  // Separate unpaid and paid sessions
  const unpaidSessions = sessions.filter(s => !s.isPaid)
  const paidSessions = sessions.filter(s => s.isPaid)

  // Filter appointments
  const eligibleAppointments = appointments.filter(
    a => a.status === 'completed' || a.status === 'confirmed',
  )

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{isEdit ? 'עריכת תשלום' : 'תשלום חדש'}</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <fieldset className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="מטופל" htmlFor="patientId" required error={errors.patientId}>
              <select
                id="patientId"
                name="patientId"
                value={form.patientId}
                onChange={handleChange}
                className={SELECT}
              >
                <option value="">בחר מטופל</option>
                {activePatients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="טיפול לחיוב" htmlFor="sessionId">
              <select
                id="sessionId"
                name="sessionId"
                value={form.sessionId}
                onChange={handleChange}
                className={SELECT}
                disabled={!form.patientId}
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
              <div className="col-span-full text-sm text-orange-600 bg-orange-50 border border-orange-200 p-2 rounded-md">
                {prefillWarning}
              </div>
            )}

            <FormField label="תאריך תשלום" htmlFor="date" required error={errors.date}>
              <input id="date" name="date" type="date" value={form.date} onChange={handleChange} className={INPUT} />
            </FormField>

            <FormField label="סכום (₪)" htmlFor="amount" required error={errors.amount}>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                dir="ltr"
                value={form.amount}
                onChange={handleChange}
                className={INPUT}
              />
            </FormField>

            <FormField label="אמצעי תשלום" htmlFor="paymentMethod" required>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className={SELECT}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="סוג תשלום" htmlFor="paymentType" required>
              <select
                id="paymentType"
                name="paymentType"
                value={form.paymentType}
                onChange={handleChange}
                className={SELECT}
              >
                {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="פגישה מקושרת (אופציונלי)" htmlFor="appointmentId">
              <select
                id="appointmentId"
                name="appointmentId"
                value={form.appointmentId}
                onChange={handleChange}
                className={SELECT}
                disabled={!form.patientId}
              >
                <option value="">ללא קישור לפגישה</option>
                {eligibleAppointments.map(apt => (
                  <option key={apt.id} value={apt.id}>
                    {new Intl.DateTimeFormat('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(apt.date))}{' '}
                    - {apt.time}
                  </option>
                ))}
              </select>
            </FormField>
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
            onClick={() => navigate('/payments')}
            className="h-10 px-6 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  )
}
