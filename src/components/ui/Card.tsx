import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// Card Container
// ============================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'bordered', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-card text-card-foreground',
          {
            'border border-border': variant === 'bordered' || variant === 'default',
            'shadow-card': variant === 'elevated',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

// ============================================
// Card Header
// ============================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-5 pb-0', className)}
        {...props}
      />
    )
  }
)
CardHeader.displayName = 'CardHeader'

// ============================================
// Card Title
// ============================================

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold', className)}
        {...props}
      />
    )
  }
)
CardTitle.displayName = 'CardTitle'

// ============================================
// Card Description
// ============================================

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    )
  }
)
CardDescription.displayName = 'CardDescription'

// ============================================
// Card Content
// ============================================

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-5', className)}
        {...props}
      />
    )
  }
)
CardContent.displayName = 'CardContent'

// ============================================
// Card Footer
// ============================================

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-5 pt-0 flex items-center gap-3', className)}
        {...props}
      />
    )
  }
)
CardFooter.displayName = 'CardFooter'
