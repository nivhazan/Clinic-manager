import { CheckCircle2, XCircle } from 'lucide-react'
import type { TherapySession, Patient } from '@/types'
import { PROGRESS_LEVEL_LABELS } from '@/lib/constants'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import type { ProgressLevel } from '@/types'

interface RecentSessionsProps {
  sessions: TherapySession[]
  patients: Patient[]
}

const progressVariant: Record<ProgressLevel, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  significant: 'success',
  good: 'info',
  moderate: 'warning',
  minimal: 'danger',
  no_change: 'neutral',
}

export function RecentSessions({ sessions, patients }: RecentSessionsProps) {
  const patientMap = new Map(patients.map(p => [p.id, p]))

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>טיפולים אחרונים</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="אין טיפולים רשומים" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>טיפולים אחרונים</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.slice(0, 5).map(session => {
            const patient = patientMap.get(session.patientId)

            return (
              <div
                key={session.id}
                className="flex items-center gap-4 p-3 border border-border rounded-md hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">מטופל</div>
                    <div className="font-medium">{patient?.fullName || 'לא ידוע'}</div>
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
                    <div className="text-xs text-muted-foreground mb-1">התקדמות</div>
                    <Badge variant={progressVariant[session.progressLevel]} size="sm">
                      {PROGRESS_LEVEL_LABELS[session.progressLevel]}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">תשלום</div>
                    <div className="flex items-center gap-1">
                      {session.isPaid ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">שולם</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-xs text-orange-600 font-medium">לא שולם</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
