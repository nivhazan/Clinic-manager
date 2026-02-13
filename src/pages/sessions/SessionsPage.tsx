import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { useSessions, useDeleteSession } from '@/hooks/useSessions'
import { usePatients } from '@/hooks/usePatients'
import { PROGRESS_LEVEL_LABELS } from '@/lib/constants'
import { PageHeader, FilterBar } from '@/components/layout'
import {
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  ConfirmDialog,
  toast,
} from '@/components/ui'
import { SkeletonTable } from '@/components/ui/Skeleton'
import type { ProgressLevel, TherapySession } from '@/types'

const progressFilters = [
  { value: 'all', label: 'כל רמות ההתקדמות' },
  { value: 'significant', label: 'משמעותי' },
  { value: 'good', label: 'טוב' },
  { value: 'moderate', label: 'בינוני' },
  { value: 'minimal', label: 'מינימלי' },
  { value: 'no_change', label: 'ללא שינוי' },
]

const progressVariant: Record<ProgressLevel, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  significant: 'success',
  good: 'info',
  moderate: 'warning',
  minimal: 'danger',
  no_change: 'neutral',
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions()
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const deleteMutation = useDeleteSession()

  const [search, setSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState('all')
  const [progressFilter, setProgressFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<TherapySession | null>(null)

  const filtered = sessions.filter(s => {
    const patient = patients.find(p => p.id === s.patientId)
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      patient?.fullName.toLowerCase().includes(term) ||
      s.goals.toLowerCase().includes(term) ||
      s.summary.toLowerCase().includes(term)
    const matchesPatient = patientFilter === 'all' || s.patientId === patientFilter
    const matchesProgress = progressFilter === 'all' || s.progressLevel === progressFilter
    return matchesSearch && matchesPatient && matchesProgress
  })

  const sortedSessions = [...filtered].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))

  function getPatientName(patientId: string): string {
    return patients.find(p => p.id === patientId)?.fullName ?? 'לא ידוע'
  }

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

  const isLoading = sessionsLoading || patientsLoading
  const activePatients = patients.filter(p => p.status === 'active')

  const patientFilterOptions = [
    { value: 'all', label: 'כל המטופלים' },
    ...activePatients.map(p => ({ value: p.id, label: p.fullName })),
  ]

  return (
    <div>
      <PageHeader
        title="טיפולים"
        action={{
          label: 'טיפול חדש',
          icon: <Plus className="h-4 w-4" />,
          href: '/sessions/new',
        }}
      />

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'חיפוש לפי שם מטופל או תוכן...',
        }}
        filters={[
          {
            value: patientFilter,
            onChange: setPatientFilter,
            options: patientFilterOptions,
          },
          {
            value: progressFilter,
            onChange: setProgressFilter,
            options: progressFilters,
          },
        ]}
      />

      {isLoading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מטופל</TableHead>
              <TableHead>מס' טיפול</TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead>התקדמות</TableHead>
              <TableHead>סיכום</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSessions.length === 0 ? (
              <TableEmpty
                colSpan={6}
                message={
                  search || patientFilter !== 'all' || progressFilter !== 'all'
                    ? 'לא נמצאו תוצאות'
                    : 'אין טיפולים רשומים'
                }
              />
            ) : (
              sortedSessions.map(session => (
                <TableRow
                  key={session.id}
                  clickable
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <TableCell className="font-medium">
                    {getPatientName(session.patientId)}
                  </TableCell>
                  <TableCell>#{session.sessionNumber}</TableCell>
                  <TableCell dir="ltr">
                    {new Intl.DateTimeFormat('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(session.sessionDate))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={progressVariant[session.progressLevel]}>
                      {PROGRESS_LEVEL_LABELS[session.progressLevel]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{session.summary}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/sessions/${session.id}`)
                        }}
                        title="צפייה"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/sessions/${session.id}`)
                        }}
                        title="עריכה"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={e => {
                          e.stopPropagation()
                          setDeleteTarget(session)
                        }}
                        title="מחיקה"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="מחיקת טיפול"
        message={`האם למחוק טיפול מס' ${deleteTarget?.sessionNumber} של ${getPatientName(deleteTarget?.patientId ?? '')}?`}
        confirmText="מחק"
        cancelText="ביטול"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
