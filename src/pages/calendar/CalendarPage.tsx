import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react'
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

type ViewMode = 'day' | 'week' | 'month'

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-gray-100 text-gray-700 border-gray-200',
  canceled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-orange-100 text-orange-700 border-orange-200',
}

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

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

function getMonthDates(baseDate: Date) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  const dates = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
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

function formatMonthYear(date: Date): string {
  return `${HEBREW_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function isSameMonth(date: Date, referenceDate: Date): boolean {
  return date.getMonth() === referenceDate.getMonth() &&
         date.getFullYear() === referenceDate.getFullYear()
}

function AppointmentCard({
  appointment,
  patientName,
  onEdit,
  onDelete,
  onMarkPaid
}: {
  appointment: Appointment
  patientName: string
  onEdit: () => void
  onDelete: () => void
  onMarkPaid: () => void
}) {
  const canMarkPaid = !appointment.isPaid && (appointment.status === 'completed' || appointment.status === 'confirmed')

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
          {canMarkPaid && (
            <button
              onClick={onMarkPaid}
              className="p-1 rounded hover:bg-green-100 transition-colors text-green-700"
              title="סמן כשולם"
            >
              <DollarSign className="h-3 w-3" />
            </button>
          )}
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
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments()
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const deleteMutation = useDeleteAppointment()

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
  const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate])

  const patientMap = useMemo(() => {
    return Object.fromEntries(patients.map(p => [p.id, p.fullName]))
  }, [patients])

  const patientPriceMap = useMemo(() => {
    return Object.fromEntries(patients.map(p => [p.id, p.sessionPrice]))
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

  function handlePrev() {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  function handleNext() {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  function handleDayClick(date: Date) {
    setCurrentDate(date)
    setViewMode('day')
  }

  function handleDelete(appointment: Appointment) {
    if (confirm(`האם למחוק את הפגישה עם ${patientMap[appointment.patientId]}?`)) {
      deleteMutation.mutate(appointment.id, {
        onSuccess: () => toast.success('הפגישה נמחקה'),
        onError: () => toast.error('שגיאה במחיקת הפגישה'),
      })
    }
  }

  function handleMarkPaid(appointment: Appointment) {
    const amount = patientPriceMap[appointment.patientId] || ''
    navigate(`/payments/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}&amount=${amount}`)
  }

  function getDateRangeText(): string {
    if (viewMode === 'day') {
      return new Intl.DateTimeFormat('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(currentDate)
    } else if (viewMode === 'week') {
      return `${formatDisplayDate(weekDates[0])} - ${formatDisplayDate(weekDates[6])}`
    } else {
      return formatMonthYear(currentDate)
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

      {/* View Switcher & Navigation */}
      <div className="flex items-center justify-between border border-border rounded-lg p-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title={viewMode === 'day' ? 'יום קודם' : viewMode === 'week' ? 'שבוע קודם' : 'חודש קודם'}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          {/* View Mode Buttons */}
          <div className="flex gap-1 border border-border rounded-md p-1">
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'day'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              יום
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              שבוע
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'month'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              חודש
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            היום
          </button>

          {/* Date Range */}
          <div className="text-sm font-medium min-w-[200px] text-center">
            {getDateRangeText()}
          </div>
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title={viewMode === 'day' ? 'יום הבא' : viewMode === 'week' ? 'שבוע הבא' : 'חודש הבא'}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="border border-border rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">
            {DAY_LABELS[String(currentDate.getDay())]} - {formatDisplayDate(currentDate)}
          </h3>
          {(() => {
            const dateStr = formatDate(currentDate)
            const dayAppointments = appointmentsByDate[dateStr] || []

            if (dayAppointments.length === 0) {
              return <EmptyState message="אין פגישות ליום זה" />
            }

            return (
              <div className="space-y-3">
                {dayAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">שעה</div>
                        <div className="text-sm font-medium" dir="ltr">{apt.time}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">מטופל</div>
                        <div className="text-sm font-medium">{patientMap[apt.patientId] || 'לא ידוע'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">סוג</div>
                        <div className="text-sm">{SESSION_TYPE_LABELS[apt.sessionType]}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">סטטוס</div>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[apt.status])}>
                          {APPOINTMENT_STATUS_LABELS[apt.status]}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {apt.isPaid ? (
                        <span className="text-xs text-green-600 font-medium">✓ שולם</span>
                      ) : (apt.status === 'completed' || apt.status === 'confirmed') ? (
                        <button
                          onClick={() => handleMarkPaid(apt)}
                          className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
                        >
                          סמן כשולם
                        </button>
                      ) : null}
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
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-7 gap-3">
          {weekDates.map((date, index) => {
            const dateStr = formatDate(date)
            const dayAppointments = appointmentsByDate[dateStr] || []

            return (
              <div key={index} className={cn(
                'border border-border rounded-lg p-3 min-h-[200px] cursor-pointer hover:bg-muted/30 transition-colors',
                isToday(date) && 'bg-primary/5 border-primary/30'
              )}
              onClick={() => handleDayClick(date)}
              >
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
                      onMarkPaid={() => handleMarkPaid(apt)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthDates.map((date, index) => {
              const dateStr = formatDate(date)
              const dayAppointments = appointmentsByDate[dateStr] || []
              const isCurrentMonth = isSameMonth(date, currentDate)

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    'border border-border rounded-lg p-3 min-h-[100px] text-right hover:bg-muted/50 transition-colors',
                    !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                    isToday(date) && 'bg-primary/10 border-primary/50 ring-2 ring-primary/20'
                  )}
                >
                  <div className={cn(
                    'text-sm font-semibold mb-2',
                    isToday(date) && 'text-primary'
                  )}>
                    {date.getDate()}
                  </div>
                  {dayAppointments.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-primary">
                        {dayAppointments.length} {dayAppointments.length === 1 ? 'פגישה' : 'פגישות'}
                      </div>
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded truncate',
                            statusColors[apt.status]
                          )}
                          dir="ltr"
                        >
                          {apt.time}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayAppointments.length - 2} נוספות
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming Appointments - Only show in week view */}
      {viewMode === 'week' && (
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
                    {!apt.isPaid && (apt.status === 'completed' || apt.status === 'confirmed') && (
                      <button
                        onClick={() => handleMarkPaid(apt)}
                        className="p-1.5 rounded-md hover:bg-green-100 text-green-700 transition-colors"
                        title="סמן כשולם"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                    )}
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
      )}
    </div>
  )
}
