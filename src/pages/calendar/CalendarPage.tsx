import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAppointments, useDeleteAppointment } from '@/hooks/useAppointments'
import { usePatients } from '@/hooks/usePatients'
import {
  APPOINTMENT_STATUS_LABELS,
  SESSION_TYPE_LABELS,
  DAY_LABELS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Appointment, AppointmentStatus } from '@/types'

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-gray-100 text-gray-700 border-gray-200',
  canceled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-orange-100 text-orange-700 border-orange-200',
}

function getWeekDates(baseDate: Date) {
  const start = new Date(baseDate)
  start.setDate(start.getDate() - start.getDay())

  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    dates.push(date)
  }
  return dates
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit'
  }).format(date)
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function AppointmentCard({
  appointment,
  patientName,
  onEdit,
  onDelete
}: {
  appointment: Appointment
  patientName: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={cn(
      'p-3 rounded-md border text-xs space-y-1.5',
      statusColors[appointment.status]
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{patientName}</div>
          <div className="text-xs opacity-80" dir="ltr">{appointment.time}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            title="עריכה"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            title="מחיקה"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="text-[10px] opacity-70">{SESSION_TYPE_LABELS[appointment.sessionType]}</div>
      {appointment.isPaid && <div className="text-[10px] font-medium">✓ שולם</div>}
    </div>
  )
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments()
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const deleteMutation = useDeleteAppointment()

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  const patientMap = useMemo(() => {
    return Object.fromEntries(patients.map(p => [p.id, p.fullName]))
  }, [patients])

  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {}
    appointments.forEach(apt => {
      if (!grouped[apt.date]) grouped[apt.date] = []
      grouped[apt.date].push(apt)
    })

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.time.localeCompare(b.time))
    })

    return grouped
  }, [appointments])

  const upcomingAppointments = useMemo(() => {
    const today = formatDate(new Date())
    return appointments
      .filter(apt => apt.date >= today && apt.status !== 'canceled' && apt.status !== 'completed')
      .sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date)
        return dateComp !== 0 ? dateComp : a.time.localeCompare(b.time)
      })
      .slice(0, 10)
  }, [appointments])

  function handlePrevWeek() {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  function handleNextWeek() {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  function handleDelete(appointment: Appointment) {
    if (confirm(`האם למחוק את הפגישה עם ${patientMap[appointment.patientId]}?`)) {
      deleteMutation.mutate(appointment.id, {
        onSuccess: () => toast.success('הפגישה נמחקה'),
        onError: () => toast.error('שגיאה במחיקת הפגישה'),
      })
    }
  }

  if (appointmentsLoading || patientsLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">יומן</h2>
        <Link
          to="/calendar/new"
          className="flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          תור חדש
        </Link>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between border border-border rounded-lg p-4">
        <button
          onClick={handlePrevWeek}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="שבוע קודם"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            היום
          </button>
          <div className="text-sm font-medium">
            {formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}
          </div>
        </div>
        <button
          onClick={handleNextWeek}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="שבוע הבא"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-3">
        {weekDates.map((date, index) => {
          const dateStr = formatDate(date)
          const dayAppointments = appointmentsByDate[dateStr] || []

          return (
            <div key={index} className={cn(
              'border border-border rounded-lg p-3 min-h-[200px]',
              isToday(date) && 'bg-primary/5 border-primary/30'
            )}>
              <div className="text-center mb-3">
                <div className={cn(
                  'text-xs font-medium text-muted-foreground',
                  isToday(date) && 'text-primary font-semibold'
                )}>
                  {DAY_LABELS[String(date.getDay())]}
                </div>
                <div className={cn(
                  'text-lg font-semibold mt-1',
                  isToday(date) && 'text-primary'
                )}>
                  {date.getDate()}
                </div>
              </div>
              <div className="space-y-2">
                {dayAppointments.map(apt => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    patientName={patientMap[apt.patientId] || 'לא ידוע'}
                    onEdit={() => window.location.href = `/calendar/${apt.id}/edit`}
                    onDelete={() => handleDelete(apt)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upcoming Appointments */}
      <div className="border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold mb-4">פגישות קרובות</h3>
        {upcomingAppointments.length === 0 ? (
          <EmptyState message="אין פגישות קרובות" />
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map(apt => (
              <div key={apt.id} className="flex items-center gap-4 p-3 border border-border rounded-md hover:bg-muted/30 transition-colors">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                  <div className="font-medium">{patientMap[apt.patientId] || 'לא ידוע'}</div>
                  <div dir="ltr" className="text-muted-foreground">
                    {new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(apt.date))}
                  </div>
                  <div dir="ltr" className="text-muted-foreground">{apt.time}</div>
                  <div>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs border', statusColors[apt.status])}>
                      {APPOINTMENT_STATUS_LABELS[apt.status]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/calendar/${apt.id}/edit`}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="עריכה"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(apt)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                    title="מחיקה"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
