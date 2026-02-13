import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  action?: {
    label: string
    icon?: React.ReactNode
    onClick?: () => void
    href?: string
  }
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, backTo, action, children }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="חזרה"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {action && (
          <Button
            variant="primary"
            leftIcon={action.icon}
            onClick={action.href ? () => navigate(action.href!) : action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>

      {children}
    </div>
  )
}
