import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </label>

      {children}

      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

// Horizontal form field layout
export interface FormFieldHorizontalProps extends FormFieldProps {
  labelWidth?: string
}

export function FormFieldHorizontal({
  label,
  htmlFor,
  required,
  error,
  hint,
  labelWidth = 'w-32',
  className,
  children,
}: FormFieldHorizontalProps) {
  return (
    <div className={cn('flex items-start gap-4', className)}>
      <label
        htmlFor={htmlFor}
        className={cn('pt-2.5 text-sm font-medium text-foreground flex-shrink-0', labelWidth)}
      >
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </label>

      <div className="flex-1 space-y-1.5">
        {children}

        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}
