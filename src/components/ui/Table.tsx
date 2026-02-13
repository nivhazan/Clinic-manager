import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { Loader2 } from 'lucide-react'

// ============================================
// Table Container
// ============================================

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="w-full overflow-auto border border-border rounded-lg">
        <table
          ref={ref}
          className={cn('w-full caption-bottom text-sm', className)}
          {...props}
        />
      </div>
    )
  }
)
Table.displayName = 'Table'

// ============================================
// Table Header
// ============================================

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('bg-muted/50', className)}
        {...props}
      />
    )
  }
)
TableHeader.displayName = 'TableHeader'

// ============================================
// Table Body
// ============================================

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn('[&_tr:last-child]:border-0', className)}
        {...props}
      />
    )
  }
)
TableBody.displayName = 'TableBody'

// ============================================
// Table Row
// ============================================

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-t border-border transition-colors',
          clickable && 'hover:bg-muted/50 cursor-pointer',
          className
        )}
        {...props}
      />
    )
  }
)
TableRow.displayName = 'TableRow'

// ============================================
// Table Head Cell
// ============================================

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'text-start text-sm font-medium px-4 py-3 text-muted-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
TableHead.displayName = 'TableHead'

// ============================================
// Table Cell
// ============================================

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn('px-4 py-3 text-sm', className)}
        {...props}
      />
    )
  }
)
TableCell.displayName = 'TableCell'

// ============================================
// Table Caption
// ============================================

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn('mt-4 text-sm text-muted-foreground', className)}
        {...props}
      />
    )
  }
)
TableCaption.displayName = 'TableCaption'

// ============================================
// Table Empty State
// ============================================

export interface TableEmptyProps {
  colSpan: number
  message?: string
  icon?: React.ReactNode
}

export function TableEmpty({ colSpan, message = 'אין נתונים להצגה', icon }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8">
        <EmptyState message={message} icon={icon} />
      </td>
    </tr>
  )
}

// ============================================
// Table Loading State
// ============================================

export interface TableLoadingProps {
  colSpan: number
  rows?: number
}

export function TableLoading({ colSpan, rows = 5 }: TableLoadingProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-border">
          {Array.from({ length: colSpan }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ============================================
// Skeleton Row
// ============================================

export function TableSkeleton({ colSpan }: { colSpan: number }) {
  return (
    <tr className="border-t border-border">
      <td colSpan={colSpan} className="py-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      </td>
    </tr>
  )
}
