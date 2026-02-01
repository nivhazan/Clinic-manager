import { LogOut } from 'lucide-react'

export function Topbar() {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
      <h1 className="text-lg font-bold text-primary">ניהול קליניקה</h1>
      <button
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => {
          // TODO: implement logout
        }}
      >
        <LogOut className="h-4 w-4" />
        <span>התנתק</span>
      </button>
    </header>
  )
}
