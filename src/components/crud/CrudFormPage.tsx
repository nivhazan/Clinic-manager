import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { toast } from '@/components/ui'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { GenericForm } from './GenericForm'
import type { CrudConfig } from './types'

interface CrudFormPageProps<T, TCreate, TUpdate> {
  config: CrudConfig<T, TCreate, TUpdate>
  hooks: {
    useItem: (id: string) => { data: T | undefined; isLoading: boolean }
    useCreate: () => { mutate: (data: TCreate, options?: { onSuccess?: () => void; onError?: () => void }) => void; isPending: boolean }
    useUpdate: () => { mutate: (params: { id: string; data: TUpdate }, options?: { onSuccess?: () => void; onError?: () => void }) => void; isPending: boolean }
  }
}

export function CrudFormPage<T, TCreate, TUpdate>({
  config,
  hooks,
}: CrudFormPageProps<T, TCreate, TUpdate>) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: item, isLoading: itemLoading } = hooks.useItem(id ?? '')
  const createMutation = hooks.useCreate()
  const updateMutation = hooks.useUpdate()

  const [initialValues, setInitialValues] = useState<Record<string, unknown>>({})

  // Set initial values when item loads
  useEffect(() => {
    if (item) {
      setInitialValues(config.toFormData(item))
    }
  }, [item, config])

  async function handleSubmit(values: Record<string, unknown>) {
    const data = config.fromFormData(values)

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, data: data as TUpdate },
        {
          onSuccess: () => {
            toast.success({ title: `${config.labels.singular} עודכן בהצלחה` })
            navigate(config.routes.list)
          },
          onError: () => {
            toast.error({ title: `שגיאה בעדכון ${config.labels.singular}` })
          },
        }
      )
    } else {
      createMutation.mutate(data as TCreate, {
        onSuccess: () => {
          toast.success({ title: `${config.labels.singular} נוצר בהצלחה` })
          navigate(config.routes.list)
        },
        onError: () => {
          toast.error({ title: `שגיאה ביצירת ${config.labels.singular}` })
        },
      })
    }
  }

  function handleCancel() {
    navigate(config.routes.list)
  }

  // Loading state
  if (isEdit && itemLoading) {
    return (
      <div>
        <PageHeader
          title={config.labels.editItem}
          backTo={config.routes.list}
        />
        <div className="space-y-6 max-w-3xl">
          {config.form.sections.map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title={isEdit ? config.labels.editItem : config.labels.newItem}
        backTo={config.routes.list}
      />

      <div className="max-w-3xl">
        <GenericForm
          config={config.form}
          initialValues={isEdit ? initialValues : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isPending}
        />
      </div>
    </div>
  )
}
