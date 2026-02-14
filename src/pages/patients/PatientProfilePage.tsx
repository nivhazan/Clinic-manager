import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Pencil, Trash2, Plus } from 'lucide-react'
import { usePatient, useDeletePatient } from '@/hooks/usePatients'
import { usePatientAppointments, useDeleteAppointment } from '@/hooks/useAppointments'
import { usePatientSessions, useDeleteSession } from '@/hooks/useSessions'
import { useDocumentsByOwner } from '@/hooks/useDocuments'
import {
  PATIENT_STATUS_LABELS,
  PAYMENT_FREQUENCY_LABELS,
  DAY_LABELS,
  APPOINTMENT_STATUS_LABELS,
  SESSION_TYPE_LABELS,
  PROGRESS_LEVEL_LABELS,
  COOPERATION_LEVEL_LABELS,
} from '@/lib/constants'
import { Button, ConfirmDialog, toast } from '@/components/ui'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { DocumentUpload, DocumentList } from '@/components/documents'
import type { Patient, PatientStatus, Appointment, AppointmentStatus, TherapySession, ProgressLevel } from '@/types'

const statusColors: Record<PatientStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  treatment_completed: 'bg-blue-100 text-blue-700',
}

const appointmentStatusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  canceled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
}

const tabs = [
  { id: 'details', label: 'פרטים' },
  { id: 'appointments', label: 'פגישות' },
  { id: 'sessions', label: 'טיפולים' },
  { id: 'payments', label: 'תשלומים' },
  { id: 'documents', label: 'מסמכים' },
] as const

function InfoField({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === '') return null
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value}</dd>
    </div>
  )
}

function DetailsTab({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-6">
      <div className="border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">פרטים אישיים</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField label="שם מלא" value={patient.fullName} />
          <InfoField label="מספר זהות" value={patient.idNumber} />
          <InfoField label="תאריך לידה" value={patient.dateOfBirth} />
          <InfoField label="טלפון" value={patient.phone} />
          <InfoField label="טלפון הורה" value={patient.parentPhone} />
          <InfoField label="אימייל" value={patient.email} />
          <InfoField label="כתובת" value={patient.address} />
        </dl>
      </div>

      <div className="border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">מידע רפואי</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="אבחנה ראשונית" value={patient.initialDiagnosis} />
          <InfoField label="רקע רפואי" value={patient.medicalBackground} />
          <InfoField label="מקור הפניה" value={patient.referralSource} />
          <InfoField label="איש קשר לחירום" value={patient.emergencyContact} />
          <InfoField label="טלפון חירום" value={patient.emergencyPhone} />
        </dl>
      </div>

      <div className="border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">סטטוס ותשלום</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField label="תדירות תשלום" value={PAYMENT_FREQUENCY_LABELS[patient.paymentFrequency]} />
          <InfoField label="מחיר טיפול" value={`₪${patient.sessionPrice}`} />
          {patient.monthlyPrice !== undefined && (
            <InfoField label="מחיר חודשי" value={`₪${patient.monthlyPrice}`} />
          )}
          {patient.recurringDay !== undefined && (
            <InfoField label="יום קבוע" value={DAY_LABELS[String(patient.recurringDay)]} />
          )}
          <InfoField label="שעה קבועה" value={patient.recurringTime} />
        </dl>
      </div>

      {patient.notes && (
        <div className="border border-border rounded-lg p-5">
          <h3 className="text-base font-semibold mb-2">הערות</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{patient.notes}</p>
        </div>
      )}
    </div>
  )
}

function AppointmentsTab({ patientId }: { patientId: string }) {
  const { data: appointments = [], isLoading } = usePatientAppointments(patientId)
  const deleteMutation = useDeleteAppointment()
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null)

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success({ title: 'הפגישה נמחקה' })
        setDeleteTarget(null)
      },
      onError: () => toast.error({ title: 'שגיאה במחיקת הפגישה' }),
    })
  }

  if (isLoading) return <LoadingSpinner />

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date)
    return dateComp !== 0 ? dateComp : b.time.localeCompare(a.time)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">רשימת פגישות</h3>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => window.location.href = `/calendar/new?patientId=${patientId}`}
        >
          פגישה חדשה
        </Button>
      </div>

      {sortedAppointments.length === 0 ? (
        <EmptyState message="אין פגישות למטופל זה" />
      ) : (
        <div className="space-y-3">
          {sortedAppointments.map(apt => (
            <div key={apt.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">תאריך</div>
                  <div className="text-sm font-medium" dir="ltr">
                    {new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(apt.date))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">שעה</div>
                  <div className="text-sm font-medium" dir="ltr">{apt.time}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">סוג</div>
                  <div className="text-sm">{SESSION_TYPE_LABELS[apt.sessionType]}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">סטטוס</div>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', appointmentStatusColors[apt.status])}>
                    {APPOINTMENT_STATUS_LABELS[apt.status]}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {apt.isPaid && (
                  <span className="text-xs text-green-600 font-medium">✓ שולם</span>
                )}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/calendar/${apt.id}/edit`}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="עריכה"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(apt)}
                    title="מחיקה"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="מחיקת פגישה"
        message={`האם למחוק את הפגישה מתאריך ${deleteTarget?.date ?? ''}?`}
        confirmText="מחק"
        cancelText="ביטול"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

const progressColors: Record<ProgressLevel, string> = {
  significant: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  minimal: 'bg-orange-100 text-orange-700',
  no_change: 'bg-gray-100 text-gray-700',
}

function SessionsTab({ patientId }: { patientId: string }) {
  const { data: sessions = [], isLoading } = usePatientSessions(patientId)
  const deleteMutation = useDeleteSession()
  const [deleteTarget, setDeleteTarget] = useState<TherapySession | null>(null)

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success({ title: 'הטיפול נמחק' })
        setDeleteTarget(null)
      },
      onError: () => toast.error({ title: 'שגיאה במחיקת הטיפול' }),
    })
  }

  if (isLoading) return <LoadingSpinner />

  const sortedSessions = [...sessions].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">רשימת טיפולים</h3>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => window.location.href = `/sessions/new?patientId=${patientId}`}
        >
          טיפול חדש
        </Button>
      </div>

      {sortedSessions.length === 0 ? (
        <EmptyState message="אין טיפולים למטופל זה" />
      ) : (
        <div className="space-y-3">
          {sortedSessions.map(session => (
            <div
              key={session.id}
              className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold">טיפול #{session.sessionNumber}</span>
                  <span className="text-sm text-muted-foreground" dir="ltr">
                    {new Intl.DateTimeFormat('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(session.sessionDate))}
                  </span>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', progressColors[session.progressLevel])}>
                    {PROGRESS_LEVEL_LABELS[session.progressLevel]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    שיתוף פעולה: {COOPERATION_LEVEL_LABELS[session.cooperationLevel]}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">מטרות</div>
                    <div className="line-clamp-2">{session.goals}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">סיכום</div>
                    <div className="line-clamp-2">{session.summary}</div>
                  </div>
                </div>

                {session.homeAssignments && (
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground mb-1">משימות בית</div>
                    <div className="line-clamp-1">{session.homeAssignments}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  to={`/sessions/${session.id}`}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="עריכה"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(session)}
                  title="מחיקה"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="מחיקת טיפול"
        message={`האם למחוק טיפול מס' ${deleteTarget?.sessionNumber ?? ''}?`}
        confirmText="מחק"
        cancelText="ביטול"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

export default function PatientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: patient, isLoading } = usePatient(id!)
  const deleteMutation = useDeletePatient()
  const [activeTab, setActiveTab] = useState<string>('details')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { data: patientDocs = [] } = useDocumentsByOwner('patient', id ?? '')

  if (isLoading) return <LoadingSpinner />
  if (!patient) return <EmptyState message="המטופל לא נמצא" />

  function handleDelete() {
    deleteMutation.mutate(patient!.id, {
      onSuccess: () => {
        toast.success({ title: 'המטופל נמחק' })
        navigate('/patients')
      },
      onError: () => toast.error({ title: 'שגיאה במחיקת המטופל' }),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/patients')}
            title="חזרה לרשימה"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">{patient.fullName}</h2>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColors[patient.status])}>
            {PATIENT_STATUS_LABELS[patient.status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            עריכה
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setShowDeleteDialog(true)}
          >
            מחיקה
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && <DetailsTab patient={patient} />}
      {activeTab === 'appointments' && <AppointmentsTab patientId={patient.id} />}
      {activeTab === 'sessions' && <SessionsTab patientId={patient.id} />}
      {activeTab === 'payments' && <EmptyState message="תשלומים - בפיתוח" />}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <DocumentUpload ownerType="patient" ownerId={patient.id} />
          <DocumentList ownerType="patient" ownerId={patient.id} />
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="מחיקת מטופל"
        message={
          `האם למחוק את המטופל "${patient.fullName}"? פעולה זו בלתי הפיכה.` +
          (patientDocs.length > 0
            ? `\nלמטופל זה ${patientDocs.length} מסמכים מצורפים. המסמכים לא יימחקו.`
            : '')
        }
        confirmText="מחק"
        cancelText="ביטול"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
