import type {
  PatientStatus,
  PaymentFrequency,
  AppointmentStatus,
  SessionType,
  ProgressLevel,
  CooperationLevel,
  PaymentMethod,
  PaymentType,
  ScheduleFrequency,
  ScheduleStatus,
  InvoiceStatus,
  TaskStatus,
  TaskPriority,
  ExpenseCategory,
} from '@/types'

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  treatment_completed: 'טיפול הושלם',
}

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  per_session: 'לפי טיפול',
  monthly: 'חודשי',
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'מתוכנן',
  confirmed: 'מאושר',
  completed: 'הושלם',
  canceled: 'בוטל',
  no_show: 'לא הגיע',
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  initial_assessment: 'הערכה ראשונית',
  ongoing_therapy: 'טיפול שוטף',
  follow_up: 'מעקב',
  consultation: 'ייעוץ',
}

export const PROGRESS_LEVEL_LABELS: Record<ProgressLevel, string> = {
  significant: 'משמעותי',
  good: 'טוב',
  moderate: 'בינוני',
  minimal: 'מינימלי',
  no_change: 'ללא שינוי',
}

export const COOPERATION_LEVEL_LABELS: Record<CooperationLevel, string> = {
  excellent: 'מצוין',
  good: 'טוב',
  fair: 'סביר',
  limited: 'מוגבל',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'מזומן',
  bank_transfer: 'העברה בנקאית',
  credit_card: 'כרטיס אשראי',
  check: "צ'ק",
  bit: 'ביט',
  paybox: 'פייבוקס',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  session: 'תשלום לטיפול',
  monthly: 'תשלום חודשי',
}

export const SCHEDULE_FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  weekly: 'שבועי',
  bi_weekly: 'דו-שבועי',
  monthly: 'חודשי',
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  active: 'פעיל',
  paused: 'מושהה',
  completed: 'הושלם',
  canceled: 'בוטל',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: 'שולם',
  pending: 'ממתין',
  partially_paid: 'שולם חלקית',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'לביצוע',
  in_progress: 'בתהליך',
  completed: 'הושלם',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  clinical_equipment: 'ציוד קליני',
  office_supplies: 'ציוד משרדי',
  rent: 'שכירות',
  utilities: 'חשמל ומים',
  internet_phone: 'אינטרנט וטלפון',
  marketing: 'שיווק ופרסום',
  training: 'הכשרות וקורסים',
  insurance: 'ביטוח',
  maintenance: 'תחזוקה ותיקונים',
  other: 'אחר',
}

export const DAY_LABELS: Record<string, string> = {
  '0': 'ראשון',
  '1': 'שני',
  '2': 'שלישי',
  '3': 'רביעי',
  '4': 'חמישי',
  '5': 'שישי',
  '6': 'שבת',
}

export const NAV_LABELS = {
  dashboard: 'לוח בקרה',
  calendar: 'יומן',
  patients: 'מטופלים',
  sessions: 'טיפולים',
  payments: 'תשלומים',
  expenses: 'הוצאות',
  tasks: 'משימות',
  reports: 'דוחות',
} as const

export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'לוח בקרה',
  calendar: 'יומן',
  patients: 'מטופלים',
  sessions: 'טיפולים',
  payments: 'תשלומים',
  expenses: 'הוצאות',
  tasks: 'משימות',
  reports: 'דוחות',
  new: 'חדש',
  edit: 'עריכה',
}
