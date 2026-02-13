import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import LoginPage from '@/pages/login/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import AppointmentFormPage from '@/pages/calendar/AppointmentFormPage'
import PatientsPage from '@/pages/patients/PatientsPage'
import PatientProfilePage from '@/pages/patients/PatientProfilePage'
import PatientFormPage from '@/pages/patients/PatientFormPage'
import SessionsPage from '@/pages/sessions/SessionsPage'
import SessionFormPage from '@/pages/sessions/SessionFormPage'
import PaymentsPage from '@/pages/payments/PaymentsPage'
import PaymentFormPage from '@/pages/payments/PaymentFormPage'
import ExpensesPage from '@/pages/expenses/ExpensesPage'
import ExpenseFormPage from '@/pages/expenses/ExpenseFormPage'
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
      {
        path: 'calendar',
        children: [
          { index: true, element: <CalendarPage /> },
          { path: 'new', element: <AppointmentFormPage /> },
          { path: ':id/edit', element: <AppointmentFormPage /> },
        ],
      },
      {
        path: 'patients',
        children: [
          { index: true, element: <PatientsPage /> },
          { path: 'new', element: <PatientFormPage /> },
          { path: ':id', element: <PatientProfilePage /> },
          { path: ':id/edit', element: <PatientFormPage /> },
        ],
      },
      {
        path: 'sessions',
        children: [
          { index: true, element: <SessionsPage /> },
          { path: 'new', element: <SessionFormPage /> },
          { path: ':id', element: <SessionFormPage /> },
        ],
      },
      {
        path: 'payments',
        children: [
          { index: true, element: <PaymentsPage /> },
          { path: 'new', element: <PaymentFormPage /> },
          { path: ':id/edit', element: <PaymentFormPage /> },
        ],
      },
      {
        path: 'expenses',
        children: [
          { index: true, element: <ExpensesPage /> },
          { path: 'new', element: <ExpenseFormPage /> },
          { path: ':id/edit', element: <ExpenseFormPage /> },
        ],
      },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
])
