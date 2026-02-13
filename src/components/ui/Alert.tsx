import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
}

const variantStyles = {
  default: 'bg-muted border-border text-foreground',
  success: 'bg-green-50 border-green-300 text-green-800',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  danger: 'bg-red-50 border-red-300 text-red-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
}

const variantIcons = {
  default: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
}

export function Alert({
  variant = 'default',
  title,
  dismissible,
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  const Icon = variantIcons[variant]

  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 p-4 rounded-lg border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>

      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="סגור"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Inline alert (smaller, no icon)
export interface InlineAlertProps {
  variant?: 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
  className?: string
}

const inlineStyles = {
  success: 'text-green-700 bg-green-50',
  warning: 'text-yellow-700 bg-yellow-50',
  danger: 'text-red-700 bg-red-50',
  info: 'text-blue-700 bg-blue-50',
}

export function InlineAlert({ variant = 'info', children, className }: InlineAlertProps) {
  return (
    <div className={cn('text-sm px-3 py-2 rounded-md', inlineStyles[variant], className)}>
      {children}
    </div>
  )
}
