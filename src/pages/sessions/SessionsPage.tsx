import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSessions, useDeleteSession } from '@/hooks/useSessions'
import { usePatients } from '@/hooks/usePatients'
import { PROGRESS_LEVEL_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import type { ProgressLevel, TherapySession } from '@/types'

const progressFilters: Array<{ value: ProgressLevel | 'all'; label: string }> = [
  { value: 'all', label: 'הכל' },
  { value: 'significant', label: 'משמעותי' },
  { value: 'good', label: 'טוב' },
  { value: 'moderate', label: 'בינוני' },
  { value: 'minimal', label: 'מינימלי' },
  { value: 'no_change', label: 'ללא שינוי' },
]

const progressColors: Record<ProgressLevel, string> = {
  significant: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  minimal: 'bg-orange-100 text-orange-700',
  no_change: 'bg-gray-100 text-gray-700',
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions()
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const deleteMutation = useDeleteSession()
  const [search, setSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState<string>('all')
  const [progressFilter, setProgressFilter] = useState<ProgressLevel | 'all'>('all')

  const filtered = sessions.filter(s => {
    const patient = patients.find(p => p.id === s.patientId)
    const term = search.trim()
    const matchesSearch =
      !term ||
      patient?.fullName.includes(term) ||
      s.goals.includes(term) ||
      s.summary.includes(term)
    const matchesPatient = patientFilter === 'all' || s.patientId === patientFilter
    const matchesProgress = progressFilter === 'all' || s.progressLevel === progressFilter
    return matchesSearch && matchesPatient && matchesProgress
  })

  const sortedSessions = [...filtered].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))

  function getPatientName(patientId: string): string {
    return patients.find(p => p.id === patientId)?.fullName ?? 'לא ידוע'
  }

  function handleDelete(e: React.MouseEvent, session: TherapySession) {
    e.stopPropagation()
    const patientName = getPatientName(session.patientId)
    if (confirm(`האם למחוק טיפול מס' ${session.sessionNumber} של ${patientName}?`)) {
      deleteMutation.mutate(session.id, {
        onSuccess: () => toast.success('הטיפול נמחק'),
        onError: () => toast.error('שגיאה במחיקת הטיפול'),
      })
    }
  }

  if (sessionsLoading || patientsLoading) return <LoadingSpinner />

  const activePatients = patients.filter(p => p.status === 'active')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">טיפולים</h2>
        <Link
          to="/sessions/new"
          className="flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          טיפול חדש
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="חיפוש לפי שם מטופל או תוכן..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 ps-10 pe-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <select
          value={patientFilter}
          onChange={e => setPatientFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">כל המטופלים</option>
          {activePatients.map(p => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
        <select
          value={progressFilter}
          onChange={e => setProgressFilter(e.target.value as ProgressLevel | 'all')}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          {progressFilters.map(pf => (
            <option key={pf.value} value={pf.value}>{pf.label}</option>
          ))}
        </select>
      </div>

      {sortedSessions.length === 0 ? (
        <EmptyState
          message={
            search || patientFilter !== 'all' || progressFilter !== 'all'
              ? 'לא נמצאו תוצאות'
              : 'אין טיפולים רשומים'
          }
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-start text-sm font-medium px-4 py-3">מטופל</th>
                <th className="text-start text-sm font-medium px-4 py-3">מס' טיפול</th>
                <th className="text-start text-sm font-medium px-4 py-3">תאריך</th>
                <th className="text-start text-sm font-medium px-4 py-3">התקדמות</th>
                <th className="text-start text-sm font-medium px-4 py-3">סיכום</th>
                <th className="text-start text-sm font-medium px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map(session => (
                <tr
                  key={session.id}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium">{getPatientName(session.patientId)}</td>
                  <td className="px-4 py-3 text-sm">#{session.sessionNumber}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">
                    {new Intl.DateTimeFormat('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(session.sessionDate))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        progressColors[session.progressLevel],
                      )}
                    >
                      {PROGRESS_LEVEL_LABELS[session.progressLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{session.summary}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/sessions/${session.id}`)
                        }}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="צפייה"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/sessions/${session.id}`)
                        }}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="עריכה"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => handleDelete(e, session)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                        title="מחיקה"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
