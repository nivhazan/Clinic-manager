export function getAll<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  if (!raw) return []
  return JSON.parse(raw) as T[]
}

export function setAll<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function now(): string {
  return new Date().toISOString()
}
