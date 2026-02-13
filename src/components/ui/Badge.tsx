import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  pill?: boolean
}

const variantStyles = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  pill = true,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border',
        variantStyles[variant],
        sizeStyles[size],
        pill ? 'rounded-full' : 'rounded-md',
        className
      )}
      {...props}
    />
  )
}

// Convenience components for common statuses
export function SuccessBadge(props: Omit<BadgeProps, 'variant'>) {
  return <Badge variant="success" {...props} />
}

export function WarningBadge(props: Omit<BadgeProps, 'variant'>) {
  return <Badge variant="warning" {...props} />
}

export function DangerBadge(props: Omit<BadgeProps, 'variant'>) {
  return <Badge variant="danger" {...props} />
}

// Status pill with consistent color mapping
export interface StatusPillProps {
  status: 'paid' | 'pending' | 'debt' | 'active' | 'inactive' | 'scheduled' | 'confirmed' | 'completed' | 'canceled'
  children: React.ReactNode
  className?: string
}

const statusToVariant: Record<StatusPillProps['status'], BadgeProps['variant']> = {
  paid: 'success',
  pending: 'warning',
  debt: 'danger',
  active: 'success',
  inactive: 'neutral',
  scheduled: 'info',
  confirmed: 'success',
  completed: 'neutral',
  canceled: 'danger',
}

export function StatusPill({ status, children, className }: StatusPillProps) {
  return (
    <Badge variant={statusToVariant[status]} className={className}>
      {children}
    </Badge>
  )
}
