import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { RightChatPanel } from './RightChatPanel'

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0c14]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <div className="flex-1 flex min-h-0">
          <main className="flex-1 overflow-y-auto min-w-0">
            <Outlet />
          </main>
          <RightChatPanel />
        </div>
      </div>
    </div>
  )
}

/** Layout without right chat panel (profile, settings, etc.) */
export function DashboardLayoutSimple() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0c14]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
