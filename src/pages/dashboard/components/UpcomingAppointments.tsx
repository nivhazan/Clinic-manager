import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign } from 'lucide-react'
import type { Appointment, Patient } from '@/types'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatYMDLocal } from '@/lib/dates'
import { EmptyState } from '@/components/shared/EmptyState'

interface UpcomingAppointmentsProps {
  appointments: Appointment[]
  patients: Patient[]
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  canceled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
}

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

interface DayGroup {
  label: string
  dateStr: string
  appointments: Appointment[]
}

export function UpcomingAppointments({ appointments, patients }: UpcomingAppointmentsProps) {
  const navigate = useNavigate()
  const patientMap = useMemo(() => new Map(patients.map(p => [p.id, p])), [patients])

  // Get today and tomorrow for labeling
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const todayStr = formatYMDLocal(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = formatYMDLocal(tomorrow)

  // Group appointments by day (limit to next 10 appointments)
  const dayGroups = useMemo(() => {
    const limited = appointments.slice(0, 10)
    const groups: DayGroup[] = []
    const groupMap = new Map<string, Appointment[]>()

    limited.forEach(apt => {
      const existing = groupMap.get(apt.date)
      if (existing) {
        existing.push(apt)
      } else {
        groupMap.set(apt.date, [apt])
      }
    })

    // Convert map to sorted array with labels
    const sortedDates = Array.from(groupMap.keys()).sort()

    sortedDates.forEach(dateStr => {
      const appts = groupMap.get(dateStr)!
      // Sort by time within each day
      appts.sort((a, b) => a.time.localeCompare(b.time))

      let label: string
      if (dateStr === todayStr) {
        label = 'היום'
      } else if (dateStr === tomorrowStr) {
        label = 'מחר'
      } else {
        const date = new Date(dateStr + 'T00:00:00')
        const dayName = DAY_NAMES[date.getDay()]
        const formatted = new Intl.DateTimeFormat('he-IL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date)
        label = `יום ${dayName} • ${formatted}`
      }

      groups.push({ label, dateStr, appointments: appts })
    })

    return groups
  }, [appointments, todayStr, tomorrowStr])

  if (appointments.length === 0) {
    return (
      <div className="border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold mb-4">פגישות קרובות</h3>
        <EmptyState message="אין פגישות קרובות" />
      </div>
    )
  }

  function handleMarkPaid(appointment: Appointment) {
    const patient = patientMap.get(appointment.patientId)
    const amount = patient?.sessionPrice || ''
    navigate(`/payments/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}&amount=${amount}&date=${appointment.date}`)
  }

  function handleRowClick(appointment: Appointment) {
    navigate(`/calendar/${appointment.id}/edit`)
  }

  return (
    <div className="border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-4">פגישות קרובות</h3>
      <div className="space-y-4">
        {dayGroups.map(group => (
          <div key={group.dateStr}>
            {/* Day header */}
            <div className={cn(
              'text-sm font-semibold mb-2 px-2 py-1 rounded',
              group.dateStr === todayStr && 'bg-primary/10 text-primary',
              group.dateStr === tomorrowStr && 'bg-blue-50 text-blue-700',
              group.dateStr !== todayStr && group.dateStr !== tomorrowStr && 'text-muted-foreground'
            )}>
              {group.label}
            </div>

            {/* Appointments for this day */}
            <div className="space-y-2">
              {group.appointments.map(apt => {
                const patient = patientMap.get(apt.patientId)
                const canMarkPaid = !apt.isPaid && (apt.status === 'completed' || apt.status === 'confirmed')

                return (
                  <div
                    key={apt.id}
                    onClick={() => handleRowClick(apt)}
                    className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    {/* Time */}
                    <div className="w-14 text-center">
                      <div className="text-sm font-semibold" dir="ltr">{apt.time}</div>
                    </div>

                    {/* Patient and status */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {patient?.fullName || 'לא ידוע'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[apt.status])}>
                          {APPOINTMENT_STATUS_LABELS[apt.status]}
                        </span>
                        {apt.isPaid && (
                          <span className="text-xs text-green-600 font-medium">✓ שולם</span>
                        )}
                      </div>
                    </div>

                    {/* Quick action - payment */}
                    {canMarkPaid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkPaid(apt)
                        }}
                        className="p-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        title="צור תשלום"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
