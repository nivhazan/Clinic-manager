import { cn } from '@/lib/utils'
import { SearchInput } from './SearchInput'
import { NativeSelect, type SelectOption } from '@/components/ui'

export interface FilterBarProps {
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  filters?: Array<{
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
  }>
  children?: React.ReactNode
  className?: string
}

export function FilterBar({ search, filters, children, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 mb-4', className)}>
      {search && (
        <SearchInput
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
          className="flex-1 max-w-sm min-w-[200px]"
        />
      )}

      {filters?.map((filter, index) => (
        <NativeSelect
          key={index}
          value={filter.value}
          onChange={e => filter.onChange(e.target.value)}
          options={filter.options}
          className="w-auto min-w-[140px]"
        />
      ))}

      {children}
    </div>
  )
}
