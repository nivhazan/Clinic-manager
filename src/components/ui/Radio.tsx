import { forwardRef, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// Radio Context
// ============================================

interface RadioGroupContextValue {
  name: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

function useRadioGroupContext() {
  return useContext(RadioGroupContext)
}

// ============================================
// Radio
// ============================================

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: boolean
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, value, ...props }, ref) => {
    const group = useRadioGroupContext()
    const radioId = props.id || `radio-${Math.random().toString(36).slice(2, 9)}`

    const isChecked = group ? group.value === value : props.checked
    const isDisabled = group?.disabled || props.disabled
    const name = group?.name || props.name

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (group) {
        group.onChange(value as string)
      }
      props.onChange?.(e)
    }

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={name}
            value={value}
            checked={isChecked}
            disabled={isDisabled}
            onChange={handleChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded-full border-2 transition-colors cursor-pointer',
              'flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              isChecked ? 'border-primary' : 'border-border',
              error && 'border-red-500',
              className
            )}
            onClick={() => {
              const input = document.getElementById(radioId) as HTMLInputElement
              if (input && !isDisabled) {
                input.click()
              }
            }}
          >
            {isChecked && (
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  isDisabled && 'opacity-50 cursor-not-allowed'
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
Radio.displayName = 'Radio'

// ============================================
// Radio Group
// ============================================

export interface RadioGroupProps {
  name: string
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  children: React.ReactNode
  className?: string
  horizontal?: boolean
  disabled?: boolean
}

export function RadioGroup({
  name,
  value,
  onChange,
  label,
  error,
  children,
  className,
  horizontal,
  disabled,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
      <fieldset className={className}>
        {label && (
          <legend className="text-sm font-medium mb-2">{label}</legend>
        )}
        <div
          role="radiogroup"
          className={cn('space-y-2', horizontal && 'flex flex-wrap gap-4 space-y-0')}
        >
          {children}
        </div>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </fieldset>
    </RadioGroupContext.Provider>
  )
}

// ============================================
// Radio Card (visual option selector)
// ============================================

export interface RadioCardProps {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

export function RadioCard({ value, label, description, icon, disabled }: RadioCardProps) {
  const group = useRadioGroupContext()
  const isChecked = group?.value === value
  const isDisabled = group?.disabled || disabled
  const radioId = `radio-card-${value}`

  const handleClick = () => {
    if (group && !isDisabled) {
      group.onChange(value)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
        isChecked
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        type="radio"
        id={radioId}
        name={group?.name}
        value={value}
        checked={isChecked}
        disabled={isDisabled}
        onChange={() => group?.onChange(value)}
        className="sr-only"
      />

      {icon && (
        <div className={cn('text-muted-foreground', isChecked && 'text-primary')}>
          {icon}
        </div>
      )}

      <div className="flex-1">
        <label
          htmlFor={radioId}
          className={cn('text-sm font-medium cursor-pointer', isDisabled && 'cursor-not-allowed')}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      <div
        className={cn(
          'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          isChecked ? 'border-primary' : 'border-border'
        )}
      >
        {isChecked && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </div>
    </div>
  )
}
