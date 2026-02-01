import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import LoginPage from '@/pages/login/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import PatientsPage from '@/pages/patients/PatientsPage'
import PatientProfilePage from '@/pages/patients/PatientProfilePage'
import PatientFormPage from '@/pages/patients/PatientFormPage'
import SessionsPage from '@/pages/sessions/SessionsPage'
import SessionFormPage from '@/pages/sessions/SessionFormPage'
import PaymentsPage from '@/pages/payments/PaymentsPage'
import ExpensesPage from '@/pages/expenses/ExpensesPage'
import TasksPage from '@/pages/tasks/TasksPage'
import ReportsPage from '@/pages/reports/ReportsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      {
        path: 'patients',
        children: [
          { index: true, element: <PatientsPage /> },
          { path: 'new', element: <PatientFormPage /> },
          { path: ':id', element: <PatientProfilePage /> },
          { path: ':id/edit', element: <PatientFormPage /> },
        ],
      },
      { path: 'sessions', element: <SessionsPage /> },
      { path: 'sessions/new', element: <SessionFormPage /> },
      { path: 'sessions/:id', element: <SessionFormPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
])
