/**
 * Consistent color coding for payment/debt status across the app.
 *
 * GREEN  (#16a34a) - Paid (שולם)
 * YELLOW (#facc15) - Monthly patient, current month, pending (ממתין)
 * RED    (#dc2626) - Debt, overdue (חוב)
 */

// Tailwind class mappings for payment status
export const PAYMENT_STATUS_COLORS = {
  paid: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    badge: 'bg-green-500 text-white',
    hex: '#16a34a',
  },
  pending: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    badge: 'bg-yellow-500 text-white',
    hex: '#facc15',
  },
  debt: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-700',
    badge: 'bg-red-500 text-white',
    hex: '#dc2626',
  },
} as const

// Hebrew labels
export const PAYMENT_STATUS_LABELS = {
  paid: 'שולם',
  pending: 'ממתין',
  debt: 'חוב',
} as const

export type PaymentStatusType = keyof typeof PAYMENT_STATUS_COLORS
