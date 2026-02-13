import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession, useCreateSession, useUpdateSession } from '@/hooks/useSessions'
import { usePatients } from '@/hooks/usePatients'
import { usePatientAppointments } from '@/hooks/useAppointments'
import { PROGRESS_LEVEL_LABELS, COOPERATION_LEVEL_LABELS } from '@/lib/constants'
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

const progressOptions = Object.entries(PROGRESS_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const cooperationOptions = Object.entries(COOPERATION_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}))

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
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
      toast.error({ title: 'יש לתקן את השדות המסומנים' })
      return
    }

    const data = fromFormData(form)

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, data },
        {
          onSuccess: () => {
            toast.success({ title: 'הטיפול עודכן' })
            navigate(`/patients/${data.patientId}`)
          },
          onError: () => toast.error({ title: 'שגיאה בעדכון הטיפול' }),
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success({ title: 'הטיפול נוצר בהצלחה' })
          navigate(`/patients/${data.patientId}`)
        },
        onError: () => toast.error({ title: 'שגיאה ביצירת הטיפול' }),
      })
    }
  }

  if ((isEdit && sessionLoading) || patientsLoading) {
    return (
      <div>
        <PageHeader title={isEdit ? 'עריכת טיפול' : 'טיפול חדש'} backTo="/sessions" />
        <div className="space-y-6 max-w-4xl">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const activePatients = patients.filter(p => p.status === 'active')
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
      <PageHeader
        title={isEdit ? 'עריכת טיפול' : 'טיפול חדש'}
        backTo={isEdit && form.patientId ? `/patients/${form.patientId}` : '/sessions'}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>פרטים בסיסיים</CardTitle>
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
                  disabled={isEdit}
                  error={!!errors.patientId}
                />
              </FormField>

              <FormField
                label="תאריך טיפול"
                htmlFor="sessionDate"
                required
                error={errors.sessionDate}
              >
                <Input
                  id="sessionDate"
                  name="sessionDate"
                  type="date"
                  value={form.sessionDate}
                  onChange={handleChange}
                  error={!!errors.sessionDate}
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
            </div>
          </CardContent>
        </Card>

        {/* Session Content */}
        <Card>
          <CardHeader>
            <CardTitle>תוכן הטיפול</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="מטרות הטיפול" htmlFor="goals" required error={errors.goals}>
              <Textarea
                id="goals"
                name="goals"
                value={form.goals}
                onChange={handleChange}
                placeholder="תיאור המטרות שהוגדרו לטיפול זה..."
                error={!!errors.goals}
              />
            </FormField>

            <FormField
              label="פעילויות שבוצעו"
              htmlFor="activitiesPerformed"
              required
              error={errors.activitiesPerformed}
            >
              <Textarea
                id="activitiesPerformed"
                name="activitiesPerformed"
                value={form.activitiesPerformed}
                onChange={handleChange}
                placeholder="תיאור הפעילויות והתרגילים שבוצעו במהלך הטיפול..."
                error={!!errors.activitiesPerformed}
              />
            </FormField>

            <FormField label="סיכום" htmlFor="summary" required error={errors.summary}>
              <Textarea
                id="summary"
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder="סיכום כללי של הטיפול..."
                error={!!errors.summary}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>הערכה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="רמת התקדמות" htmlFor="progressLevel" required>
                <NativeSelect
                  id="progressLevel"
                  name="progressLevel"
                  value={form.progressLevel}
                  onChange={handleChange}
                  options={progressOptions}
                />
              </FormField>

              <FormField label="רמת שיתוף פעולה" htmlFor="cooperationLevel" required>
                <NativeSelect
                  id="cooperationLevel"
                  name="cooperationLevel"
                  value={form.cooperationLevel}
                  onChange={handleChange}
                  options={cooperationOptions}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>מידע נוסף (אופציונלי)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="משימות בית" htmlFor="homeAssignments">
              <Textarea
                id="homeAssignments"
                name="homeAssignments"
                value={form.homeAssignments}
                onChange={handleChange}
                placeholder="תרגילים או משימות לביצוע בבית..."
              />
            </FormField>

            <FormField label="תכנון לטיפול הבא" htmlFor="nextSessionPlan">
              <Textarea
                id="nextSessionPlan"
                name="nextSessionPlan"
                value={form.nextSessionPlan}
                onChange={handleChange}
                placeholder="מה מתוכנן לטיפול הבא..."
              />
            </FormField>

            <FormField label="המלצות" htmlFor="recommendations">
              <Textarea
                id="recommendations"
                name="recommendations"
                value={form.recommendations}
                onChange={handleChange}
                placeholder="המלצות כלליות או הפניות נוספות..."
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
