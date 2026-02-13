import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            // Base styles
            'h-10 w-full rounded-lg border bg-background px-3 text-sm',
            'transition-colors placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Border color
            error ? 'border-red-500' : 'border-input',
            // Icon padding
            leftIcon && 'ps-10',
            rightIcon && 'pe-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
