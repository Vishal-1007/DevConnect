import { useMemo, useState } from 'react'

import { BadgeCheck, Clock, Loader2, MessageSquare, Star, UserCheck, UserX } from 'lucide-react'

import { useListMyMentorshipRequestsQuery } from '../api/mentorshipApi'

import { SubmitMentorFeedbackModal } from '../components/mentorship/SubmitMentorFeedbackModal'

import { avatarUrl } from '../lib/avatar'



type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'



const FILTERS: { id: StatusFilter; label: string }[] = [

  { id: 'ALL', label: 'All' },

  { id: 'PENDING', label: 'Pending' },

  { id: 'ACCEPTED', label: 'Accepted' },

  { id: 'REJECTED', label: 'Rejected' },

]



function StatusBadge({ status }: { status: string }) {

  if (status === 'PENDING') {

    return (

      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">

        <Clock className="w-3 h-3" /> Pending

      </span>

    )

  }

  if (status === 'ACCEPTED') {

    return (

      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">

        <UserCheck className="w-3 h-3" /> Accepted

      </span>

    )

  }

  return (

    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/30">

      <UserX className="w-3 h-3" /> Rejected

    </span>

  )

}



export function MyMentorshipRequestsPage() {

  const { data: requests = [], isLoading, isError, refetch } = useListMyMentorshipRequestsQuery(undefined, {

    pollingInterval: 20_000,

  })

  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [feedbackTarget, setFeedbackTarget] = useState<{ mentorId: string; mentorName: string } | null>(null)



  const filtered = useMemo(() => {

    if (filter === 'ALL') return requests

    return requests.filter((r) => r.status === filter)

  }, [requests, filter])



  const counts = useMemo(() => ({

    pending: requests.filter((r) => r.status === 'PENDING').length,

    accepted: requests.filter((r) => r.status === 'ACCEPTED').length,

    rejected: requests.filter((r) => r.status === 'REJECTED').length,

  }), [requests])



  return (

    <div className="p-5 max-w-3xl mx-auto space-y-6">

      <div>

        <h1 className="text-xl font-bold text-white">My Mentorship Requests</h1>

        <p className="text-sm text-[#8b8ca8] mt-1">

          Track long-term mentorship requests you&apos;ve sent to marketplace mentors.

        </p>

      </div>



      <div className="flex flex-wrap gap-2">

        {FILTERS.map((f) => (

          <button

            key={f.id}

            type="button"

            onClick={() => setFilter(f.id)}

            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${

              filter === f.id

                ? 'bg-[#6366f1]/25 text-white border-[#6366f1]/50'

                : 'bg-[#161722] text-[#8b8ca8] border-[#2d2e3e] hover:text-white'

            }`}

          >

            {f.label}

            {f.id === 'PENDING' && counts.pending > 0 && (

              <span className="ml-1.5 text-amber-400">({counts.pending})</span>

            )}

          </button>

        ))}

      </div>



      {isLoading ? (

        <div className="flex justify-center py-20">

          <Loader2 className="w-7 h-7 animate-spin text-[#818cf8]" />

        </div>

      ) : isError ? (

        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center">

          <p className="text-sm text-red-300">Could not load your requests.</p>

          <button type="button" onClick={() => void refetch()} className="text-xs text-red-400 mt-3">Retry</button>

        </div>

      ) : filtered.length === 0 ? (

        <div className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/60 px-8 py-16 text-center">

          <p className="text-sm text-[#8b8ca8]">

            {filter === 'ALL' ? 'No mentorship requests yet.' : `No ${filter.toLowerCase()} requests.`}

          </p>

          <p className="text-xs text-[#5c5d72] mt-2">Browse mentors on Find Match and click Request Mentorship.</p>

        </div>

      ) : (

        <div className="space-y-4">

          {filtered.map((req) => {

            const mentorName = req.mentorName ?? 'Mentor'

            const img = req.mentorProfileImageUrl || avatarUrl(mentorName, 56)

            return (

              <article

                key={req.id}

                className="rounded-2xl border border-[#2d2e3e] bg-gradient-to-br from-[#161722] to-[#12131c] p-5"

              >

                <div className="flex gap-4">

                  <img src={img} alt="" className="w-14 h-14 rounded-2xl ring-2 ring-[#6366f1]/30 object-cover shrink-0" />

                  <div className="flex-1 min-w-0">

                    <div className="flex flex-wrap items-start justify-between gap-2">

                      <div>

                        <div className="flex items-center gap-1.5">

                          <h3 className="font-bold text-white">{mentorName}</h3>

                          <BadgeCheck className="w-4 h-4 text-[#6366f1]" />

                        </div>

                        <p className="text-sm text-[#818cf8] mt-0.5">{req.goal}</p>

                      </div>

                      <StatusBadge status={req.status} />

                    </div>

                    {req.message && (

                      <div className="mt-3 flex gap-2 rounded-xl bg-[#0b0c14]/70 border border-[#2d2e3e] px-3 py-2.5">

                        <MessageSquare className="w-4 h-4 text-[#5c5d72] shrink-0 mt-0.5" />

                        <p className="text-sm text-[#8b8ca8] leading-relaxed">&ldquo;{req.message}&rdquo;</p>

                      </div>

                    )}

                    <p className="text-[11px] text-[#5c5d72] mt-3">

                      Sent {new Date(req.createdAt).toLocaleString()}

                      {req.status !== 'PENDING' && (

                        <> · Updated {new Date(req.updatedAt).toLocaleString()}</>

                      )}

                    </p>

                    {req.status === 'ACCEPTED' && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <p className="text-xs text-emerald-400 font-medium">
                          Your mentor accepted! You can connect during your next session.
                        </p>
                        <button
                          type="button"
                          onClick={() => setFeedbackTarget({ mentorId: req.mentorId, mentorName: mentorName })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/30"
                        >
                          <Star size={12} /> Leave feedback
                        </button>
                      </div>
                    )}

                  </div>

                </div>

              </article>

            )

          })}

        </div>

      )}



      {requests.length > 0 && (

        <p className="text-center text-[10px] text-[#5c5d72]">

          {counts.pending} pending · {counts.accepted} accepted · {counts.rejected} rejected

        </p>

      )}

      {feedbackTarget && (
        <SubmitMentorFeedbackModal
          mentorId={feedbackTarget.mentorId}
          mentorName={feedbackTarget.mentorName}
          onClose={() => setFeedbackTarget(null)}
        />
      )}
    </div>

  )

}

