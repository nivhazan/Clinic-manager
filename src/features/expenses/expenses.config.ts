import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'
import type { CrudConfig } from '@/components/crud'
import type { CreateExpenseData, UpdateExpenseData } from '@/services/expenses'

// ============================================
// Category Labels & Options
// ============================================

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  clinical_equipment: 'ציוד קליני',
  office_supplies: 'ציוד משרדי',
  rent: 'שכירות',
  utilities: 'חשבונות',
  internet_phone: 'אינטרנט וטלפון',
  marketing: 'שיווק',
  training: 'הכשרות',
  insurance: 'ביטוח',
  maintenance: 'תחזוקה',
  other: 'אחר',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'מזומן',
  bank_transfer: 'העברה בנקאית',
  credit_card: 'כרטיס אשראי',
  check: "צ'ק",
  bit: 'ביט',
  paybox: 'פייבוקס',
}

const categoryOptions = Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const categoryFilterOptions = [
  { value: 'all', label: 'כל הקטגוריות' },
  ...categoryOptions,
]

// ============================================
// Expense CRUD Configuration
// ============================================

export const expensesConfig: CrudConfig<Expense, CreateExpenseData, UpdateExpenseData> = {
  name: 'expense',
  namePlural: 'expenses',

  labels: {
    singular: 'הוצאה',
    plural: 'הוצאות',
    newItem: 'הוצאה חדשה',
    editItem: 'עריכת הוצאה',
    deleteConfirmTitle: 'מחיקת הוצאה',
    deleteConfirmMessage: (expense) =>
      `האם למחוק את ההוצאה "${expense.vendor}" בסך ₪${expense.amount}?`,
  },

  routes: {
    list: '/expenses',
    new: '/expenses/new',
    edit: (id) => `/expenses/${id}/edit`,
  },

  // ============================================
  // Table Configuration
  // ============================================
  table: {
    columns: [
      {
        key: 'date',
        header: 'תאריך',
        type: 'date',
        sortable: true,
      },
      {
        key: 'vendor',
        header: 'ספק',
        type: 'text',
      },
      {
        key: 'category',
        header: 'קטגוריה',
        type: 'badge',
        badgeLabels: EXPENSE_CATEGORY_LABELS,
        badgeVariants: {
          clinical_equipment: 'info',
          office_supplies: 'neutral',
          rent: 'warning',
          utilities: 'warning',
          internet_phone: 'neutral',
          marketing: 'success',
          training: 'info',
          insurance: 'danger',
          maintenance: 'neutral',
          other: 'neutral',
        },
      },
      {
        key: 'amount',
        header: 'סכום',
        type: 'currency',
        sortable: true,
      },
      {
        key: 'paymentMethod',
        header: 'אמצעי תשלום',
        type: 'badge',
        badgeLabels: PAYMENT_METHOD_LABELS,
        badgeVariants: {
          cash: 'success',
          bank_transfer: 'info',
          credit_card: 'info',
          check: 'warning',
          bit: 'success',
          paybox: 'success',
        },
        hiddenOnMobile: true,
      },
      {
        key: 'taxDeductible',
        header: 'ניכוי מס',
        type: 'boolean',
        trueLabel: '✓ כן',
        falseLabel: 'לא',
        hiddenOnMobile: true,
      },
    ],
    getRowKey: (expense) => expense.id,
    defaultSortKey: 'date',
    defaultSortDirection: 'desc',
    emptyMessage: 'אין הוצאות רשומות',
    emptyFilteredMessage: 'לא נמצאו תוצאות',
  },

  // ============================================
  // Filters Configuration
  // ============================================
  filters: [
    {
      key: 'search',
      type: 'search',
      placeholder: 'חיפוש לפי ספק או תיאור...',
      searchFields: ['vendor', 'description'],
    },
    {
      key: 'category',
      type: 'select',
      options: categoryFilterOptions,
    },
  ],

  // ============================================
  // Form Configuration
  // ============================================
  form: {
    sections: [
      {
        title: 'פרטי הוצאה',
        fields: [
          {
            name: 'date',
            label: 'תאריך',
            type: 'date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0],
          },
          {
            name: 'vendor',
            label: 'ספק',
            type: 'text',
            required: true,
            placeholder: 'שם הספק או בית העסק',
          },
          {
            name: 'category',
            label: 'קטגוריה',
            type: 'select',
            required: true,
            options: [{ value: '', label: 'בחר קטגוריה' }, ...categoryOptions],
          },
          {
            name: 'amount',
            label: 'סכום (₪)',
            type: 'currency',
            required: true,
            min: 0,
          },
          {
            name: 'paymentMethod',
            label: 'אמצעי תשלום',
            type: 'select',
            required: true,
            options: paymentMethodOptions,
            defaultValue: 'cash',
          },
          {
            name: 'taxDeductible',
            label: 'מוכר לניכוי מס',
            type: 'checkbox',
            defaultValue: true,
          },
        ],
      },
      {
        title: 'פרטים נוספים',
        fields: [
          {
            name: 'description',
            label: 'תיאור',
            type: 'textarea',
            placeholder: 'תיאור ההוצאה...',
            colSpan: 2,
          },
          {
            name: 'notes',
            label: 'הערות',
            type: 'textarea',
            placeholder: 'הערות נוספות...',
            colSpan: 2,
          },
        ],
      },
    ],
    validate: (values) => {
      const errors: Record<string, string> = {}
      if (values.amount && Number(values.amount) <= 0) {
        errors.amount = 'יש להזין סכום חיובי'
      }
      return errors
    },
  },

  // ============================================
  // Data Transformation
  // ============================================
  toFormData: (expense) => ({
    date: expense.date,
    vendor: expense.vendor,
    category: expense.category,
    amount: expense.amount,
    paymentMethod: expense.paymentMethod,
    taxDeductible: expense.taxDeductible,
    description: expense.description ?? '',
    notes: expense.notes ?? '',
  }),

  fromFormData: (data) => ({
    date: String(data.date),
    vendor: String(data.vendor).trim(),
    category: data.category as ExpenseCategory,
    amount: Number(data.amount),
    paymentMethod: data.paymentMethod as PaymentMethod,
    taxDeductible: Boolean(data.taxDeductible),
    description: String(data.description || '').trim() || undefined,
    notes: String(data.notes || '').trim() || undefined,
    receiptUrl: undefined,
  }),

  getItemName: (expense) => expense.vendor,
}
