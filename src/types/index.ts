// ========== Enums / Union Types ==========

export type PatientStatus = 'active' | 'inactive' | 'treatment_completed'
export type PaymentFrequency = 'per_session' | 'monthly'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no_show'
export type SessionType = 'initial_assessment' | 'ongoing_therapy' | 'follow_up' | 'consultation'

export type ProgressLevel = 'significant' | 'good' | 'moderate' | 'minimal' | 'no_change'
export type CooperationLevel = 'excellent' | 'good' | 'fair' | 'limited'

export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'bit' | 'paybox'
export type PaymentType = 'session' | 'monthly'

export type ScheduleFrequency = 'weekly' | 'bi_weekly' | 'monthly'
export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'canceled'

export type InvoiceStatus = 'paid' | 'pending' | 'partially_paid'

export type TaskStatus = 'todo' | 'in_progress' | 'completed'
export type TaskPriority = 'high' | 'medium' | 'low'

export type ExpenseCategory =
  | 'clinical_equipment'
  | 'office_supplies'
  | 'rent'
  | 'utilities'
  | 'internet_phone'
  | 'marketing'
  | 'training'
  | 'insurance'
  | 'maintenance'
  | 'other'

// ========== Entities ==========

export interface Patient {
  id: string
  fullName: string
  idNumber: string
  dateOfBirth: string
  phone: string
  parentPhone?: string
  email?: string
  address?: string
  initialDiagnosis?: string
  medicalBackground?: string
  referralSource?: string
  emergencyContact?: string
  emergencyPhone?: string
  status: PatientStatus
  recurringDay?: number
  recurringTime?: string
  paymentFrequency: PaymentFrequency
  sessionPrice: number
  monthlyPrice?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  patientId: string
  date: string
  time: string
  duration: number
  sessionType: SessionType
  status: AppointmentStatus
  isPaid: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TherapySession {
  id: string
  patientId: string
  sessionDate: string
  sessionNumber: number
  appointmentId?: string
  goals: string
  activitiesPerformed: string
  progressLevel: ProgressLevel
  cooperationLevel: CooperationLevel
  summary: string
  homeAssignments?: string
  nextSessionPlan?: string
  recommendations?: string
  isPaid: boolean
  paymentId?: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  patientId: string
  sessionId?: string
  appointmentId?: string
  date: string
  amount: number
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  billingPeriod?: string // "YYYY-MM" for monthly payments
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PaymentSchedule {
  id: string
  patientId: string
  amount: number
  frequency: ScheduleFrequency
  startDate: string
  endDate?: string
  nextPaymentDate: string
  paymentMethod: PaymentMethod
  status: ScheduleStatus
  autoInvoice: boolean
  createdAt: string
  updatedAt: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  patientId: string
  appointmentIds?: string[]
  issueDate: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  paymentMethod?: PaymentMethod
  status: InvoiceStatus
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  date: string
  amount: number
  category: ExpenseCategory
  vendor: string
  description?: string
  paymentMethod: PaymentMethod
  notes?: string
  taxDeductible: boolean
  receiptUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  patientId?: string
  dueDate: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
}

// ========== Documents ==========

export type DocumentOwnerType = 'payment' | 'expense' | 'patient' | 'session' | 'other'
export type DocumentFileType = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'webp'
export type OcrStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface ExtractedFields {
  amount?: number
  date?: string
  vendor?: string
  docNumber?: string
  confidence?: {
    amount?: number
    date?: number
    vendor?: number
    docNumber?: number
  }
}

export interface Document {
  id: string
  ownerType: DocumentOwnerType
  ownerId?: string
  fileData: string // Base64 encoded file data
  fileType: DocumentFileType
  originalFileName: string
  fileSizeBytes: number
  uploadedAt: string
  ocrStatus: OcrStatus
  ocrText?: string
  extractedFields?: ExtractedFields
  ocrError?: string
  createdAt: string
  updatedAt: string
}
