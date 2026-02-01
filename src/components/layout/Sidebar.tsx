import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  CreditCard,
  Receipt,
  ListTodo,
  BarChart3,
} from 'lucide-react'
import { NAV_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: NAV_LABELS.dashboard, icon: LayoutDashboard },
  { to: '/calendar', label: NAV_LABELS.calendar, icon: Calendar },
  { to: '/patients', label: NAV_LABELS.patients, icon: Users },
  { to: '/sessions', label: NAV_LABELS.sessions, icon: ClipboardList },
  { to: '/payments', label: NAV_LABELS.payments, icon: CreditCard },
  { to: '/expenses', label: NAV_LABELS.expenses, icon: Receipt },
  { to: '/tasks', label: NAV_LABELS.tasks, icon: ListTodo },
  { to: '/reports', label: NAV_LABELS.reports, icon: BarChart3 },
]

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-e border-border bg-sidebar min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
