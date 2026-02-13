import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // Base styles
          'w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm',
          'transition-colors placeholder:text-muted-foreground resize-y',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Border color
          error ? 'border-red-500' : 'border-input',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
