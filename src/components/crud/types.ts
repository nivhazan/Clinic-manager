import type { ReactNode } from 'react'

// ============================================
// Column Configuration
// ============================================

export type ColumnType = 'text' | 'number' | 'date' | 'currency' | 'badge' | 'boolean' | 'custom'

export interface BadgeVariantMap {
  [key: string]: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

export interface ColumnConfig<T> {
  key: keyof T | string
  header: string
  type?: ColumnType
  // For badge columns
  badgeVariants?: BadgeVariantMap
  badgeLabels?: Record<string, string>
  // For boolean columns
  trueLabel?: string
  falseLabel?: string
  // For custom columns
  render?: (row: T) => ReactNode
  // Width and alignment
  width?: string
  align?: 'start' | 'center' | 'end'
  // Sorting
  sortable?: boolean
  // Hidden on mobile
  hiddenOnMobile?: boolean
}

// ============================================
// Field Configuration (for forms)
// ============================================

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'currency'
  | 'phone'
  | 'email'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  hint?: string
  // For select fields
  options?: SelectOption[]
  // For number/currency fields
  min?: number
  max?: number
  step?: number
  // For textarea
  rows?: number
  // Conditional display
  showWhen?: (values: Record<string, unknown>) => boolean
  // Default value
  defaultValue?: unknown
  // Grid span (1-2 for 2-column layout)
  colSpan?: 1 | 2
  // Direction for phone/number fields
  dir?: 'ltr' | 'rtl'
}

// ============================================
// Filter Configuration
// ============================================

export type FilterType = 'search' | 'select' | 'date' | 'dateRange'

export interface FilterConfig {
  key: string
  type: FilterType
  label?: string
  placeholder?: string
  // For select filters
  options?: SelectOption[]
  // For search - which fields to search
  searchFields?: string[]
}

// ============================================
// Action Configuration
// ============================================

export interface RowAction<T> {
  key: string
  label: string
  icon?: ReactNode
  onClick: (row: T) => void
  variant?: 'default' | 'danger'
  // Conditional display
  showWhen?: (row: T) => boolean
}

// ============================================
// Table Configuration
// ============================================

export interface CrudTableConfig<T> {
  // Columns
  columns: ColumnConfig<T>[]
  // Row key
  getRowKey: (row: T) => string
  // Row click handler
  onRowClick?: (row: T) => void
  // Row actions
  rowActions?: RowAction<T>[]
  // Empty state
  emptyMessage?: string
  emptyFilteredMessage?: string
  // Sorting
  defaultSortKey?: keyof T
  defaultSortDirection?: 'asc' | 'desc'
}

// ============================================
// Form Configuration
// ============================================

export interface CrudFormConfig {
  // Sections group fields visually
  sections: FormSection[]
  // Validation function
  validate?: (values: Record<string, unknown>) => Record<string, string>
}

export interface FormSection {
  title: string
  description?: string
  fields: FieldConfig[]
}

// ============================================
// CRUD Feature Configuration
// ============================================

export interface CrudConfig<T, TCreate, TUpdate> {
  // Feature name (for labels, routes)
  name: string
  namePlural: string
  // Hebrew labels
  labels: {
    singular: string
    plural: string
    newItem: string
    editItem: string
    deleteConfirmTitle: string
    deleteConfirmMessage: (item: T) => string
  }
  // Table config
  table: CrudTableConfig<T>
  // Form config
  form: CrudFormConfig
  // Filters
  filters?: FilterConfig[]
  // Routes
  routes: {
    list: string
    new: string
    edit: (id: string) => string
    view?: (id: string) => string
  }
  // Data transformation
  toFormData: (item: T) => Record<string, unknown>
  fromFormData: (data: Record<string, unknown>) => TCreate | TUpdate
  // Display helpers
  getItemName: (item: T) => string
}

// ============================================
// Hook Types (for generated hooks)
// ============================================

export interface CrudHooks<T, TCreate, TUpdate> {
  useList: () => {
    data: T[] | undefined
    isLoading: boolean
    error: Error | null
  }
  useItem: (id: string) => {
    data: T | undefined
    isLoading: boolean
    error: Error | null
  }
  useCreate: () => {
    mutate: (data: TCreate) => void
    mutateAsync: (data: TCreate) => Promise<T>
    isPending: boolean
    error: Error | null
  }
  useUpdate: () => {
    mutate: (params: { id: string; data: TUpdate }) => void
    mutateAsync: (params: { id: string; data: TUpdate }) => Promise<T>
    isPending: boolean
    error: Error | null
  }
  useDelete: () => {
    mutate: (id: string) => void
    mutateAsync: (id: string) => Promise<void>
    isPending: boolean
    error: Error | null
  }
}
