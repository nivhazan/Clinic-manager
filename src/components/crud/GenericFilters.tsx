import { useState, useMemo, useCallback } from 'react'
import { FilterBar } from '@/components/layout'
import type { FilterConfig } from './types'

interface GenericFiltersProps<T> {
  config: FilterConfig[]
  data: T[]
  onFilter: (filtered: T[]) => void
  children?: React.ReactNode
}

export function GenericFilters<T>({
  config,
  data,
  onFilter,
  children,
}: GenericFiltersProps<T>) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    config.forEach(filter => {
      initial[filter.key] = ''
    })
    return initial
  })

  // Apply filters whenever values change
  const applyFilters = useCallback(
    (values: Record<string, string>) => {
      let filtered = [...data]

      config.forEach(filter => {
        const value = values[filter.key]
        if (!value) return

        switch (filter.type) {
          case 'search':
            const searchTerm = value.toLowerCase()
            const searchFields = filter.searchFields ?? [filter.key]
            filtered = filtered.filter(item => {
              return searchFields.some(field => {
                const fieldValue = (item as Record<string, unknown>)[field]
                if (fieldValue === null || fieldValue === undefined) return false
                return String(fieldValue).toLowerCase().includes(searchTerm)
              })
            })
            break

          case 'select':
            if (value !== 'all') {
              filtered = filtered.filter(item => {
                const fieldValue = (item as Record<string, unknown>)[filter.key]
                return String(fieldValue) === value
              })
            }
            break

          case 'date':
            filtered = filtered.filter(item => {
              const fieldValue = (item as Record<string, unknown>)[filter.key]
              return String(fieldValue) === value
            })
            break
        }
      })

      onFilter(filtered)
    },
    [config, data, onFilter]
  )

  function handleFilterChange(key: string, value: string) {
    const newValues = { ...filterValues, [key]: value }
    setFilterValues(newValues)
    applyFilters(newValues)
  }

  // Build search config
  const searchConfig = config.find(f => f.type === 'search')
  const selectFilters = config.filter(f => f.type === 'select')

  return (
    <FilterBar
      search={
        searchConfig
          ? {
              value: filterValues[searchConfig.key] ?? '',
              onChange: value => handleFilterChange(searchConfig.key, value),
              placeholder: searchConfig.placeholder,
            }
          : undefined
      }
      filters={selectFilters.map(filter => ({
        value: filterValues[filter.key] ?? 'all',
        onChange: value => handleFilterChange(filter.key, value),
        options: filter.options ?? [],
      }))}
    >
      {children}
    </FilterBar>
  )
}

// ============================================
// Hook for managing filtered data
// ============================================

export function useFilteredData<T>(
  data: T[],
  config: FilterConfig[]
): {
  filteredData: T[]
  setFilteredData: (data: T[]) => void
  hasFilters: boolean
  filterProps: {
    config: FilterConfig[]
    data: T[]
    onFilter: (filtered: T[]) => void
  }
} {
  const [filteredData, setFilteredData] = useState<T[]>(data)
  const [hasFilters, setHasFilters] = useState(false)

  // Update filtered data when source data changes
  useMemo(() => {
    if (!hasFilters) {
      setFilteredData(data)
    }
  }, [data, hasFilters])

  const handleFilter = useCallback((filtered: T[]) => {
    setFilteredData(filtered)
    setHasFilters(filtered.length !== data.length)
  }, [data.length])

  return {
    filteredData,
    setFilteredData,
    hasFilters,
    filterProps: {
      config,
      data,
      onFilter: handleFilter,
    },
  }
}
