import { useState, useRef, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatYMDLocal } from '@/lib/dates'

// ============================================
// Date Picker
// ============================================

export interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  minDate?: Date
  maxDate?: Date
  className?: string
}

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

export function DatePicker({
  value,
  onChange,
  placeholder = 'בחר תאריך',
  disabled,
  error,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => value || new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Get calendar days for current month view
  const getCalendarDays = () => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Adjust for Sunday start (Israeli calendar)
    const startOffset = firstDay.getDay()
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    // Next month days (fill to 42 for consistent grid)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return formatYMDLocal(date) === formatYMDLocal(today)
  }

  const isSelected = (date: Date) => {
    if (!value) return false
    return formatYMDLocal(date) === formatYMDLocal(value)
  }

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return
    onChange(date)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border bg-background transition-colors text-right',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          error ? 'border-red-500' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed bg-muted'
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className={cn('flex-1', !value && 'text-muted-foreground')}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
      </button>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute z-50 mt-1 p-3 bg-background border border-border rounded-lg shadow-modal min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="text-sm font-medium">
              {MONTHS_HE[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>

            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_HE.map(day => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map(({ date, isCurrentMonth }, index) => {
              const disabled = isDateDisabled(date)
              const today = isToday(date)
              const selected = isSelected(date)

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  disabled={disabled}
                  className={cn(
                    'h-8 w-8 flex items-center justify-center text-sm rounded transition-colors',
                    !isCurrentMonth && 'text-muted-foreground/50',
                    isCurrentMonth && !selected && 'hover:bg-muted',
                    today && !selected && 'border border-primary text-primary',
                    selected && 'bg-primary text-primary-foreground',
                    disabled && 'opacity-30 cursor-not-allowed'
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                setViewDate(today)
                handleDateSelect(today)
              }}
              className="w-full text-sm text-primary hover:underline"
            >
              היום
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Date Range Picker
// ============================================

export interface DateRangePickerProps {
  startDate?: Date | null
  endDate?: Date | null
  onChange: (range: { start: Date | null; end: Date | null }) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder = 'בחר טווח תאריכים',
  disabled,
  error,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')
  const [tempStart, setTempStart] = useState<Date | null>(startDate || null)
  const [viewDate, setViewDate] = useState(() => startDate || new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getCalendarDays = () => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false
    return date >= startDate && date <= endDate
  }

  const handleDateClick = (date: Date) => {
    if (selecting === 'start') {
      setTempStart(date)
      setSelecting('end')
    } else {
      if (tempStart && date >= tempStart) {
        onChange({ start: tempStart, end: date })
        setIsOpen(false)
        setSelecting('start')
      } else {
        // If end date is before start, treat as new start
        setTempStart(date)
      }
    }
  }

  const formatRange = () => {
    if (!startDate && !endDate) return placeholder
    if (startDate && !endDate) {
      return startDate.toLocaleDateString('he-IL')
    }
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('he-IL')} - ${endDate.toLocaleDateString('he-IL')}`
    }
    return placeholder
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border bg-background transition-colors text-right',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          error ? 'border-red-500' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed bg-muted'
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className={cn('flex-1', !startDate && 'text-muted-foreground')}>
          {formatRange()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 p-3 bg-background border border-border rounded-lg shadow-modal min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="text-sm font-medium">
              {MONTHS_HE[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>

            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="text-center text-xs text-muted-foreground mb-2">
            {selecting === 'start' ? 'בחר תאריך התחלה' : 'בחר תאריך סיום'}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_HE.map(day => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map(({ date, isCurrentMonth }, index) => {
              const inRange = isInRange(date)
              const isStart = startDate && formatYMDLocal(date) === formatYMDLocal(startDate)
              const isEnd = endDate && formatYMDLocal(date) === formatYMDLocal(endDate)

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    'h-8 w-8 flex items-center justify-center text-sm rounded transition-colors',
                    !isCurrentMonth && 'text-muted-foreground/50',
                    isCurrentMonth && !inRange && !isStart && !isEnd && 'hover:bg-muted',
                    inRange && 'bg-primary/10',
                    (isStart || isEnd) && 'bg-primary text-primary-foreground'
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
