import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const username = form.get('username') as string
    const password = form.get('password') as string

    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('auth', 'true')
      navigate('/dashboard')
    } else {
      setError('שם משתמש או סיסמה שגויים')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 rounded-xl border border-border bg-card">
        <h1 className="text-2xl font-bold text-center text-primary mb-6">ניהול קליניקה</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium">שם משתמש</label>
            <input
              id="username"
              name="username"
              type="text"
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              placeholder="הזן שם משתמש"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">סיסמה</label>
            <input
              id="password"
              name="password"
              type="password"
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              placeholder="הזן סיסמה"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            כניסה
          </button>
        </form>
      </div>
    </div>
  )
}
