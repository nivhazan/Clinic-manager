import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePatients, useDeletePatient } from '@/hooks/usePatients'
import { PATIENT_STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import type { PatientStatus } from '@/types'

const statusFilters: Array<{ value: PatientStatus | 'all'; label: string }> = [
  { value: 'all', label: 'הכל' },
  { value: 'active', label: 'פעיל' },
  { value: 'inactive', label: 'לא פעיל' },
  { value: 'treatment_completed', label: 'טיפול הושלם' },
]

const statusColors: Record<PatientStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  treatment_completed: 'bg-blue-100 text-blue-700',
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const { data: patients = [], isLoading } = usePatients()
  const deleteMutation = useDeletePatient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all')

  const filtered = patients.filter(p => {
    const term = search.trim()
    const matchesSearch =
      !term || p.fullName.includes(term) || p.idNumber.includes(term) || p.phone.includes(term)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation()
    if (confirm(`האם למחוק את המטופל "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('המטופל נמחק'),
        onError: () => toast.error('שגיאה במחיקת המטופל'),
      })
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">מטופלים</h2>
        <Link
          to="/patients/new"
          className="flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          הוסף מטופל
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, ת.ז. או טלפון..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 ps-10 pe-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as PatientStatus | 'all')}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          {statusFilters.map(sf => (
            <option key={sf.value} value={sf.value}>{sf.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={search || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'אין מטופלים רשומים'} />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-start text-sm font-medium px-4 py-3">שם מלא</th>
                <th className="text-start text-sm font-medium px-4 py-3">ת.ז.</th>
                <th className="text-start text-sm font-medium px-4 py-3">טלפון</th>
                <th className="text-start text-sm font-medium px-4 py-3">סטטוס</th>
                <th className="text-start text-sm font-medium px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(patient => (
                <tr
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium">{patient.fullName}</td>
                  <td className="px-4 py-3 text-sm">{patient.idNumber}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{patient.phone}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[patient.status])}>
                      {PATIENT_STATUS_LABELS[patient.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/patients/${patient.id}`) }}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="צפייה"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/patients/${patient.id}/edit`) }}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="עריכה"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => handleDelete(e, patient.id, patient.fullName)}
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
