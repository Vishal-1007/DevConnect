import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { VideoCallSection } from '../components/find-match/VideoCallSection'
import { FeaturedMentorsSection } from '../components/marketplace/FeaturedMentorsSection'
import { CallBillingWidget } from '../components/marketplace/CallBillingWidget'
import { avatarUrl } from '../lib/avatar'
import { useAppSelector } from '../hooks'
import { useGetMyProfileQuery } from '../api/userApi'
import { useMatchFlow } from '../hooks/useMatchFlow'
import { useLiveMatchEvents } from '../hooks/useLiveMatchEvents'
import type { MarketplaceMentor } from '../api/marketplaceApi'

export function FindMatchPage() {
  const location = useLocation()
  const account = useAppSelector((s) => s.auth.account)
  const { data: profile } = useGetMyProfileQuery()
  const userName = profile?.displayName ?? account?.username ?? 'You'
  const { session, startMatchAsLearner, cancelMatch, clearError } = useMatchFlow()
  useLiveMatchEvents(account?.id)

  const [paidCall, setPaidCall] = useState<{
    sessionId: string
    mentor: MarketplaceMentor
    callType: 'AUDIO' | 'VIDEO'
  } | null>(null)

  useEffect(() => {
    const state = location.state as {
      paidCall?: { sessionId: string; mentor: MarketplaceMentor; callType: 'AUDIO' | 'VIDEO' }
    } | null
    if (state?.paidCall) {
      setPaidCall(state.paidCall)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const isSearching = session.status === 'searching' || session.status === 'waiting_accept'
  const isMatched = session.status === 'matched' || session.status === 'in_call'
  const partnerName = session.partner?.displayName ?? 'Partner'

  function handleFindMatch() {
    const skills = profile?.skills ?? []
    void startMatchAsLearner(
      'Find a mentor for a live session',
      skills,
      profile?.experienceLevel ?? undefined
    )
  }

  return (
    <div className="p-5 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Find Your Match</h1>
          <p className="text-sm text-[#8b8ca8] mt-0.5">
            Get connected with developers & experts worldwide
          </p>
        </div>

        {isSearching ? (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#161722] border border-[#2d2e3e]">
            <span className="text-sm text-[#8b8ca8]">
              {session.status === 'waiting_accept' ? 'Waiting for mentor to accept…' : 'Searching for a mentor…'}
            </span>
            <div className="flex items-center gap-2">
              <img
                src={avatarUrl(userName, 32)}
                alt=""
                className="w-8 h-8 rounded-full ring-2 ring-emerald-500/50"
              />
              <div className="flex gap-1 px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-matching-dots" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-matching-dots [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-matching-dots [animation-delay:0.4s]" />
              </div>
              <div className="w-8 h-8 rounded-full ring-2 ring-[#6366f1]/50 bg-[#2d2e3e] animate-pulse" />
            </div>
            <button
              type="button"
              onClick={() => void cancelMatch()}
              className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg border border-red-500/30"
            >
              Cancel
            </button>
          </div>
        ) : isMatched ? (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#161722] border border-emerald-500/30">
            <span className="text-sm text-emerald-400 font-medium">Connected</span>
            <div className="flex items-center gap-2">
              <img
                src={avatarUrl(userName, 32)}
                alt=""
                className="w-8 h-8 rounded-full ring-2 ring-emerald-500/50"
              />
              <span className="text-[#6366f1] text-xs">↔</span>
              <img
                src={avatarUrl(partnerName, 32)}
                alt=""
                className="w-8 h-8 rounded-full ring-2 ring-[#6366f1]/50"
              />
              <span className="text-sm text-white">{partnerName}</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleFindMatch}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold dc-gradient-btn text-white hover:opacity-90 transition-opacity"
          >
            Find Match
          </button>
        )}
      </div>

      {session.error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-300">{session.error}</p>
          <button
            type="button"
            onClick={clearError}
            className="text-xs text-red-400 hover:text-red-300 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <VideoCallSection />

      {paidCall && (
        <CallBillingWidget
          sessionId={paidCall.sessionId}
          mentorName={paidCall.mentor.displayName}
          onEnded={() => setPaidCall(null)}
        />
      )}

      <FeaturedMentorsSection
        onPaidCallStarted={(sessionId, mentor, callType) =>
          setPaidCall({ sessionId, mentor, callType })
        }
      />
    </div>
  )
}
