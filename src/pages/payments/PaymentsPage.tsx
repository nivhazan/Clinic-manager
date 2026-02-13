import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePayments, useDeletePayment } from '@/hooks/usePayments'
import { usePatients } from '@/hooks/usePatients'
import { useSessions } from '@/hooks/useSessions'
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/constants'
import { computeDebts } from '@/lib/debts'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import type { PaymentMethod, Payment } from '@/types'

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

const tabs = [
  { id: 'payments', label: 'תשלומים' },
  { id: 'schedules', label: 'תשלומים קבועים' },
  { id: 'invoices', label: 'חשבוניות' },
] as const

const paymentMethodFilters: Array<{ value: PaymentMethod | 'all'; label: string }> = [
  { value: 'all', label: 'הכל' },
  { value: 'cash', label: 'מזומן' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'credit_card', label: 'כרטיס אשראי' },
  { value: 'check', label: "צ'ק" },
  { value: 'bit', label: 'ביט' },
  { value: 'paybox', label: 'פייבוקס' },
]

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<string>('payments')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">תשלומים</h2>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'payments' && <PaymentsTab />}
      {activeTab === 'schedules' && <EmptyState message="תשלומים קבועים - בפיתוח" />}
      {activeTab === 'invoices' && <EmptyState message="חשבוניות - בפיתוח" />}
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
  const [patientFilter, setPatientFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  // Build patient map for lookups
  const patientMap = useMemo(() => {
    return new Map(patients.map(p => [p.id, p]))
  }, [patients])

  // Calculate debts using shared computation
  const debtResult = useMemo(() => {
    return computeDebts(patients, sessions, payments, today)
  }, [patients, sessions, payments, today])

  const overdueDebts = debtResult.overdueDebts
  const pendingMonthly = debtResult.pendingMonthly

  // Build enriched payments with patient names (handle deleted patients)
  const enrichedPayments = useMemo(() => {
    return payments.map(p => ({
      ...p,
      patientName: patientMap.get(p.patientId)?.fullName ?? 'מטופל לא נמצא',
    }))
  }, [payments, patientMap])

  const filtered = enrichedPayments.filter(p => {
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term || p.patientName.toLowerCase().includes(term) || (p.notes?.toLowerCase().includes(term) ?? false)
    const matchesPatient = patientFilter === 'all' || p.patientId === patientFilter
    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter
    return matchesSearch && matchesPatient && matchesMethod
  })

  const sortedPayments = [...filtered].sort((a, b) => b.date.localeCompare(a.date))

  function handleDelete(payment: Payment) {
    const patientName = patientMap.get(payment.patientId)?.fullName ?? 'מטופל לא נמצא'
    if (confirm(`האם למחוק תשלום של ${patientName} בסך ₪${payment.amount}?`)) {
      deleteMutation.mutate(payment.id, {
        onSuccess: () => toast.success('התשלום נמחק'),
        onError: () => toast.error('שגיאה במחיקת התשלום'),
      })
    }
  }

  if (paymentsLoading || patientsLoading || sessionsLoading) return <LoadingSpinner />

  const activePatients = patients.filter(p => p.status === 'active')

  return (
    <div className="space-y-6">
      {/* Overdue Debts Section (Red) */}
      {overdueDebts.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4 text-red-900">חובות</h3>
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
                <button
                  onClick={() => {
                    if (debt.type === 'session') {
                      navigate(
                        `/payments/new?patientId=${debt.patientId}&sessionId=${debt.sessionId}&amount=${debt.amount}`,
                      )
                    } else {
                      const period = `${debt.year}-${String((debt.month ?? 0) + 1).padStart(2, '0')}`
                      navigate(`/payments/new?patientId=${debt.patientId}&amount=${debt.amount}&paymentType=monthly&billingPeriod=${period}`)
                    }
                  }}
                  className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  צור תשלום
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Monthly Section (Yellow) */}
      {pendingMonthly.length > 0 && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4 text-yellow-900">ממתינים חודשיים</h3>
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
                <button
                  onClick={() => {
                    const period = `${debt.year}-${String((debt.month ?? 0) + 1).padStart(2, '0')}`
                    navigate(`/payments/new?patientId=${debt.patientId}&amount=${debt.amount}&paymentType=monthly&billingPeriod=${period}`)
                  }}
                  className="px-4 py-2 rounded-md bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition-colors whitespace-nowrap"
                >
                  צור תשלום
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="חיפוש לפי שם מטופל..."
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
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
        <select
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value as PaymentMethod | 'all')}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          {paymentMethodFilters.map(mf => (
            <option key={mf.value} value={mf.value}>
              {mf.label}
            </option>
          ))}
        </select>
        <Link
          to="/payments/new"
          className="flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          תשלום חדש
        </Link>
      </div>

      {/* Payments Table */}
      {sortedPayments.length === 0 ? (
        <EmptyState
          message={
            search || patientFilter !== 'all' || methodFilter !== 'all'
              ? 'לא נמצאו תוצאות'
              : 'אין תשלומים רשומים'
          }
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-start text-sm font-medium px-4 py-3">מטופל</th>
                <th className="text-start text-sm font-medium px-4 py-3">תאריך</th>
                <th className="text-start text-sm font-medium px-4 py-3">סכום</th>
                <th className="text-start text-sm font-medium px-4 py-3">אמצעי תשלום</th>
                <th className="text-start text-sm font-medium px-4 py-3">סוג</th>
                <th className="text-start text-sm font-medium px-4 py-3">הערות</th>
                <th className="text-start text-sm font-medium px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map(payment => (
                <tr
                  key={payment.id}
                  onClick={() => navigate(`/payments/${payment.id}/edit`)}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium">{payment.patientName}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">
                    {new Intl.DateTimeFormat('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(payment.date))}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">₪{payment.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</td>
                  <td className="px-4 py-3 text-sm">{PAYMENT_TYPE_LABELS[payment.paymentType]}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{payment.notes || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/payments/${payment.id}/edit`)
                        }}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="עריכה"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDelete(payment)
                        }}
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
