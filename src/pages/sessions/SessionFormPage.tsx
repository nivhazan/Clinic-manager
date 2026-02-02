import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSession, useCreateSession, useUpdateSession } from '@/hooks/useSessions'
import { usePatients } from '@/hooks/usePatients'
import { usePatientAppointments } from '@/hooks/useAppointments'
import { PROGRESS_LEVEL_LABELS, COOPERATION_LEVEL_LABELS } from '@/lib/constants'
import { FormField } from '@/components/shared/FormField'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { ProgressLevel, CooperationLevel } from '@/types'

interface SessionFormData {
  patientId: string
  sessionDate: string
  appointmentId: string
  goals: string
  activitiesPerformed: string
  progressLevel: ProgressLevel
  cooperationLevel: CooperationLevel
  summary: string
  homeAssignments: string
  nextSessionPlan: string
  recommendations: string
}

const EMPTY_FORM: SessionFormData = {
  patientId: '',
  sessionDate: new Date().toISOString().split('T')[0],
  appointmentId: '',
  goals: '',
  activitiesPerformed: '',
  progressLevel: 'moderate',
  cooperationLevel: 'good',
  summary: '',
  homeAssignments: '',
  nextSessionPlan: '',
  recommendations: '',
}

type FormErrors = Partial<Record<keyof SessionFormData, string>>

function toFormData(session: any): SessionFormData {
  return {
    patientId: session.patientId,
    sessionDate: session.sessionDate,
    appointmentId: session.appointmentId ?? '',
    goals: session.goals,
    activitiesPerformed: session.activitiesPerformed,
    progressLevel: session.progressLevel,
    cooperationLevel: session.cooperationLevel,
    summary: session.summary,
    homeAssignments: session.homeAssignments ?? '',
    nextSessionPlan: session.nextSessionPlan ?? '',
    recommendations: session.recommendations ?? '',
  }
}

function fromFormData(data: SessionFormData) {
  return {
    patientId: data.patientId,
    sessionDate: data.sessionDate,
    appointmentId: data.appointmentId.trim() || undefined,
    goals: data.goals.trim(),
    activitiesPerformed: data.activitiesPerformed.trim(),
    progressLevel: data.progressLevel,
    cooperationLevel: data.cooperationLevel,
    summary: data.summary.trim(),
    homeAssignments: data.homeAssignments.trim() || undefined,
    nextSessionPlan: data.nextSessionPlan.trim() || undefined,
    recommendations: data.recommendations.trim() || undefined,
  }
}

function validate(data: SessionFormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.patientId) errors.patientId = 'שדה חובה'
  if (!data.sessionDate) errors.sessionDate = 'שדה חובה'
  if (!data.goals.trim()) errors.goals = 'שדה חובה'
  if (!data.activitiesPerformed.trim()) errors.activitiesPerformed = 'שדה חובה'
  if (!data.summary.trim()) errors.summary = 'שדה חובה'
  return errors
}

const INPUT = 'h-10 px-3 rounded-md border border-input bg-background text-sm w-full'
const TEXTAREA = 'px-3 py-2 rounded-md border border-input bg-background text-sm w-full min-h-[80px] resize-y'
const SELECT = 'h-10 px-3 rounded-md border border-input bg-background text-sm w-full'

export default function SessionFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { data: session, isLoading: sessionLoading } = useSession(id ?? '')
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const createMutation = useCreateSession()
  const updateMutation = useUpdateSession()

  const [form, setForm] = useState<SessionFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  // Load patient appointments when patientId changes
  const { data: appointments = [] } = usePatientAppointments(form.patientId)

  useEffect(() => {
    if (session) {
      setForm(toFormData(session))
    } else {
      const prefilledPatientId = searchParams.get('patientId')
      const prefilledAppointmentId = searchParams.get('appointmentId')
      if (prefilledPatientId || prefilledAppointmentId) {
        setForm(prev => ({
          ...prev,
          ...(prefilledPatientId && { patientId: prefilledPatientId }),
          ...(prefilledAppointmentId && { appointmentId: prefilledAppointmentId }),
        }))
      }
    }
  }, [session, searchParams])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof SessionFormData]) {
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
            toast.success('הטיפול עודכן')
            navigate(`/patients/${data.patientId}`)
          },
          onError: () => toast.error('שגיאה בעדכון הטיפול'),
        },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('הטיפול נוצר בהצלחה')
          navigate(`/patients/${data.patientId}`)
        },
        onError: () => toast.error('שגיאה ביצירת הטיפול'),
      })
    }
  }

  if ((isEdit && sessionLoading) || patientsLoading) return <LoadingSpinner />

  const isPending = createMutation.isPending || updateMutation.isPending
  const activePatients = patients.filter(p => p.status === 'active')

  // Filter appointments to show only completed or confirmed ones
  const eligibleAppointments = appointments.filter(
    a => a.status === 'completed' || a.status === 'confirmed',
  )

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{isEdit ? 'עריכת טיפול' : 'טיפול חדש'}</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <fieldset className="space-y-6">
          <div className="border border-border rounded-lg p-5">
            <h3 className="text-base font-semibold mb-4">פרטים בסיסיים</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="מטופל" htmlFor="patientId" required error={errors.patientId}>
                <select
                  id="patientId"
                  name="patientId"
                  value={form.patientId}
                  onChange={handleChange}
                  className={SELECT}
                  disabled={isEdit}
                >
                  <option value="">בחר מטופל</option>
                  {activePatients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="תאריך טיפול" htmlFor="sessionDate" required error={errors.sessionDate}>
                <input
                  id="sessionDate"
                  name="sessionDate"
                  type="date"
                  value={form.sessionDate}
                  onChange={handleChange}
                  className={INPUT}
                />
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
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-base font-semibold mb-4">תוכן הטיפול</h3>
            <div className="space-y-4">
              <FormField label="מטרות הטיפול" htmlFor="goals" required error={errors.goals}>
                <textarea
                  id="goals"
                  name="goals"
                  value={form.goals}
                  onChange={handleChange}
                  className={TEXTAREA}
                  placeholder="תיאור המטרות שהוגדרו לטיפול זה..."
                />
              </FormField>

              <FormField
                label="פעילויות שבוצעו"
                htmlFor="activitiesPerformed"
                required
                error={errors.activitiesPerformed}
              >
                <textarea
                  id="activitiesPerformed"
                  name="activitiesPerformed"
                  value={form.activitiesPerformed}
                  onChange={handleChange}
                  className={TEXTAREA}
                  placeholder="תיאור הפעילויות והתרגילים שבוצעו במהלך הטיפול..."
                />
              </FormField>

              <FormField label="סיכום" htmlFor="summary" required error={errors.summary}>
                <textarea
                  id="summary"
                  name="summary"
                  value={form.summary}
                  onChange={handleChange}
                  className={TEXTAREA}
                  placeholder="סיכום כללי של הטיפול..."
                />
              </FormField>
            </div>
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-base font-semibold mb-4">הערכה</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="רמת התקדמות" htmlFor="progressLevel" required>
                <select
                  id="progressLevel"
                  name="progressLevel"
                  value={form.progressLevel}
                  onChange={handleChange}
                  className={SELECT}
                >
                  {Object.entries(PROGRESS_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="רמת שיתוף פעולה" htmlFor="cooperationLevel" required>
                <select
                  id="cooperationLevel"
                  name="cooperationLevel"
                  value={form.cooperationLevel}
                  onChange={handleChange}
                  className={SELECT}
                >
                  {Object.entries(COOPERATION_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-base font-semibold mb-4">מידע נוסף (אופציונלי)</h3>
            <div className="space-y-4">
              <FormField label="משימות בית" htmlFor="homeAssignments">
                <textarea
                  id="homeAssignments"
                  name="homeAssignments"
                  value={form.homeAssignments}
                  onChange={handleChange}
                  className={TEXTAREA}
                  placeholder="תרגילים או משימות לביצוע בבית..."
                />
              </FormField>

              <FormField label="תכנון לטיפול הבא" htmlFor="nextSessionPlan">
                <textarea
                  id="nextSessionPlan"
                  name="nextSessionPlan"
                  value={form.nextSessionPlan}
                  onChange={handleChange}
                  className={TEXTAREA}
                  placeholder="מה מתוכנן לטיפול הבא..."
                />
              </FormField>

              <FormField label="המלצות" htmlFor="recommendations">
                <textarea
                  id="recommendations"
                  name="recommendations"
                  value={form.recommendations}
                  onChange={handleChange}
                  className={TEXTAREA}
                  placeholder="המלצות כלליות או הפניות נוספות..."
                />
              </FormField>
            </div>
          </div>
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
