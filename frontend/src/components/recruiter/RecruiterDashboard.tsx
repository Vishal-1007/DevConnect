import { useMemo, useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { RecruiterSidebar, type RecruiterTab } from './RecruiterSidebar'
import { RecruiterAnalytics } from './RecruiterAnalytics'
import { RecruiterHeaderActions } from './RecruiterHeaderActions'
import { CandidateCard } from './CandidateCard'
import { CandidateSearch, type CandidateFilters } from './CandidateSearch'
import { CandidateProfileView } from './CandidateProfileView'
import { JobManagement } from './JobManagement'
import { RecruiterApplications } from './RecruiterApplications'
import { RecentActivity } from './RecentActivity'
import { RecruiterInterviews } from './interviews/RecruiterInterviews'
import { RecruiterMessages } from './messages/RecruiterMessages'
import { TalentPool } from './talent-pool/TalentPool'
import { RecruiterAnalyticsPage } from './analytics/RecruiterAnalyticsPage'
import { CompanyProfile } from './company-profile/CompanyProfile'
import { BillingPlans } from './billing/BillingPlans'
import { RecruiterSettings } from './settings/RecruiterSettings'
import { useSubscription } from '../../contexts/SubscriptionContext'
import { loadScheduledInterviews, type ScheduledInterview } from '../../lib/recruiterInterviews'
import {
  filterRecruiterCandidates,
  sortRecruiterCandidates,
  type SortOption,
} from '../../lib/recruiterCandidateFilter'
import {
  computeRecruiterAnalytics,
  getReadNotificationIds,
  loadRecruiterActivity,
  loadRecruiterApplications,
  loadRecruiterJobs,
  markNotificationsRead,
  saveRecruiterApplications,
  saveRecruiterJobs,
} from '../../lib/recruiterPortalState'
import {
  DEFAULT_SEARCH_FILTERS,
  RECRUITER_CANDIDATES,
  RECRUITER_PROFILE,
  type RecruiterApplication,
  type RecruiterCandidate,
} from '../../data/recruiterData'

type ApplicationStatusFilter = 'all' | 'Applied' | 'Shortlisted' | 'Interview' | 'Rejected'

function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#2d2e3e] bg-[#161722]/40 p-8 text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[#8b8ca8]">{description}</p>
    </div>
  )
}

export function RecruiterDashboard({ initialTab = 'dashboard' }: { initialTab?: RecruiterTab }) {
  const { consumeUsage, syncActiveJobs } = useSubscription()
  const [activeTab, setActiveTab] = useState<RecruiterTab>(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('best-match')
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_SEARCH_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<CandidateFilters>(DEFAULT_SEARCH_FILTERS)
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidate | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>(() => loadScheduledInterviews())

  const [jobs, setJobs] = useState(() => loadRecruiterJobs())
  const [applications, setApplications] = useState(() => loadRecruiterApplications())
  const [activities, setActivities] = useState(() => loadRecruiterActivity())
  const [readNotificationIds, setReadNotificationIds] = useState(() => getReadNotificationIds())

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [autoOpenCreateJob, setAutoOpenCreateJob] = useState(false)
  const [autoOpenScheduleInterview, setAutoOpenScheduleInterview] = useState(false)
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<ApplicationStatusFilter>('all')

  const analytics = useMemo(
    () => computeRecruiterAnalytics(jobs, applications, scheduledInterviews, savedIds.size),
    [jobs, applications, scheduledInterviews, savedIds.size],
  )

  const activeJobCount = useMemo(
    () => jobs.filter((j) => j.status === 'Active').length,
    [jobs],
  )

  useEffect(() => {
    void syncActiveJobs(activeJobCount)
  }, [activeJobCount, syncActiveJobs])

  const unreadCount = useMemo(
    () => activities.filter((a) => !readNotificationIds.has(a.id)).length,
    [activities, readNotificationIds],
  )

  const candidates = useMemo(() => {
    const filtered = filterRecruiterCandidates(RECRUITER_CANDIDATES, appliedFilters, searchQuery)
    return sortRecruiterCandidates(filtered, sortBy)
  }, [searchQuery, sortBy, appliedFilters])

  function updateJobs(next: typeof jobs) {
    setJobs(next)
    saveRecruiterJobs(next)
  }

  function updateApplications(next: RecruiterApplication[]) {
    setApplications(next)
    saveRecruiterApplications(next)
  }

  function handleSearch() {
    void consumeUsage('CANDIDATE_SEARCH').then((ok) => {
      if (ok) setAppliedFilters({ ...filters })
    })
  }

  function handleClearFilters() {
    setFilters(DEFAULT_SEARCH_FILTERS)
    setAppliedFilters(DEFAULT_SEARCH_FILTERS)
    setSearchQuery('')
  }

  function handleAnalyticsNavigate(tab: RecruiterTab, cardKey?: string) {
    if (cardKey === 'shortlisted') {
      setApplicationStatusFilter('Shortlisted')
      setActiveTab('applications')
      return
    }
    if (cardKey === 'applications') {
      setApplicationStatusFilter('all')
    }
    if (tab === 'interviews') {
      setAutoOpenScheduleInterview(false)
    }
    setActiveTab(tab)
  }

  function handlePostJob() {
    setActiveTab('jobs')
    setAutoOpenCreateJob(true)
  }

  function handleMarkAllRead() {
    const ids = activities.map((a) => a.id)
    markNotificationsRead(ids)
    setReadNotificationIds(new Set(ids))
  }

  function renderContent() {
    switch (activeTab) {
      case 'jobs':
        return (
          <JobManagement
            jobs={jobs}
            onChange={updateJobs}
            onViewApplications={() => {
              setApplicationStatusFilter('all')
              setActiveTab('applications')
            }}
            autoOpenCreate={autoOpenCreateJob}
            onAutoOpenHandled={() => setAutoOpenCreateJob(false)}
          />
        )
      case 'applications':
        return (
          <RecruiterApplications
            applications={applications}
            onChange={updateApplications}
            statusFilter={applicationStatusFilter}
          />
        )
      case 'candidates':
        return renderCandidatesSection(true)
      case 'interviews':
        return (
          <RecruiterInterviews
            autoOpenSchedule={autoOpenScheduleInterview}
            onAutoOpenHandled={() => setAutoOpenScheduleInterview(false)}
          />
        )
      case 'messages':
        return <RecruiterMessages />
      case 'talent-pool':
        return <TalentPool />
      case 'analytics':
        return (
          <RecruiterAnalyticsPage stats={analytics} onNavigate={handleAnalyticsNavigate} />
        )
      case 'company-profile':
        return <CompanyProfile />
      case 'billing':
        return <BillingPlans />
      case 'settings':
        return <RecruiterSettings />
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <RecruiterAnalytics stats={analytics} onNavigate={handleAnalyticsNavigate} />
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
              <div>{renderCandidatesSection(false)}</div>
              <div className="space-y-4">
                <CandidateSearch
                  filters={filters}
                  onChange={setFilters}
                  onSearch={handleSearch}
                  onClear={handleClearFilters}
                  resultCount={candidates.length}
                />
                <RecentActivity activities={activities} />
              </div>
            </div>
          </div>
        )
    }
  }

  function renderCandidatesSection(fullPage: boolean) {
    return (
      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 backdrop-blur-md">
        <div className="border-b border-[#2d2e3e]/60 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Top Candidates For You</h2>
              <p className="text-xs text-[#8b8ca8]">
                {candidates.length} candidate{candidates.length === 1 ? '' : 's'} match your filters
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8ca8]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, skills, technology, location..."
                className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] py-2.5 pl-9 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="best-match">Best Match</option>
              <option value="devscore">Highest DevScore</option>
              <option value="experience">Experience</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {candidates.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-[#8b8ca8]">
              No candidates match your search. Try adjusting filters or lowering the DevScore minimum.
            </p>
          ) : (
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-[#2d2e3e] text-[11px] uppercase tracking-wide text-[#8b8ca8]">
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">DevScore</th>
                  <th className="px-4 py-3 font-medium">Skills</th>
                  <th className="px-4 py-3 font-medium">Experience</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onView={setSelectedCandidate}
                    onSave={(c) => setSavedIds((prev) => new Set(prev).add(c.id))}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!fullPage && candidates.length > 0 && (
          <div className="border-t border-[#2d2e3e]/60 px-5 py-3">
            <button
              type="button"
              onClick={() => setActiveTab('candidates')}
              className="text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              View more candidates →
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0b0c14] text-white">
      <RecruiterSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[#2d2e3e]/60 bg-[#0b0c14]/90 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Welcome back, {RECRUITER_PROFILE.name} 👋
              </h1>
              <p className="mt-1 text-sm text-[#8b8ca8]">
                Find and hire the best verified developers
              </p>
            </div>
            <RecruiterHeaderActions
              activities={activities}
              unreadCount={unreadCount}
              showNotifications={showNotifications}
              showProfileMenu={showProfileMenu}
              onToggleNotifications={() => {
                setShowNotifications((v) => !v)
                setShowProfileMenu(false)
              }}
              onToggleProfile={() => {
                setShowProfileMenu((v) => !v)
                setShowNotifications(false)
              }}
              onCloseMenus={() => {
                setShowNotifications(false)
                setShowProfileMenu(false)
              }}
              onMarkAllRead={handleMarkAllRead}
              onNavigate={setActiveTab}
              onPostJob={handlePostJob}
              readIds={readNotificationIds}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          {renderContent()}
        </main>
      </div>

      {selectedCandidate && (
        <CandidateProfileView
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onInterviewScheduled={(interview) => {
            setScheduledInterviews((prev) => [interview, ...prev])
            setActiveTab('interviews')
          }}
        />
      )}
    </div>
  )
}
