import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

// ============================================
// Toast Provider (place in app root)
// ============================================

export function ToastProvider() {
  return (
    <SonnerToaster
      position="bottom-left"
      dir="rtl"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'bg-background border border-border shadow-modal rounded-lg p-4 flex items-start gap-3',
          title: 'text-sm font-medium',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground text-xs px-2 py-1 rounded',
          cancelButton: 'bg-muted text-foreground text-xs px-2 py-1 rounded',
        },
      }}
    />
  )
}

// ============================================
// Toast Functions
// ============================================

export interface ToastOptions {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

export const toast = {
  success: ({ title, description, action, duration }: ToastOptions) => {
    return sonnerToast.success(title, {
      description,
      duration,
      icon: <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    })
  },

  error: ({ title, description, action, duration }: ToastOptions) => {
    return sonnerToast.error(title, {
      description,
      duration: duration || 5000, // errors stay longer
      icon: <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    })
  },

  warning: ({ title, description, action, duration }: ToastOptions) => {
    return sonnerToast.warning(title, {
      description,
      duration,
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    })
  },

  info: ({ title, description, action, duration }: ToastOptions) => {
    return sonnerToast.info(title, {
      description,
      duration,
      icon: <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    })
  },

  // Loading toast (returns id to dismiss later)
  loading: (title: string) => {
    return sonnerToast.loading(title, {
      duration: Infinity,
    })
  },

  // Dismiss a specific toast
  dismiss: (id: string | number) => {
    sonnerToast.dismiss(id)
  },

  // Promise-based toast
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  },
}

// ============================================
// Usage Examples (for documentation)
// ============================================

/*
// Basic usage:
toast.success({ title: 'השינויים נשמרו בהצלחה' })
toast.error({ title: 'שגיאה', description: 'לא ניתן לשמור את הנתונים' })
toast.warning({ title: 'אזהרה', description: 'המטופל לא אישר SMS' })
toast.info({ title: 'מידע', description: 'יש 3 תורים להיום' })

// With action:
toast.success({
  title: 'התשלום נרשם',
  action: {
    label: 'בטל',
    onClick: () => undoPayment(),
  },
})

// Loading + dismiss:
const id = toast.loading('שומר נתונים...')
await saveData()
toast.dismiss(id)
toast.success({ title: 'נשמר!' })

// Promise-based:
toast.promise(savePatient(data), {
  loading: 'שומר מטופל...',
  success: 'המטופל נשמר בהצלחה',
  error: 'שגיאה בשמירת המטופל',
})
*/
