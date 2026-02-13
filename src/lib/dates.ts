/**
 * Format a Date to 'YYYY-MM-DD' using LOCAL timezone (not UTC).
 * Avoids the off-by-one bug caused by `date.toISOString().split('T')[0]`
 * which converts to UTC first.
 */
export function formatYMDLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
