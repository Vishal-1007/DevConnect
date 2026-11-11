import { useMemo, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { InterviewStats } from './InterviewStats'
import { InterviewFilters } from './InterviewFilters'
import { InterviewTable } from './InterviewTable'
import { InterviewAnalyticsSidebar } from './InterviewAnalyticsSidebar'
import { InterviewDetails } from './InterviewDetails'
import { ScheduleInterviewModal } from './ScheduleInterviewModal'
import type { RecruiterInterview } from '../../../data/recruiterInterviewData'
import {
  computeInterviewStats,
  computeTypeBreakdown,
  DEFAULT_INTERVIEW_FILTERS,
  filterInterviews,
  getJobFilterOptions,
  getTodayUpcoming,
  loadRecruiterInterviews,
  type InterviewFilterState,
  type InterviewTab,
} from '../../../lib/recruiterInterviewStore'

type Props = {
  autoOpenSchedule?: boolean
  onAutoOpenHandled?: () => void
}

const TABS: { id: InterviewTab; label: string }[] = [
  { id: 'all', label: 'All Interviews' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

export function RecruiterInterviews({ autoOpenSchedule, onAutoOpenHandled }: Props) {
  const [interviews, setInterviews] = useState<RecruiterInterview[]>(() => loadRecruiterInterviews())
  const [activeTab, setActiveTab] = useState<InterviewTab>('all')
  const [filters, setFilters] = useState<InterviewFilterState>(DEFAULT_INTERVIEW_FILTERS)
  const [selectedInterview, setSelectedInterview] = useState<RecruiterInterview | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  useEffect(() => {
    if (autoOpenSchedule) {
      setShowScheduleModal(true)
      onAutoOpenHandled?.()
    }
  }, [autoOpenSchedule, onAutoOpenHandled])

  const stats = useMemo(() => computeInterviewStats(interviews), [interviews])
  const typeBreakdown = useMemo(() => computeTypeBreakdown(interviews), [interviews])
  const todayUpcoming = useMemo(() => getTodayUpcoming(interviews), [interviews])
  const jobOptions = useMemo(() => getJobFilterOptions(), [])

  const filtered = useMemo(
    () => filterInterviews(interviews, activeTab, filters),
    [interviews, activeTab, filters],
  )

  const tabCounts = useMemo(() => ({
    upcoming: interviews.filter((i) => i.status === 'Upcoming').length,
    completed: interviews.filter((i) => i.status === 'Completed').length,
    cancelled: interviews.filter((i) => i.status === 'Cancelled').length,
  }), [interviews])

  function handleClearFilters() {
    setFilters(DEFAULT_INTERVIEW_FILTERS)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Interviews</h1>
          <p className="mt-1 text-sm text-[#8b8ca8]">
            Manage and schedule interviews with top candidates
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} />
          Schedule Interview
        </button>
      </div>

      <InterviewStats stats={stats} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 border-b border-[#2d2e3e]/60">
            {TABS.map((tab) => {
              const count =
                tab.id === 'upcoming' ? tabCounts.upcoming :
                tab.id === 'completed' ? tabCounts.completed :
                tab.id === 'cancelled' ? tabCounts.cancelled :
                null
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'border-violet-500 text-white'
                      : 'border-transparent text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {tab.label}
                  {count !== null && (
                    <span className="ml-1 text-violet-300">({count})</span>
                  )}
                </button>
              )
            })}
          </div>

          <InterviewFilters
            filters={filters}
            jobOptions={jobOptions}
            onChange={setFilters}
            onClear={handleClearFilters}
          />

          <InterviewTable interviews={filtered} onView={setSelectedInterview} />
        </div>

        <InterviewAnalyticsSidebar
          interviews={interviews}
          todayUpcoming={todayUpcoming}
          typeBreakdown={typeBreakdown}
          onSchedule={() => setShowScheduleModal(true)}
        />
      </div>

      {selectedInterview && (
        <InterviewDetails
          interview={selectedInterview}
          onClose={() => setSelectedInterview(null)}
          onUpdate={(next) => {
            setInterviews(next)
            setSelectedInterview(next.find((i) => i.id === selectedInterview.id) ?? null)
          }}
        />
      )}

      {showScheduleModal && (
        <ScheduleInterviewModal
          onClose={() => setShowScheduleModal(false)}
          onScheduled={setInterviews}
        />
      )}
    </div>
  )
}
