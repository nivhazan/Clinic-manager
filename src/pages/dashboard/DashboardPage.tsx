import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react'
import { usePatients } from '@/hooks/usePatients'
import { useAppointments } from '@/hooks/useAppointments'
import { useSessions } from '@/hooks/useSessions'
import { usePayments } from '@/hooks/usePayments'
import { computeDebts } from '@/lib/debts'
import { SkeletonStats, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout'
import { StatsCard } from './components/StatsCard'
import { OpenDebtsPreview } from './components/OpenDebtsPreview'
import { UpcomingAppointments } from './components/UpcomingAppointments'
import { RecentSessions } from './components/RecentSessions'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: patients = [], isLoading: patientsLoading } = usePatients()
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions()
  const { data: payments = [], isLoading: paymentsLoading } = usePayments()

  // Get today, start of week, start of month
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const startOfWeek = useMemo(() => {
    const date = new Date(today)
    date.setDate(date.getDate() - date.getDay())
    return date
  }, [today])

  const endOfWeek = useMemo(() => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + 6)
    date.setHours(23, 59, 59, 999)
    return date
  }, [startOfWeek])

  const startOfMonth = useMemo(() => {
    const date = new Date(today)
    date.setDate(1)
    return date
  }, [today])

  const endOfMonth = useMemo(() => {
    const date = new Date(today)
    date.setMonth(date.getMonth() + 1)
    date.setDate(0)
    date.setHours(23, 59, 59, 999)
    return date
  }, [today])

  // KPI 1: Open Debts - using shared computation for consistency with PaymentsPage
  // KPI shows only REAL debts (overdue), not pending monthly
  const debtResult = useMemo(() => {
    return computeDebts(patients, sessions, payments, today)
  }, [patients, sessions, payments, today])

  // For KPI card: show only real debts count (overdue), not pending monthly
  const realDebtsCount = debtResult.overdueDebts.length
  const realDebtsAmount = debtResult.totalOverdueAmount

  // KPI 2: Monthly Income
  const monthlyIncome = useMemo(() => {
    return payments
      .filter(p => {
        const paymentDate = new Date(p.date)
        return paymentDate >= startOfMonth && paymentDate <= endOfMonth
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }, [payments, startOfMonth, endOfMonth])

  // KPI 3: Sessions This Week
  const sessionsThisWeek = useMemo(() => {
    return sessions.filter(s => {
      const sessionDate = new Date(s.sessionDate)
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek
    })
  }, [sessions, startOfWeek, endOfWeek])

  // KPI 4: Appointments Today
  const todayString = useMemo(() => today.toISOString().split('T')[0], [today])

  const appointmentsToday = useMemo(() => {
    return appointments.filter(a => a.date === todayString)
  }, [appointments, todayString])

  const unpaidAppointmentsToday = useMemo(() => {
    return appointmentsToday.filter(a => !a.isPaid)
  }, [appointmentsToday])

  // Upcoming Appointments (today + future)
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date >= todayString && a.status !== 'canceled' && a.status !== 'completed')
      .sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date)
        return dateComp !== 0 ? dateComp : a.time.localeCompare(b.time)
      })
  }, [appointments, todayString])

  // Recent Sessions (last 5)
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
  }, [sessions])

  if (patientsLoading || appointmentsLoading || sessionsLoading || paymentsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="לוח בקרה" />
        <SkeletonStats cards={4} />
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonList items={5} />
          <SkeletonList items={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="לוח בקרה" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="חובות פתוחים"
          value={realDebtsCount}
          subtitle={`סה"כ ₪${realDebtsAmount.toLocaleString()}`}
          icon={DollarSign}
          onClick={() => navigate('/payments')}
        />
        <StatsCard
          title="הכנסות החודש"
          value={`₪${monthlyIncome.toLocaleString()}`}
          icon={TrendingUp}
          onClick={() => navigate('/payments')}
        />
        <StatsCard
          title="טיפולים השבוע"
          value={sessionsThisWeek.length}
          icon={Calendar}
          onClick={() => navigate('/sessions')}
        />
        <StatsCard
          title="תורים היום"
          value={appointmentsToday.length}
          subtitle={
            unpaidAppointmentsToday.length > 0
              ? `${unpaidAppointmentsToday.length} ללא תשלום`
              : undefined
          }
          icon={Clock}
          onClick={() => navigate('/calendar')}
        />
      </div>

      {/* Open Debts Preview */}
      <OpenDebtsPreview debts={debtResult.allDebts} />

      {/* Grid for Upcoming Appointments and Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingAppointments appointments={upcomingAppointments} patients={patients} />
        <RecentSessions sessions={recentSessions} patients={patients} />
      </div>
    </div>
  )
}
