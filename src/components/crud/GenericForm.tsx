import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Textarea,
  FormField,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  toast,
} from '@/components/ui'
import { NativeSelect } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/lib/utils'
import type { CrudFormConfig, FieldConfig, FormSection } from './types'

interface GenericFormProps {
  config: CrudFormConfig
  initialValues?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
}

export function GenericForm({
  config,
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'שמירה',
  cancelLabel = 'ביטול',
}: GenericFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form values
  useEffect(() => {
    const initial: Record<string, unknown> = {}
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        initial[field.name] =
          initialValues[field.name] ?? field.defaultValue ?? getDefaultValue(field)
      })
    })
    setValues(initial)
  }, [config, initialValues])

  function getDefaultValue(field: FieldConfig): unknown {
    switch (field.type) {
      case 'number':
      case 'currency':
        return ''
      case 'checkbox':
        return false
      case 'select':
        return ''
      default:
        return ''
    }
  }

  function handleChange(name: string, value: unknown) {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Run validation
    const validationErrors: Record<string, string> = {}

    // Required field validation
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        const value = values[field.name]
        const isVisible = !field.showWhen || field.showWhen(values)

        if (isVisible && field.required) {
          if (value === '' || value === null || value === undefined) {
            validationErrors[field.name] = 'שדה חובה'
          }
        }
      })
    })

    // Custom validation
    if (config.validate) {
      const customErrors = config.validate(values)
      Object.assign(validationErrors, customErrors)
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error({ title: 'יש לתקן את השדות המסומנים' })
      return
    }

    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {config.sections.map((section, sectionIndex) => (
        <SectionRenderer
          key={sectionIndex}
          section={section}
          values={values}
          errors={errors}
          onChange={handleChange}
        />
      ))}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? 'שומר...' : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  )
}

// ============================================
// Section Renderer
// ============================================

interface SectionRendererProps {
  section: FormSection
  values: Record<string, unknown>
  errors: Record<string, string>
  onChange: (name: string, value: unknown) => void
}

function SectionRenderer({ section, values, errors, onChange }: SectionRendererProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        {section.description && (
          <p className="text-sm text-muted-foreground">{section.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields.map(field => {
            // Check if field should be visible
            if (field.showWhen && !field.showWhen(values)) {
              return null
            }

            return (
              <FieldRenderer
                key={field.name}
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={value => onChange(field.name, value)}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Field Renderer
// ============================================

interface FieldRendererProps {
  field: FieldConfig
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}

function FieldRenderer({ field, value, error, onChange }: FieldRendererProps) {
  const colSpanClass = field.colSpan === 2 ? 'md:col-span-2' : ''

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <FormField
          label={field.label}
          htmlFor={field.name}
          required={field.required}
          error={error}
          hint={field.hint}
          className={colSpanClass}
        >
          <Input
            id={field.name}
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            dir={field.dir}
            error={!!error}
          />
        </FormField>
      )

    case 'number':
    case 'currency':
      return (
        <FormField
          label={field.label}
          htmlFor={field.name}
          required={field.required}
          error={error}
          hint={field.hint}
          className={colSpanClass}
        >
          <Input
            id={field.name}
            type="number"
            value={value === '' ? '' : String(value ?? '')}
            onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step ?? (field.type === 'currency' ? 0.01 : 1)}
            dir="ltr"
            error={!!error}
          />
        </FormField>
      )

    case 'date':
      return (
        <FormField
          label={field.label}
          htmlFor={field.name}
          required={field.required}
          error={error}
          hint={field.hint}
          className={colSpanClass}
        >
          <Input
            id={field.name}
            type="date"
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            error={!!error}
          />
        </FormField>
      )

    case 'textarea':
      return (
        <FormField
          label={field.label}
          htmlFor={field.name}
          required={field.required}
          error={error}
          hint={field.hint}
          className={colSpanClass}
        >
          <Textarea
            id={field.name}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(field.rows && `min-h-[${field.rows * 24}px]`)}
            error={!!error}
          />
        </FormField>
      )

    case 'select':
      return (
        <FormField
          label={field.label}
          htmlFor={field.name}
          required={field.required}
          error={error}
          hint={field.hint}
          className={colSpanClass}
        >
          <NativeSelect
            id={field.name}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            options={field.options ?? []}
            error={!!error}
          />
        </FormField>
      )

    case 'checkbox':
      return (
        <div className={cn('flex items-center', colSpanClass)}>
          <Checkbox
            id={field.name}
            checked={Boolean(value)}
            onChange={e => onChange((e.target as HTMLInputElement).checked)}
            label={field.label}
            description={field.hint}
          />
        </div>
      )

    default:
      return null
  }
}
