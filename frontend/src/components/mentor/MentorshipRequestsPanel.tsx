import { CheckCircle2, Clock, Loader2, MessageSquare, UserPlus, XCircle } from 'lucide-react'

import {

  useListMentorMentorshipRequestsQuery,

  useAcceptMentorshipRequestMutation,

  useRejectMentorshipRequestMutation,

} from '../../api/mentorshipApi'

import { avatarUrl } from '../../lib/avatar'



function formatDate(iso: string) {

  return new Date(iso).toLocaleDateString(undefined, {

    month: 'short',

    day: 'numeric',

    year: 'numeric',

    hour: '2-digit',

    minute: '2-digit',

  })

}



export function MentorshipRequestsPanel() {

  const { data: requests = [], isLoading, isError, refetch } = useListMentorMentorshipRequestsQuery(undefined, {

    pollingInterval: 15_000,

  })

  const [accept, { isLoading: accepting }] = useAcceptMentorshipRequestMutation()

  const [reject, { isLoading: rejecting }] = useRejectMentorshipRequestMutation()



  if (isLoading) {

    return (

      <div className="flex justify-center py-16">

        <Loader2 className="w-7 h-7 animate-spin text-[#818cf8]" />

      </div>

    )

  }



  if (isError) {

    return (

      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center">

        <p className="text-sm text-red-300">Could not load mentorship requests.</p>

        <button type="button" onClick={() => void refetch()} className="text-xs text-red-400 mt-3 hover:text-red-300">

          Retry

        </button>

      </div>

    )

  }



  if (requests.length === 0) {

    return (

      <div className="rounded-2xl border border-[#2d2e3e] bg-gradient-to-br from-[#161722] to-[#12131c] px-8 py-16 text-center">

        <div className="w-14 h-14 rounded-2xl bg-[#6366f1]/15 border border-[#6366f1]/25 flex items-center justify-center mx-auto mb-4">

          <UserPlus className="w-7 h-7 text-[#818cf8]" />

        </div>

        <p className="text-white font-semibold">No pending mentorship requests</p>

        <p className="text-sm text-[#8b8ca8] mt-2 max-w-sm mx-auto">

          When learners request long-term mentorship from the marketplace, their requests will appear here.

        </p>

      </div>

    )

  }



  return (

    <div className="space-y-4">

      {requests.map((req) => {

        const name = req.studentName ?? 'Learner'

        const img = req.studentProfileImageUrl || avatarUrl(name, 56)

        return (

          <article

            key={req.id}

            className="group rounded-2xl border border-[#2d2e3e] bg-gradient-to-br from-[#161722]/90 to-[#0f1018]/90 p-5 hover:border-[#6366f1]/40 transition-all shadow-lg shadow-black/20"

          >

            <div className="flex flex-col sm:flex-row gap-4">

              <img

                src={img}

                alt=""

                className="w-14 h-14 rounded-2xl ring-2 ring-[#6366f1]/30 object-cover shrink-0"

              />

              <div className="flex-1 min-w-0">

                <div className="flex flex-wrap items-start justify-between gap-2">

                  <div>

                    <h3 className="text-base font-bold text-white">{name}</h3>

                    <p className="text-sm text-[#818cf8] font-medium mt-0.5">{req.goal}</p>

                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">

                    <Clock className="w-3 h-3" /> Pending

                  </span>

                </div>



                {req.message && (

                  <div className="mt-3 flex gap-2 rounded-xl bg-[#0b0c14]/70 border border-[#2d2e3e] px-3 py-2.5">

                    <MessageSquare className="w-4 h-4 text-[#5c5d72] shrink-0 mt-0.5" />

                    <p className="text-sm text-[#a5b4fc] leading-relaxed">&ldquo;{req.message}&rdquo;</p>

                  </div>

                )}



                <p className="text-[11px] text-[#5c5d72] mt-3">Requested {formatDate(req.createdAt)}</p>

              </div>

            </div>



            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#2d2e3e]/80">

              <button

                type="button"

                disabled={accepting || rejecting}

                onClick={() => void accept(req.id)}

                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold dc-gradient-btn text-white disabled:opacity-50"

              >

                <CheckCircle2 className="w-4 h-4" /> Accept

              </button>

              <button

                type="button"

                disabled={accepting || rejecting}

                onClick={() => void reject(req.id)}

                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"

              >

                <XCircle className="w-4 h-4" /> Reject

              </button>

            </div>

          </article>

        )

      })}

    </div>

  )

}

