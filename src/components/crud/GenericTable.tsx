import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Badge,
  Button,
} from '@/components/ui'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { CrudTableConfig, ColumnConfig } from './types'

interface GenericTableProps<T> {
  config: CrudTableConfig<T>
  data: T[]
  isLoading?: boolean
  hasFilters?: boolean
}

export function GenericTable<T>({
  config,
  data,
  isLoading = false,
  hasFilters = false,
}: GenericTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(
    config.defaultSortKey ? String(config.defaultSortKey) : null
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    config.defaultSortDirection ?? 'asc'
  )

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey]
      const bVal = (b as Record<string, unknown>)[sortKey]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  if (isLoading) {
    return <SkeletonTable rows={8} cols={config.columns.length} />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {config.columns.map(column => (
            <TableHead
              key={String(column.key)}
              className={cn(
                column.width && `w-[${column.width}]`,
                column.hiddenOnMobile && 'hidden md:table-cell'
              )}
            >
              {column.sortable ? (
                <button
                  onClick={() => handleSort(String(column.key))}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {column.header}
                  {sortKey === String(column.key) &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>
              ) : (
                column.header
              )}
            </TableHead>
          ))}
          {config.rowActions && config.rowActions.length > 0 && <TableHead>פעולות</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.length === 0 ? (
          <TableEmpty
            colSpan={config.columns.length + (config.rowActions ? 1 : 0)}
            message={
              hasFilters
                ? config.emptyFilteredMessage ?? 'לא נמצאו תוצאות'
                : config.emptyMessage ?? 'אין נתונים להצגה'
            }
          />
        ) : (
          sortedData.map(row => (
            <TableRow
              key={config.getRowKey(row)}
              clickable={!!config.onRowClick}
              onClick={() => config.onRowClick?.(row)}
            >
              {config.columns.map(column => (
                <TableCell
                  key={String(column.key)}
                  className={cn(column.hiddenOnMobile && 'hidden md:table-cell')}
                >
                  <CellRenderer column={column} row={row} />
                </TableCell>
              ))}
              {config.rowActions && config.rowActions.length > 0 && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    {config.rowActions
                      .filter(action => !action.showWhen || action.showWhen(row))
                      .map(action => (
                        <Button
                          key={action.key}
                          variant="ghost"
                          size="icon"
                          className={cn(
                            action.variant === 'danger' && 'text-destructive hover:bg-destructive/10'
                          )}
                          onClick={e => {
                            e.stopPropagation()
                            action.onClick(row)
                          }}
                          title={action.label}
                        >
                          {action.icon}
                        </Button>
                      ))}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

// ============================================
// Cell Renderer
// ============================================

interface CellRendererProps<T> {
  column: ColumnConfig<T>
  row: T
}

function CellRenderer<T>({ column, row }: CellRendererProps<T>) {
  const value = (row as Record<string, unknown>)[String(column.key)]

  // Custom render
  if (column.render) {
    return <>{column.render(row)}</>
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>
  }

  // Type-based rendering
  switch (column.type) {
    case 'date':
      return (
        <span dir="ltr">
          {new Intl.DateTimeFormat('he-IL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(new Date(value as string))}
        </span>
      )

    case 'currency':
      return <span className="font-medium">₪{(value as number).toLocaleString()}</span>

    case 'number':
      return <span dir="ltr">{(value as number).toLocaleString()}</span>

    case 'badge':
      const badgeValue = String(value)
      const variant = column.badgeVariants?.[badgeValue] ?? 'neutral'
      const label = column.badgeLabels?.[badgeValue] ?? badgeValue
      return <Badge variant={variant}>{label}</Badge>

    case 'boolean':
      return (
        <span className={value ? 'text-green-600' : 'text-muted-foreground'}>
          {value ? (column.trueLabel ?? 'כן') : (column.falseLabel ?? 'לא')}
        </span>
      )

    case 'text':
    default:
      return <span>{String(value)}</span>
  }
}
