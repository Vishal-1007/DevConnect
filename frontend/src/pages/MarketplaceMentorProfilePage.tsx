import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Loader2, Phone, Star, Video, Zap } from 'lucide-react'
import { useGetMarketplaceMentorQuery } from '../api/marketplaceApi'
import type { MarketplaceMentor } from '../api/marketplaceApi'
import { useGetWalletQuery, useStartPaidCallMutation } from '../api/walletApi'
import { useListMyMentorshipRequestsQuery } from '../api/mentorshipApi'
import { avatarUrl } from '../lib/avatar'
import { formatInr } from '../lib/money'
import { AddMoneyModal } from '../components/marketplace/AddMoneyModal'
import { RequestMentorshipModal } from '../components/marketplace/RequestMentorshipModal'
import { MentorshipRequestButton } from '../components/marketplace/MentorshipRequestButton'
import { canOpenMentorshipRequestModal, getMentorshipRequestState } from '../components/marketplace/marketplaceUtils'

export function MarketplaceMentorProfilePage() {
  const { mentorId } = useParams<{ mentorId: string }>()
  const navigate = useNavigate()
  const { data: mentor, isLoading } = useGetMarketplaceMentorQuery(mentorId!, { skip: !mentorId })
  const { data: wallet } = useGetWalletQuery()
  const { data: myRequests = [] } = useListMyMentorshipRequestsQuery(undefined, { pollingInterval: 15_000 })
  const [startCall] = useStartPaidCallMutation()
  const [showMentorship, setShowMentorship] = useState(false)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [pendingCall, setPendingCall] = useState<{ mentor: MarketplaceMentor; callType: 'AUDIO' | 'VIDEO' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function initiateCall(callType: 'AUDIO' | 'VIDEO') {
    if (!mentor) return
    setError(null)
    const price = callType === 'AUDIO' ? mentor.audioPricePerMinuteCents : mentor.videoPricePerMinuteCents
    if ((wallet?.balanceCents ?? 0) < price) {
      setPendingCall({ mentor, callType })
      setShowAddMoney(true)
      return
    }
    try {
      const session = await startCall({ mentorId: mentor.mentorId, callType, pricePerMinuteCents: price }).unwrap()
      navigate('/find-match', {
        state: { paidCall: { sessionId: session.id, mentor, callType } },
      })
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

  if (isLoading || !mentor) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#818cf8]" />
      </div>
    )
  }

  const img = mentor.profileImageUrl || avatarUrl(mentor.displayName, 120)
  const canCall = mentor.availabilityStatus === 'AVAILABLE' && mentor.instantCallEnabled
  const requestState = getMentorshipRequestState(mentor.mentorId, myRequests)

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-6">
      <button type="button" onClick={() => navigate('/find-match')} className="inline-flex items-center gap-1.5 text-sm text-[#818cf8] hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Find Match
      </button>

      {error && (
        <p className="text-sm text-red-300 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">{error}</p>
      )}

      <div className="rounded-2xl border border-[#2d2e3e] bg-gradient-to-br from-[#161722] to-[#12131c] p-6">
        <div className="flex flex-wrap items-start gap-5">
          <img src={img} alt="" className="w-24 h-24 rounded-2xl ring-2 ring-[#6366f1]/40 object-cover" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{mentor.displayName}</h1>
              {mentor.verified && <BadgeCheck className="w-6 h-6 text-[#6366f1]" />}
            </div>
            <p className="text-[#a5b4fc] mt-1">{mentor.designation} @ {mentor.company}</p>
            <p className="text-sm text-[#8b8ca8] mt-1">
              {mentor.experienceYears ?? '—'} years experience
              {mentor.location ? ` · ${mentor.location}` : ''}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {mentor.categories.map((cat) => (
                <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#c7d2fe] border border-[#6366f1]/25">
                  {cat}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="inline-flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" /> {mentor.averageRating.toFixed(1)} ({mentor.ratingCount} reviews)
              </span>
              <span className="text-[#8b8ca8]">{mentor.sessionsCompleted.toLocaleString()} sessions</span>
              <span className="text-emerald-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {mentor.responseMinutes} min response</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-5">
          <h2 className="font-bold text-white mb-3">About</h2>
          <p className="text-sm text-[#8b8ca8] leading-relaxed">{mentor.bio ?? 'Experienced mentor ready to help you grow.'}</p>
        </section>
        <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-5">
          <h2 className="font-bold text-white mb-3">Session Statistics</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Sessions Completed', mentor.sessionsCompleted],
              ['Average Rating', mentor.averageRating.toFixed(1)],
              ['Reviews', mentor.ratingCount],
              ['Response Time', `${mentor.responseMinutes} min`],
            ].map(([label, val]) => (
              <div key={label as string} className="p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
                <p className="text-[10px] text-[#5c5d72]">{label as string}</p>
                <p className="text-white font-bold mt-0.5">{val as string | number}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-5">
        <h2 className="font-bold text-white mb-3">Skills</h2>
        <div className="flex flex-wrap gap-1.5">
          {mentor.expertiseTags.map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-[#6366f1]/15 text-[#c7d2fe] border border-[#6366f1]/25">{tag}</span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 p-5">
        <h2 className="font-bold text-white mb-3">Pricing</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ['Audio Call', mentor.audioPricePerMinuteCents, '/min'],
            ['Video Call', mentor.videoPricePerMinuteCents, '/min'],
          ].map(([label, cents, suffix]) => (
            <div key={label as string} className="p-4 rounded-xl bg-[#0b0c14]/60 border border-emerald-500/20">
              <p className="text-xs text-[#8b8ca8]">{label as string}</p>
              <p className="text-lg font-bold text-emerald-400">{formatInr(cents as number)}{suffix as string}</p>
            </div>
          ))}
        </div>
        <p className={`text-xs font-bold mt-3 ${canCall ? 'text-emerald-400' : 'text-red-400'}`}>
          {canCall ? '🟢 Instant Call Available' : '🔴 Instant calls unavailable'}
        </p>
      </section>

      <section className="rounded-2xl border border-[#6366f1]/30 bg-[#6366f1]/5 p-5">
        <h2 className="font-bold text-white mb-3">Mentorship Plans</h2>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          {['1 Month Mentorship', '3 Month Interview Prep', '6 Month Career Growth'].map((plan) => (
            <div key={plan} className="p-3 rounded-xl border border-[#6366f1]/25 bg-[#161722]/80">
              <p className="font-semibold text-white text-xs">{plan}</p>
              <p className="text-[10px] text-[#8b8ca8] mt-1">Request mentorship to discuss pricing</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canCall}
          onClick={() => void initiateCall('AUDIO')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold disabled:opacity-40"
        >
          <Phone className="w-4 h-4" /> Audio Call
        </button>
        <button
          type="button"
          disabled={!canCall}
          onClick={() => void initiateCall('VIDEO')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6366f1]/20 text-[#c7d2fe] border border-[#6366f1]/40 text-sm font-semibold disabled:opacity-40"
        >
          <Video className="w-4 h-4" /> Video Call
        </button>
        <MentorshipRequestButton
          state={requestState}
          onRequest={() => {
            if (canOpenMentorshipRequestModal(requestState)) {
              setShowMentorship(true)
            }
          }}
        />
      </div>

      {showMentorship && (
        <RequestMentorshipModal mentor={mentor} onClose={() => setShowMentorship(false)} />
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
              void initiateCall(pendingCall.callType)
              setPendingCall(null)
            }
          }}
        />
      )}
    </div>
  )
}
