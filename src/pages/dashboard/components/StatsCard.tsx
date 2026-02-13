import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  onClick?: () => void
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: '',
  success: 'border-green-200 bg-green-50/50',
  warning: 'border-yellow-200 bg-yellow-50/50',
  danger: 'border-red-200 bg-red-50/50',
}

const iconVariantStyles = {
  default: 'text-muted-foreground',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
  variant = 'default',
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        'p-6 hover:bg-muted/30 transition-colors',
        onClick && 'cursor-pointer',
        variantStyles[variant]
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className={cn('h-5 w-5', iconVariantStyles[variant])} />}
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </Card>
  )
}
