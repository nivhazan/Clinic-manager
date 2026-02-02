import { useNavigate } from 'react-router-dom'
import type { TherapySession, Patient } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'

interface OpenDebtsPreviewProps {
  sessions: TherapySession[]
  patients: Patient[]
}

export function OpenDebtsPreview({ sessions, patients }: OpenDebtsPreviewProps) {
  const navigate = useNavigate()

  const patientMap = new Map(patients.map(p => [p.id, p]))

  if (sessions.length === 0) {
    return (
      <div className="border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold mb-4">חובות פתוחים</h3>
        <EmptyState message="אין חובות פתוחים 🎉" />
      </div>
    )
  }

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-4 text-orange-900">חובות פתוחים</h3>
      <div className="space-y-2">
        {sessions.slice(0, 5).map(session => {
          const patient = patientMap.get(session.patientId)
          if (!patient) return null

          return (
            <div
              key={session.id}
              className="flex items-center gap-4 p-3 bg-white border border-orange-200 rounded-md hover:bg-orange-50/50 transition-colors"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">מטופל</div>
                  <div className="font-medium">{patient.fullName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">טיפול</div>
                  <div>#{session.sessionNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">תאריך</div>
                  <div dir="ltr">
                    {new Intl.DateTimeFormat('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(session.sessionDate))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">סכום</div>
                  <div className="font-medium">₪{patient.sessionPrice.toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={() =>
                  navigate(
                    `/payments/new?patientId=${session.patientId}&sessionId=${session.id}&amount=${patient.sessionPrice}`,
                  )
                }
                className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors whitespace-nowrap"
              >
                צור תשלום
              </button>
            </div>
          )
        })}
      </div>
      {sessions.length > 5 && (
        <div className="mt-3 text-sm text-orange-700">
          ועוד {sessions.length - 5} חובות נוספים
        </div>
      )}
    </div>
  )
}
