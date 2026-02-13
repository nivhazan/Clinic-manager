import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// Tabs Context
// ============================================

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// ============================================
// Tabs Root
// ============================================

export interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '')

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

// ============================================
// Tabs List
// ============================================

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 border-b border-border',
        className
      )}
      {...props}
    />
  )
}

// ============================================
// Tab Trigger
// ============================================

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext()
  const isSelected = selectedValue === value

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      onClick={() => onValueChange(value)}
      className={cn(
        'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
        isSelected
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground',
        className
      )}
      {...props}
    />
  )
}

// ============================================
// Tab Content
// ============================================

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext()

  if (selectedValue !== value) {
    return null
  }

  return (
    <div
      role="tabpanel"
      className={cn('mt-4', className)}
      {...props}
    />
  )
}

// ============================================
// Segmented Control (alternative tabs style)
// ============================================

export interface SegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  className?: string
}

export function SegmentedControl({
  value,
  onValueChange,
  options,
  className,
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 p-1 border border-border rounded-lg bg-muted/30',
        className
      )}
    >
      {options.map(option => (
        <button
          key={option.value}
          role="tab"
          type="button"
          aria-selected={value === option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === option.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
