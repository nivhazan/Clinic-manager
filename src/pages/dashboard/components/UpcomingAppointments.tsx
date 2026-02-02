import { useNavigate } from 'react-router-dom'
import { DollarSign } from 'lucide-react'
import type { Appointment, Patient } from '@/types'
import { APPOINTMENT_STATUS_LABELS, SESSION_TYPE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
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

export function UpcomingAppointments({ appointments, patients }: UpcomingAppointmentsProps) {
  const navigate = useNavigate()
  const patientMap = new Map(patients.map(p => [p.id, p]))

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
    navigate(`/payments/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}&amount=${amount}`)
  }

  return (
    <div className="border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-4">פגישות קרובות</h3>
      <div className="space-y-3">
        {appointments.slice(0, 5).map(apt => {
          const patient = patientMap.get(apt.patientId)
          const canMarkPaid = !apt.isPaid && (apt.status === 'completed' || apt.status === 'confirmed')

          return (
            <div
              key={apt.id}
              className="flex items-center gap-4 p-3 border border-border rounded-md hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">שעה</div>
                  <div className="font-medium" dir="ltr">
                    {apt.time}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">מטופל</div>
                  <div className="font-medium">{patient?.fullName || 'לא ידוע'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">סוג</div>
                  <div>{SESSION_TYPE_LABELS[apt.sessionType]}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">סטטוס</div>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[apt.status])}>
                    {APPOINTMENT_STATUS_LABELS[apt.status]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {apt.isPaid ? (
                  <span className="text-xs text-green-600 font-medium whitespace-nowrap">✓ שולם</span>
                ) : canMarkPaid ? (
                  <button
                    onClick={() => handleMarkPaid(apt)}
                    className="px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap"
                  >
                    <DollarSign className="h-3 w-3" />
                    סמן כשולם
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
