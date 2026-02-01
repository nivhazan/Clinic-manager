import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  message?: string
}

export function EmptyState({ message = 'אין נתונים להצגה' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Inbox className="h-12 w-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
