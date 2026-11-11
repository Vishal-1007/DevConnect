import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useListAvailableMentorsQuery, useGetMarketplaceStatsQuery } from '../../api/marketplaceApi'
import { useGetWalletQuery, useStartPaidCallMutation } from '../../api/walletApi'
import { MentorCard } from './MentorCard'
import { MentorProfileModal } from './MentorProfileModal'
import { AddMoneyModal } from './AddMoneyModal'
import { MarketplaceFeatureBar } from './MarketplaceFeatureBar'
import { MarketplaceStatsRow } from './MarketplaceStatsRow'
import { MarketplaceFiltersBar } from './MarketplaceFiltersBar'
import { RequestMentorshipModal } from './RequestMentorshipModal'
import { DEFAULT_FILTERS, filterAndSortMentors } from './marketplaceUtils'
import type { MarketplaceMentor } from '../../api/marketplaceApi'

interface FeaturedMentorsSectionProps {
  onPaidCallStarted?: (sessionId: string, mentor: MarketplaceMentor, callType: 'AUDIO' | 'VIDEO') => void
}

export function FeaturedMentorsSection({ onPaidCallStarted }: FeaturedMentorsSectionProps) {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data: mentors, isLoading, isError, refetch } = useListAvailableMentorsQuery()
  const { data: stats } = useGetMarketplaceStatsQuery()
  const { data: wallet } = useGetWalletQuery()
  const [startCall] = useStartPaidCallMutation()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<MarketplaceMentor | null>(null)
  const [mentorshipTarget, setMentorshipTarget] = useState<MarketplaceMentor | null>(null)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [pendingCall, setPendingCall] = useState<{ mentor: MarketplaceMentor; callType: 'AUDIO' | 'VIDEO' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(
    () => filterAndSortMentors(mentors ?? [], filters),
    [mentors, filters]
  )

  async function initiateCall(mentor: MarketplaceMentor, callType: 'AUDIO' | 'VIDEO') {
    setError(null)
    const price = callType === 'AUDIO' ? mentor.audioPricePerMinuteCents : mentor.videoPricePerMinuteCents
    if ((wallet?.balanceCents ?? 0) < price) {
      setPendingCall({ mentor, callType })
      setShowAddMoney(true)
      return
    }
    try {
      const session = await startCall({ mentorId: mentor.mentorId, callType, pricePerMinuteCents: price }).unwrap()
      onPaidCallStarted?.(session.id, mentor, callType)
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message ?? 'Unable to start call'
      if (msg.toLowerCase().includes('insufficient')) {
        setPendingCall({ mentor, callType })
        setShowAddMoney(true)
      } else {
        setError(msg)
      }
    }
  }

  function scrollCarousel(direction: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  function handleViewProfile(mentor: MarketplaceMentor) {
    navigate(`/marketplace/mentor/${mentor.mentorId}`)
  }

  return (
    <section className="pt-2">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#818cf8]" />
            <h2 className="text-lg font-bold text-white">Premium Mentor Marketplace</h2>
          </div>
          <p className="text-sm text-[#8b8ca8]">
            Browse verified mentors, start instant paid calls, or request long-term mentorship.
          </p>
        </div>
      </div>

      <MarketplaceStatsRow stats={stats} />
      <MarketplaceFiltersBar filters={filters} onChange={setFilters} />

      {isError && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3">
          <p className="text-sm text-red-300">Could not load mentors. Is mentor-service running?</p>
          <button type="button" onClick={() => void refetch()} className="text-xs text-red-400 hover:text-red-300 shrink-0">Retry</button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-300 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">{error}</p>
      )}

      <div className="relative group">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-[#6366f1]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-[#12131c] border border-[#2d2e3e] px-6 py-12 text-center">
            <p className="text-sm text-[#8b8ca8]">No mentors match your filters.</p>
            <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-xs text-[#818cf8] mt-2">Clear filters</button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-[#161722] border border-[#2d2e3e] text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center hover:border-[#6366f1]/50"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {filtered.map((mentor) => (
                <div key={mentor.mentorId} className="snap-start">
                  <MentorCard
                    mentor={mentor}
                    onViewProfile={handleViewProfile}
                    onAudioCall={(m) => void initiateCall(m, 'AUDIO')}
                    onVideoCall={(m) => void initiateCall(m, 'VIDEO')}
                    onRequestMentorship={setMentorshipTarget}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-[#161722] border border-[#2d2e3e] text-white shadow-lg flex items-center justify-center hover:border-[#6366f1]/50 hover:bg-[#1c1d2a]"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <p className="text-[10px] text-[#5c5d72] mt-2 text-center">
        Showing {filtered.length} of {mentors?.length ?? 0} available mentors
      </p>

      <MarketplaceFeatureBar />

      {selected && (
        <MentorProfileModal
          mentor={selected}
          onClose={() => setSelected(null)}
          onAudioCall={(m) => void initiateCall(m, 'AUDIO')}
          onVideoCall={(m) => void initiateCall(m, 'VIDEO')}
          onRequestMentorship={setMentorshipTarget}
        />
      )}

      {mentorshipTarget && (
        <RequestMentorshipModal
          mentor={mentorshipTarget}
          onClose={() => setMentorshipTarget(null)}
        />
      )}

      {showAddMoney && (
        <AddMoneyModal
          title="Insufficient Wallet Balance"
          onClose={() => {
            setShowAddMoney(false)
            setPendingCall(null)
          }}
          onSuccess={() => {
            setShowAddMoney(false)
            if (pendingCall) {
              void initiateCall(pendingCall.mentor, pendingCall.callType)
              setPendingCall(null)
            }
          }}
        />
      )}
    </section>
  )
}
