import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { Breadcrumbs } from './Breadcrumbs'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
