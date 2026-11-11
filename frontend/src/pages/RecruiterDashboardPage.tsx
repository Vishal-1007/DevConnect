import { useLocation } from 'react-router-dom'
import { RecruiterDashboard } from '../components/recruiter/RecruiterDashboard'
import type { RecruiterTab } from '../components/recruiter/RecruiterSidebar'
import { SubscriptionProvider } from '../contexts/SubscriptionContext'

function tabFromPath(pathname: string): RecruiterTab {
  if (pathname.includes('/interviews')) return 'interviews'
  if (pathname.includes('/messages')) return 'messages'
  if (pathname.includes('/talent-pool')) return 'talent-pool'
  if (pathname.includes('/analytics')) return 'analytics'
  if (pathname.includes('/company-profile')) return 'company-profile'
  if (pathname.includes('/billing')) return 'billing'
  if (pathname.includes('/settings')) return 'settings'
  return 'dashboard'
}

export function RecruiterDashboardPage() {
  const { pathname } = useLocation()
  return (
    <SubscriptionProvider>
      <RecruiterDashboard initialTab={tabFromPath(pathname)} />
    </SubscriptionProvider>
  )
}
