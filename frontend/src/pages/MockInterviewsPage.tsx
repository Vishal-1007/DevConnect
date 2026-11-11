import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  useGetMockInterviewCategoriesQuery,
  useLazyGetMockInterviewerQuery,
  useListMockInterviewersQuery,
} from '../api/mockInterviewApi'
import type { MockInterviewerCard } from '../api/mockInterviewApi'
import { InterviewerCard } from '../components/mock-interviews/InterviewerCard'
import { InterviewerProfileModal } from '../components/mock-interviews/InterviewerProfileModal'
import { BookSlotModal } from '../components/mock-interviews/BookSlotModal'
import { MockInterviewHero } from '../components/mock-interviews/MockInterviewHero'
import { MockInterviewCategoryRow } from '../components/mock-interviews/MockInterviewCategoryRow'
import {
  MockInterviewFilterBar,
  parseExperienceYears,
  type MockInterviewFilters,
} from '../components/mock-interviews/MockInterviewFilterBar'
import { MyMockInterviewRequests } from '../components/mock-interviews/MyMockInterviewRequests'
import { UpcomingInterviewSidebar } from '../components/mock-interviews/UpcomingInterviewSidebar'
import { SmartInterviewCard } from '../components/mock-interviews/SmartInterviewCard'
import { AIInterviewSetup } from '../components/mock-interviews/AIInterviewSetup'

type PageTab = 'marketplace' | 'requests'

const DEFAULT_FILTERS: MockInterviewFilters = {
  search: '',
  availability: '',
  sort: 'top-rated',
}

export function MockInterviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageTab = (searchParams.get('tab') as PageTab) || 'marketplace'
  const setPageTab = (tab: PageTab) => {
    setSearchParams(tab === 'marketplace' ? {} : { tab })
  }

  const { data: categories = [] } = useGetMockInterviewCategoriesQuery()

  const [filters, setFilters] = useState<MockInterviewFilters>(DEFAULT_FILTERS)
  const [category, setCategory] = useState<string | undefined>()

  const queryArgs = useMemo(
    () => ({
      search: filters.search.trim() || undefined,
      category,
      onlineOnly: filters.availability === 'online' ? true : undefined,
      minRating: filters.minRating,
      maxPrice: filters.maxPrice,
    }),
    [filters.search, filters.availability, filters.minRating, filters.maxPrice, category]
  )

  const { data: rawInterviewers = [], isLoading: loadingInterviewers, refetch } =
    useListMockInterviewersQuery(queryArgs, { pollingInterval: 20_000 })
  const [fetchInterviewer] = useLazyGetMockInterviewerQuery()

  const interviewers = useMemo(() => {
    let list = [...rawInterviewers]

    if (filters.minExperience) {
      list = list.filter((i) => parseExperienceYears(i.experience) >= filters.minExperience!)
    }

    if (filters.interviewType) {
      const type = filters.interviewType.toLowerCase()
      list = list.filter(
        (i) =>
          i.skills.some((s) => s.toLowerCase().includes(type)) ||
          i.headline.toLowerCase().includes(type)
      )
    }

    switch (filters.sort) {
      case 'most-booked':
        return list.sort((a, b) => b.totalInterviews - a.totalInterviews)
      case 'price-low':
        return list.sort((a, b) => a.pricePerInterviewCents - b.pricePerInterviewCents)
      case 'price-high':
        return list.sort((a, b) => b.pricePerInterviewCents - a.pricePerInterviewCents)
      default:
        return list.sort((a, b) => b.rating - a.rating)
    }
  }, [rawInterviewers, filters])

  const [profileTarget, setProfileTarget] = useState<MockInterviewerCard | null>(null)
  const [bookTarget, setBookTarget] = useState<MockInterviewerCard | null>(null)
  const [aiSetupOpen, setAiSetupOpen] = useState(false)
  const navigate = useNavigate()

  function patchFilters(patch: Partial<MockInterviewFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="p-6 min-h-full bg-[#0b0c14]">
      <div className="flex flex-wrap gap-2 mb-5">
        {(
          [
            ['marketplace', 'Marketplace'],
            ['requests', 'My Requests'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPageTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              pageTab === id
                ? 'dc-gradient-btn text-white'
                : 'bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {pageTab === 'requests' ? (
        <MyMockInterviewRequests />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 xl:gap-6 items-start">
          {/* Main column — hero + marketplace feed */}
          <div className="min-w-0 space-y-5">
            <MockInterviewHero />

            <SmartInterviewCard onStart={() => setAiSetupOpen(true)} />

            <MockInterviewCategoryRow
              categories={categories}
              selected={category}
              onSelect={setCategory}
            />

            <MockInterviewFilterBar filters={filters} onChange={patchFilters} />

            <section>
              <h2 className="text-sm font-semibold text-white mb-3">
                Available Interviewers
                {!loadingInterviewers && (
                  <span className="text-[#8b8ca8] font-normal ml-2">({interviewers.length})</span>
                )}
              </h2>

              {loadingInterviewers && (
                <div className="flex items-center gap-2 text-sm text-[#8b8ca8] py-8">
                  <Loader2 size={18} className="animate-spin" /> Loading interviewers…
                </div>
              )}

              {!loadingInterviewers && interviewers.length === 0 && (
                <div className="rounded-xl bg-[#161722]/90 border border-[#2d2e3e] p-8 text-center text-sm text-[#8b8ca8]">
                  No interviewers match your filters. Try adjusting search or category.
                </div>
              )}

              <div className="space-y-3">
                {interviewers.map((interviewer) => (
                  <InterviewerCard
                    key={interviewer.userId}
                    interviewer={interviewer}
                    onViewProfile={setProfileTarget}
                    onBookSlot={setBookTarget}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right sidebar — aligned with hero top */}
          <div className="xl:sticky xl:top-6">
            <UpcomingInterviewSidebar
              onReschedule={(interviewerId) => {
                const match = interviewers.find((i) => i.userId === interviewerId)
                if (match) {
                  setBookTarget(match)
                  return
                }
                void fetchInterviewer(interviewerId)
                  .unwrap()
                  .then((detail) => setBookTarget(detail))
                  .catch(() => undefined)
              }}
            />
          </div>
        </div>
      )}

      {profileTarget && (
        <InterviewerProfileModal
          interviewer={profileTarget}
          onClose={() => setProfileTarget(null)}
          onBookInterview={(i) => {
            setProfileTarget(null)
            setBookTarget(i)
          }}
        />
      )}

      {bookTarget && (
        <BookSlotModal
          interviewer={bookTarget}
          onClose={() => setBookTarget(null)}
          onSuccess={() => void refetch()}
        />
      )}

      {aiSetupOpen && (
        <AIInterviewSetup
          onClose={() => setAiSetupOpen(false)}
          onStarted={(id) => {
            setAiSetupOpen(false)
            navigate(`/mock-interviews/ai/${id}`)
          }}
        />
      )}
    </div>
  )
}
