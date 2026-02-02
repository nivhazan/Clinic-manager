import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePayments, useDeletePayment } from '@/hooks/usePayments'
import { usePatients } from '@/hooks/usePatients'
import { useSessions } from '@/hooks/useSessions'
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/constants'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import type { PaymentMethod, Payment } from '@/types'

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

  // Build patient map for lookups
  const patientMap = useMemo(() => {
    return new Map(patients.map(p => [p.id, p]))
  }, [patients])

  // Get unpaid sessions (debts)
  const unpaidSessions = useMemo(() => {
    return sessions.filter(s => !s.isPaid)
  }, [sessions])

  // Build enriched payments with patient names for search
  const enrichedPayments = useMemo(() => {
    return payments.map(p => ({
      ...p,
      patientName: patientMap.get(p.patientId)?.fullName ?? 'לא ידוע',
    }))
  }, [payments, patientMap])

  const filtered = enrichedPayments.filter(p => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term ||
      p.patientName.toLowerCase().includes(term) ||
      (p.notes?.toLowerCase().includes(term) ?? false)
    const matchesPatient = patientFilter === 'all' || p.patientId === patientFilter
    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter
    return matchesSearch && matchesPatient && matchesMethod
  })

  const sortedPayments = [...filtered].sort((a, b) => b.date.localeCompare(a.date))

  function getPatientName(patientId: string): string {
    return patientMap.get(patientId)?.fullName ?? 'לא ידוע'
  }

  function handleDelete(e: React.MouseEvent, payment: Payment) {
    e.stopPropagation()
    const patientName = getPatientName(payment.patientId)
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
      {/* Open Debts Section */}
      {unpaidSessions.length > 0 && (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4 text-orange-900">חובות פתוחים</h3>
          <div className="space-y-2">
            {unpaidSessions.map(session => {
              const patient = patientMap.get(session.patientId)
              if (!patient) return null
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-3 bg-white border border-orange-200 rounded-md hover:bg-orange-50/50 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-3 text-sm">
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
                      <div className="text-xs text-muted-foreground mb-1">סיכום</div>
                      <div className="truncate max-w-xs">{session.summary}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">סכום מוצע</div>
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
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 flex-1">
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
        </div>
        <Link
          to="/payments/new"
          className="flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          תשלום חדש
        </Link>
      </div>

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
                  <td className="px-4 py-3 text-sm font-medium">{getPatientName(payment.patientId)}</td>
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
                        onClick={e => handleDelete(e, payment)}
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
