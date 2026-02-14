import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { usePatients, useDeletePatient } from '@/hooks/usePatients'
import { useDocumentsByOwner } from '@/hooks/useDocuments'
import { PATIENT_STATUS_LABELS } from '@/lib/constants'
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
import type { PatientStatus, Patient } from '@/types'

const statusFilters = [
  { value: 'all', label: 'כל הסטטוסים' },
  { value: 'active', label: 'פעיל' },
  { value: 'inactive', label: 'לא פעיל' },
  { value: 'treatment_completed', label: 'טיפול הושלם' },
]

const statusVariant: Record<PatientStatus, 'success' | 'neutral' | 'info'> = {
  active: 'success',
  inactive: 'neutral',
  treatment_completed: 'info',
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const { data: patients = [], isLoading } = usePatients()
  const deleteMutation = useDeletePatient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)
  const { data: deleteTargetDocs = [] } = useDocumentsByOwner('patient', deleteTarget?.id ?? '')

  const filtered = patients.filter(p => {
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      p.fullName.toLowerCase().includes(term) ||
      p.idNumber.includes(term) ||
      p.phone.includes(term)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success({ title: 'המטופל נמחק בהצלחה' })
        setDeleteTarget(null)
      },
      onError: () => {
        toast.error({ title: 'שגיאה במחיקת המטופל' })
      },
    })
  }

  return (
    <div>
      <PageHeader
        title="מטופלים"
        action={{
          label: 'הוסף מטופל',
          icon: <Plus className="h-4 w-4" />,
          href: '/patients/new',
        }}
      />

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'חיפוש לפי שם, ת.ז. או טלפון...',
        }}
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusFilters,
          },
        ]}
      />

      {isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם מלא</TableHead>
              <TableHead>ת.ז.</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty
                colSpan={5}
                message={
                  search || statusFilter !== 'all'
                    ? 'לא נמצאו תוצאות'
                    : 'אין מטופלים רשומים'
                }
              />
            ) : (
              filtered.map(patient => (
                <TableRow
                  key={patient.id}
                  clickable
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <TableCell className="font-medium">{patient.fullName}</TableCell>
                  <TableCell>{patient.idNumber}</TableCell>
                  <TableCell dir="ltr">{patient.phone}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[patient.status]}>
                      {PATIENT_STATUS_LABELS[patient.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/patients/${patient.id}`)
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
                          navigate(`/patients/${patient.id}/edit`)
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
                          setDeleteTarget(patient)
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
        title="מחיקת מטופל"
        message={
          `האם למחוק את המטופל "${deleteTarget?.fullName}"? פעולה זו בלתי הפיכה.` +
          (deleteTargetDocs.length > 0
            ? `\nלמטופל זה ${deleteTargetDocs.length} מסמכים מצורפים. המסמכים לא יימחקו.`
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
