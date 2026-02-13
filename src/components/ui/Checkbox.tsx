import { forwardRef } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// Checkbox
// ============================================

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean
  label?: string
  description?: string
  error?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded border-2 transition-colors cursor-pointer',
              'flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              props.checked || indeterminate
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-border bg-background',
              error && 'border-red-500',
              className
            )}
            onClick={() => {
              const input = document.getElementById(checkboxId) as HTMLInputElement
              if (input && !props.disabled) {
                input.click()
              }
            }}
          >
            {indeterminate ? (
              <Minus className="h-3 w-3" />
            ) : props.checked ? (
              <Check className="h-3 w-3" />
            ) : null}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  props.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

// ============================================
// Checkbox Group
// ============================================

export interface CheckboxGroupProps {
  label?: string
  error?: string
  children: React.ReactNode
  className?: string
  horizontal?: boolean
}

export function CheckboxGroup({
  label,
  error,
  children,
  className,
  horizontal,
}: CheckboxGroupProps) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-sm font-medium mb-2">{label}</legend>
      )}
      <div className={cn('space-y-2', horizontal && 'flex flex-wrap gap-4 space-y-0')}>
        {children}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </fieldset>
  )
}
