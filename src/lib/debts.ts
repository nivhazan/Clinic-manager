import type { Patient, TherapySession, Payment } from '@/types'

export interface DebtItem {
  type: 'session' | 'monthly'
  patientId: string
  patientName: string
  sessionId?: string
  sessionNumber?: number
  sessionDate?: string
  month?: number
  year?: number
  amount: number
  isOverdue: boolean
}

export interface DebtResult {
  overdueDebts: DebtItem[]
  pendingMonthly: DebtItem[]
  allDebts: DebtItem[]
  totalOverdueAmount: number
  totalPendingAmount: number
}

/**
 * Compute debts using consistent rules across Dashboard and Payments page.
 * Rules:
 * - per_session: overdue only if sessionDate < today AND isPaid=false
 * - monthly: current month unpaid => pending (yellow), past months unpaid => overdue (red)
 * - only active patients; monthlyPrice > 0 for monthly
 */
export function computeDebts(
  patients: Patient[],
  sessions: TherapySession[],
  payments: Payment[],
  today: Date = new Date(),
): DebtResult {
  const items: DebtItem[] = []

  const todayNormalized = new Date(today)
  todayNormalized.setHours(0, 0, 0, 0)

  const currentMonth = todayNormalized.getMonth()
  const currentYear = todayNormalized.getFullYear()

  const patientMap = new Map(patients.map(p => [p.id, p]))

  // Session debts (per-session patients with overdue unpaid sessions)
  sessions.forEach(session => {
    if (session.isPaid) return

    const sessionDate = new Date(session.sessionDate)
    if (sessionDate >= todayNormalized) return // Future unpaid sessions are not debt

    const patient = patientMap.get(session.patientId)
    if (!patient || patient.status !== 'active') return
    if (patient.paymentFrequency !== 'per_session') return

    items.push({
      type: 'session',
      patientId: patient.id,
      patientName: patient.fullName,
      sessionId: session.id,
      sessionNumber: session.sessionNumber,
      sessionDate: session.sessionDate,
      amount: patient.sessionPrice,
      isOverdue: true,
    })
  })

  // Monthly debts and pending
  patients.forEach(patient => {
    if (patient.status !== 'active') return
    if (patient.paymentFrequency !== 'monthly') return
    if (!patient.monthlyPrice || patient.monthlyPrice <= 0) return

    // Helper: check if a monthly payment covers a specific period
    const hasMonthlyPayment = (targetPeriod: string, targetMonth: number, targetYear: number) =>
      payments.some(
        p =>
          p.patientId === patient.id &&
          p.paymentType === 'monthly' &&
          // Prefer explicit billingPeriod; fall back to date-based check for old records
          (p.billingPeriod
            ? p.billingPeriod === targetPeriod
            : new Date(p.date).getMonth() === targetMonth &&
              new Date(p.date).getFullYear() === targetYear),
      )

    // Check if current month payment exists
    const currentPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`

    if (!hasMonthlyPayment(currentPeriod, currentMonth, currentYear)) {
      // Current month not paid = pending (yellow)
      items.push({
        type: 'monthly',
        patientId: patient.id,
        patientName: patient.fullName,
        month: currentMonth,
        year: currentYear,
        amount: patient.monthlyPrice,
        isOverdue: false,
      })
    }

    // Check previous months (only current year for simplicity)
    for (let month = 0; month < currentMonth; month++) {
      const period = `${currentYear}-${String(month + 1).padStart(2, '0')}`

      if (!hasMonthlyPayment(period, month, currentYear)) {
        // Past month not paid = debt (red)
        items.push({
          type: 'monthly',
          patientId: patient.id,
          patientName: patient.fullName,
          month,
          year: currentYear,
          amount: patient.monthlyPrice,
          isOverdue: true,
        })
      }
    }
  })

  const overdueDebts = items.filter(d => d.isOverdue)
  const pendingMonthly = items.filter(d => !d.isOverdue)

  return {
    overdueDebts,
    pendingMonthly,
    allDebts: items,
    totalOverdueAmount: overdueDebts.reduce((sum, d) => sum + d.amount, 0),
    totalPendingAmount: pendingMonthly.reduce((sum, d) => sum + d.amount, 0),
  }
}
