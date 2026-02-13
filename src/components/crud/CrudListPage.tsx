import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, ConfirmDialog, toast } from '@/components/ui'
import { GenericTable } from './GenericTable'
import { GenericFilters, useFilteredData } from './GenericFilters'
import type { CrudConfig } from './types'

interface CrudListPageProps<T, TCreate, TUpdate> {
  config: CrudConfig<T, TCreate, TUpdate>
  hooks: {
    useList: () => { data: T[] | undefined; isLoading: boolean }
    useDelete: () => { mutate: (id: string, options?: { onSuccess?: () => void; onError?: () => void }) => void; isPending: boolean }
  }
}

export function CrudListPage<T, TCreate, TUpdate>({
  config,
  hooks,
}: CrudListPageProps<T, TCreate, TUpdate>) {
  const navigate = useNavigate()
  const { data = [], isLoading } = hooks.useList()
  const deleteMutation = hooks.useDelete()

  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)

  // Filtered data
  const { filteredData, hasFilters, filterProps } = useFilteredData(
    data,
    config.filters ?? []
  )

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!deleteTarget) return

    const id = config.table.getRowKey(deleteTarget)
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success({ title: `${config.labels.singular} נמחק בהצלחה` })
        setDeleteTarget(null)
      },
      onError: () => {
        toast.error({ title: `שגיאה במחיקת ${config.labels.singular}` })
      },
    })
  }, [deleteTarget, config, deleteMutation])

  // Build row actions with standard CRUD actions
  const rowActions = [
    ...(config.routes.view
      ? [
          {
            key: 'view',
            label: 'צפייה',
            icon: <Eye className="h-4 w-4" />,
            onClick: (row: T) => navigate(config.routes.view!(config.table.getRowKey(row))),
          },
        ]
      : []),
    {
      key: 'edit',
      label: 'עריכה',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (row: T) => navigate(config.routes.edit(config.table.getRowKey(row))),
    },
    {
      key: 'delete',
      label: 'מחיקה',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: T) => setDeleteTarget(row),
      variant: 'danger' as const,
    },
    ...(config.table.rowActions ?? []),
  ]

  // Table config with row actions
  const tableConfig = {
    ...config.table,
    rowActions,
    onRowClick: config.table.onRowClick ?? ((row: T) => {
      if (config.routes.view) {
        navigate(config.routes.view(config.table.getRowKey(row)))
      } else {
        navigate(config.routes.edit(config.table.getRowKey(row)))
      }
    }),
  }

  return (
    <div>
      <PageHeader
        title={config.labels.plural}
        action={{
          label: config.labels.newItem,
          icon: <Plus className="h-4 w-4" />,
          href: config.routes.new,
        }}
      />

      {config.filters && config.filters.length > 0 && (
        <GenericFilters {...filterProps}>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate(config.routes.new)}
          >
            {config.labels.newItem}
          </Button>
        </GenericFilters>
      )}

      <GenericTable
        config={tableConfig}
        data={filteredData}
        isLoading={isLoading}
        hasFilters={hasFilters}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={config.labels.deleteConfirmTitle}
        message={deleteTarget ? config.labels.deleteConfirmMessage(deleteTarget) : ''}
        confirmText="מחק"
        cancelText="ביטול"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
