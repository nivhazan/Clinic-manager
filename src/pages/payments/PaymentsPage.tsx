import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { usePayments, useDeletePayment } from '@/hooks/usePayments'
import { usePatients } from '@/hooks/usePatients'
import { useSessions } from '@/hooks/useSessions'
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/constants'
import { computeDebts } from '@/lib/debts'
import { PageHeader, FilterBar } from '@/components/layout'
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ConfirmDialog,
  toast,
} from '@/components/ui'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Payment } from '@/types'

const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
]

const paymentMethodFilters = [
  { value: 'all', label: 'כל האמצעים' },
  { value: 'cash', label: 'מזומן' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'credit_card', label: 'כרטיס אשראי' },
  { value: 'check', label: "צ'ק" },
  { value: 'bit', label: 'ביט' },
  { value: 'paybox', label: 'פייבוקס' },
]

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader title="תשלומים" />

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">תשלומים</TabsTrigger>
          <TabsTrigger value="schedules">תשלומים קבועים</TabsTrigger>
          <TabsTrigger value="invoices">חשבוניות</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="schedules">
          <EmptyState message="תשלומים קבועים - בפיתוח" />
        </TabsContent>
        <TabsContent value="invoices">
          <EmptyState message="חשבוניות - בפיתוח" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PaymentsTab() {
  const navigate = useNavigate()
  const { data: payments = [], isLoading: paymentsLoading } = usePayments()
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions()
  const deleteMutation = useDeletePayment()

  const [search, setSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const patientMap = useMemo(() => {
    return new Map(patients.map(p => [p.id, p]))
  }, [patients])

  const debtResult = useMemo(() => {
    return computeDebts(patients, sessions, payments, today)
  }, [patients, sessions, payments, today])

  const { overdueDebts, pendingMonthly } = debtResult

  const enrichedPayments = useMemo(() => {
    return payments.map(p => ({
      ...p,
      patientName: patientMap.get(p.patientId)?.fullName ?? 'מטופל לא נמצא',
    }))
  }, [payments, patientMap])

  const filtered = enrichedPayments.filter(p => {
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      p.patientName.toLowerCase().includes(term) ||
      (p.notes?.toLowerCase().includes(term) ?? false)
    const matchesPatient = patientFilter === 'all' || p.patientId === patientFilter
    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter
    return matchesSearch && matchesPatient && matchesMethod
  })

  const sortedPayments = [...filtered].sort((a, b) => b.date.localeCompare(a.date))

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success({ title: 'התשלום נמחק' })
        setDeleteTarget(null)
      },
      onError: () => toast.error({ title: 'שגיאה במחיקת התשלום' }),
    })
  }

  const isLoading = paymentsLoading || patientsLoading || sessionsLoading
  const activePatients = patients.filter(p => p.status === 'active')

  const patientFilterOptions = [
    { value: 'all', label: 'כל המטופלים' },
    ...activePatients.map(p => ({ value: p.id, label: p.fullName })),
  ]

  return (
    <div className="space-y-6">
      {/* Overdue Debts (Red) */}
      {overdueDebts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">חובות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueDebts.map((debt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 bg-white border border-red-200 rounded-md hover:bg-red-50/50 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">מטופל</div>
                      <div className="font-medium">{debt.patientName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">פירוט</div>
                      <div>
                        {debt.type === 'session'
                          ? `טיפול #${debt.sessionNumber}`
                          : `חיוב חודשי - ${HEBREW_MONTHS[debt.month!]}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">תאריך</div>
                      <div dir="ltr">
                        {debt.type === 'session'
                          ? new Intl.DateTimeFormat('he-IL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }).format(new Date(debt.sessionDate!))
                          : `${String(debt.month! + 1).padStart(2, '0')}/${debt.year}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">סכום</div>
                      <div className="font-medium">₪{debt.amount.toLocaleString()}</div>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (debt.type === 'session') {
                        navigate(
                          `/payments/new?patientId=${debt.patientId}&sessionId=${debt.sessionId}&amount=${debt.amount}`
                        )
                      } else {
                        const period = `${debt.year}-${String((debt.month ?? 0) + 1).padStart(2, '0')}`
                        navigate(
                          `/payments/new?patientId=${debt.patientId}&amount=${debt.amount}&paymentType=monthly&billingPeriod=${period}`
                        )
                      }
                    }}
                  >
                    צור תשלום
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Monthly (Yellow) */}
      {pendingMonthly.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">ממתינים חודשיים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingMonthly.map((debt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 bg-white border border-yellow-200 rounded-md hover:bg-yellow-50/50 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">מטופל</div>
                      <div className="font-medium">{debt.patientName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">פירוט</div>
                      <div>חיוב חודשי - {HEBREW_MONTHS[debt.month!]}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">חודש</div>
                      <div dir="ltr">{`${String(debt.month! + 1).padStart(2, '0')}/${debt.year}`}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">סכום</div>
                      <div className="font-medium">₪{debt.amount.toLocaleString()}</div>
                    </div>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      const period = `${debt.year}-${String((debt.month ?? 0) + 1).padStart(2, '0')}`
                      navigate(
                        `/payments/new?patientId=${debt.patientId}&amount=${debt.amount}&paymentType=monthly&billingPeriod=${period}`
                      )
                    }}
                  >
                    צור תשלום
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + New Payment Button */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'חיפוש לפי שם מטופל...',
        }}
        filters={[
          {
            value: patientFilter,
            onChange: setPatientFilter,
            options: patientFilterOptions,
          },
          {
            value: methodFilter,
            onChange: setMethodFilter,
            options: paymentMethodFilters,
          },
        ]}
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/payments/new')}>
          תשלום חדש
        </Button>
      </FilterBar>

      {/* Payments Table */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מטופל</TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead>סכום</TableHead>
              <TableHead>אמצעי תשלום</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>הערות</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayments.length === 0 ? (
              <TableEmpty
                colSpan={7}
                message={
                  search || patientFilter !== 'all' || methodFilter !== 'all'
                    ? 'לא נמצאו תוצאות'
                    : 'אין תשלומים רשומים'
                }
              />
            ) : (
              sortedPayments.map(payment => (
                <TableRow
                  key={payment.id}
                  clickable
                  onClick={() => navigate(`/payments/${payment.id}/edit`)}
                >
                  <TableCell className="font-medium">{payment.patientName}</TableCell>
                  <TableCell dir="ltr">
                    {new Intl.DateTimeFormat('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(payment.date))}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₪{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{PAYMENT_TYPE_LABELS[payment.paymentType]}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{payment.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/payments/${payment.id}/edit`)
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
                          setDeleteTarget(payment)
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
        title="מחיקת תשלום"
        message={`האם למחוק תשלום של ${patientMap.get(deleteTarget?.patientId ?? '')?.fullName ?? ''} בסך ₪${deleteTarget?.amount ?? 0}?`}
        confirmText="מחק"
        cancelText="ביטול"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
