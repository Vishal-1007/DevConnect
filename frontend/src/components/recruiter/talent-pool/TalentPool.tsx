import { useMemo, useState } from 'react'
import { UpgradeScreen } from '../subscription/FeatureGuard'
import { useSubscription } from '../../../contexts/SubscriptionContext'
import { TalentActions } from './TalentActions'
import { TalentFilters } from './TalentFilters'
import { TalentPoolTable } from './TalentPoolTable'
import { TalentAnalytics } from './TalentAnalytics'
import { SavedCandidateCard } from './SavedCandidateCard'
import { CandidateQuickView } from './CandidateQuickView'
import { CandidateProfileView } from '../CandidateProfileView'
import { ScheduleInterviewModal } from '../interviews/ScheduleInterviewModal'
import { RECRUITER_CANDIDATES } from '../../../data/recruiterData'
import type { SavedTalentCandidate } from '../../../data/recruiterTalentPoolData'
import {
  addToTalentPool,
  computeDevScoreDistribution,
  computeTalentOverview,
  DEFAULT_TALENT_FILTERS,
  filterTalentPool,
  formatTodayEntry,
  getRecentlyAdded,
  loadTalentPool,
  removeFromTalentPool,
  type TalentFilterState,
} from '../../../lib/recruiterTalentPoolStore'

const PAGE_SIZE = 6

export function TalentPool() {
  const { hasFeature } = useSubscription()
  const [candidates, setCandidates] = useState(() => loadTalentPool())
  const [filters, setFilters] = useState<TalentFilterState>(DEFAULT_TALENT_FILTERS)
  const [page, setPage] = useState(1)
  const [quickView, setQuickView] = useState<SavedTalentCandidate | null>(null)
  const [fullProfile, setFullProfile] = useState<SavedTalentCandidate | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => filterTalentPool(candidates, filters), [candidates, filters])
  const overview = useMemo(() => computeTalentOverview(candidates), [candidates])
  const distribution = useMemo(() => computeDevScoreDistribution(candidates), [candidates])
  const recentlyAdded = useMemo(() => getRecentlyAdded(candidates), [candidates])

  const profileCandidate = useMemo(() => {
    if (!fullProfile) return null
    return RECRUITER_CANDIDATES.find((c) => c.id === fullProfile.candidateId) ?? {
      id: fullProfile.candidateId,
      name: fullProfile.name,
      role: fullProfile.role,
      avatar: fullProfile.avatar,
      devScore: fullProfile.devScore,
      percentile: fullProfile.percentile,
      skills: fullProfile.skills,
      experience: fullProfile.experience,
      location: fullProfile.location,
      status: fullProfile.status,
      rating: fullProfile.rating,
      verified: fullProfile.verified,
      aiMatch: fullProfile.aiMatch,
      breakdown: fullProfile.breakdown,
      mentorFeedback: fullProfile.mentorFeedback,
    }
  }, [fullProfile])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleView(candidate: SavedTalentCandidate) {
    setQuickView(candidate)
  }

  function handleFullProfile(candidate: SavedTalentCandidate) {
    setQuickView(null)
    setFullProfile(candidate)
  }

  function handleRemove(poolId: string) {
    setCandidates((prev) => removeFromTalentPool(prev, poolId))
    setQuickView(null)
    showToast('Candidate removed from talent pool')
  }

  function handleImport() {
    showToast('Import feature — upload CSV or resume (coming soon)')
  }

  function handleAdd() {
    const unused = RECRUITER_CANDIDATES.find(
      (c) => !candidates.some((p) => p.candidateId === c.id),
    )
    if (!unused) {
      showToast('All sample candidates are already in your pool')
      return
    }
    const entry = formatTodayEntry(unused.id, unused.name, unused.role, unused.avatar, 'Manual')
    Object.assign(entry, {
      devScore: unused.devScore,
      percentile: unused.percentile,
      skills: unused.skills,
      experience: unused.experience,
      location: unused.location,
      locationDisplay: `${unused.location}, India`,
      status: unused.status,
      rating: unused.rating,
      reviewCount: 20,
      verified: unused.verified,
      aiMatch: unused.aiMatch,
      breakdown: unused.breakdown,
      mentorFeedback: unused.mentorFeedback,
    })
    setCandidates((prev) => addToTalentPool(prev, entry))
    showToast(`${unused.name} added to talent pool`)
  }

  if (!hasFeature('talentPool')) {
    return (
      <UpgradeScreen
        title="Talent Pool is a Pro Feature"
        description="Save verified candidates, manage your hiring pipeline, and create shortlists with a Pro Recruiter plan."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Talent Pool</h1>
          <p className="mt-1 text-sm text-[#8b8ca8]">
            Build your shortlist from DevScore-ranked verified talent
          </p>
        </div>
        <TalentActions onImport={handleImport} onAdd={handleAdd} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <TalentFilters
            filters={filters}
            onChange={(f) => { setFilters(f); setPage(1) }}
            onMoreFilters={() => showToast('Advanced filters coming soon')}
          />

          <TalentPoolTable
            candidates={filtered}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            onView={handleView}
            onMessage={() => showToast('Opening messages...')}
          />

          <div className="grid gap-3 lg:hidden">
            {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((candidate) => (
              <SavedCandidateCard
                key={candidate.poolId}
                candidate={candidate}
                onView={() => handleView(candidate)}
                onMessage={() => showToast('Opening messages...')}
                onMore={() => handleView(candidate)}
              />
            ))}
          </div>
        </div>

        <TalentAnalytics
          overview={overview}
          distribution={distribution}
          recentlyAdded={recentlyAdded}
          onImport={handleImport}
          onAdd={handleAdd}
        />
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-violet-500/30 bg-[#161722] px-4 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      {quickView && (
        <CandidateQuickView
          candidate={quickView}
          onClose={() => setQuickView(null)}
          onMessage={() => showToast('Opening messages...')}
          onScheduleInterview={() => setShowScheduleModal(true)}
          onViewFullProfile={() => handleFullProfile(quickView)}
          onRemove={() => handleRemove(quickView.poolId)}
        />
      )}

      {fullProfile && profileCandidate && (
        <CandidateProfileView
          candidate={profileCandidate}
          onClose={() => setFullProfile(null)}
        />
      )}

      {showScheduleModal && (
        <ScheduleInterviewModal
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            setShowScheduleModal(false)
            showToast('Interview scheduled successfully')
          }}
        />
      )}
    </div>
  )
}
