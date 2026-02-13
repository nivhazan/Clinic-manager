import { useNavigate } from 'react-router-dom'
import type { DebtItem } from '@/lib/debts'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { EmptyState } from '@/components/shared/EmptyState'

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

interface OpenDebtsPreviewProps {
  debts: DebtItem[]
}

export function OpenDebtsPreview({ debts }: OpenDebtsPreviewProps) {
  const navigate = useNavigate()

  const overdueDebts = debts.filter(d => d.isOverdue)
  const pendingDebts = debts.filter(d => !d.isOverdue)

  if (debts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-700">חובות פתוחים</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="אין חובות פתוחים" />
        </CardContent>
      </Card>
    )
  }

  function handleCreatePayment(debt: DebtItem) {
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
  }

  function DebtRow({ debt, variant }: { debt: DebtItem; variant: 'danger' | 'warning' }) {
    const borderClass = variant === 'danger' ? 'border-red-300' : 'border-yellow-300'
    const bgHoverClass = variant === 'danger' ? 'hover:bg-red-50' : 'hover:bg-yellow-50'

    return (
      <div
        className={`flex items-center gap-4 p-3 bg-white border ${borderClass} rounded-md ${bgHoverClass} transition-colors`}
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
          variant={variant}
          size="sm"
          onClick={() => handleCreatePayment(debt)}
        >
          צור תשלום
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overdue debts (RED) */}
      {overdueDebts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">חובות ({overdueDebts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueDebts.slice(0, 3).map((debt, idx) => (
                <DebtRow
                  key={`overdue-${debt.patientId}-${debt.sessionId || debt.month}-${idx}`}
                  debt={debt}
                  variant="danger"
                />
              ))}
            </div>
            {overdueDebts.length > 3 && (
              <button
                onClick={() => navigate('/payments')}
                className="mt-3 text-sm text-red-700 hover:underline"
              >
                ועוד {overdueDebts.length - 3} חובות נוספים
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending monthly (YELLOW) */}
      {pendingDebts.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700">ממתינים ({pendingDebts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingDebts.slice(0, 2).map((debt, idx) => (
                <DebtRow
                  key={`pending-${debt.patientId}-${debt.month}-${idx}`}
                  debt={debt}
                  variant="warning"
                />
              ))}
            </div>
            {pendingDebts.length > 2 && (
              <button
                onClick={() => navigate('/payments')}
                className="mt-3 text-sm text-yellow-700 hover:underline"
              >
                ועוד {pendingDebts.length - 2} ממתינים נוספים
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
