import { useMemo } from 'react'
import { BadgeCheck, Building2, Calendar, Loader2, Star, X } from 'lucide-react'
import {
  useGetMockInterviewerQuery,
  type MockInterviewerDetail,
} from '../../api/mockInterviewApi'
import { useGetMentorPublicAvailabilityQuery } from '../../api/mentorAvailabilityApi'
import type { MockInterviewerCard } from '../../api/mockInterviewApi'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'
import { toDateKey } from '../../lib/bookingDates'

interface InterviewerProfileModalProps {
  interviewer: MockInterviewerCard
  onClose: () => void
  onBookInterview: (interviewer: MockInterviewerCard) => void
}

export function InterviewerProfileModal({
  interviewer,
  onClose,
  onBookInterview,
}: InterviewerProfileModalProps) {
  const { data: detail, isLoading, error } = useGetMockInterviewerQuery(interviewer.userId)

  const slotRange = useMemo(() => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 14)
    return {
      fromDate: toDateKey(from.getFullYear(), from.getMonth(), from.getDate()),
      toDate: toDateKey(to.getFullYear(), to.getMonth(), to.getDate()),
    }
  }, [])

  const { data: availability, isLoading: loadingSlots } = useGetMentorPublicAvailabilityQuery(
    {
      mentorId: interviewer.userId,
      fromDate: slotRange.fromDate,
      toDate: slotRange.toDate,
      durationMinutes: 60,
    },
    { skip: !interviewer.userId }
  )

  const slots = availability?.slots ?? []

  const profile: MockInterviewerDetail | MockInterviewerCard = detail ?? interviewer
  const imgSrc = profile.profilePicture ?? avatarUrl(profile.name, 96)
  const hasScheduled = (profile.requestStatus ?? '').toUpperCase() === 'ACCEPTED'
  const isDetail = (p: typeof profile): p is MockInterviewerDetail => 'bio' in p || 'recentReviews' in p

  const upcomingSlots = slots.filter((s) => s.available).slice(0, 6)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#161722] border border-[#2d2e3e] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="profile-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#161722]/95 border-b border-[#2d2e3e] backdrop-blur">
          <h2 id="profile-title" className="text-lg font-bold text-white">
            Interviewer Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]/50"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-[#8b8ca8]">
            <Loader2 size={20} className="animate-spin" /> Loading profile…
          </div>
        )}

        {error && !isLoading && (
          <p className="p-5 text-sm text-red-400">Could not load full profile.</p>
        )}

        {!isLoading && (
          <div className="p-5 space-y-5">
            <div className="flex gap-4">
              <div className="relative shrink-0">
                <img
                  src={imgSrc}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#6366f1]/30"
                />
                {profile.online && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#161722]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                  <BadgeCheck size={16} className="text-[#818cf8]" />
                </div>
                <p className="text-sm text-[#8b8ca8] mt-0.5">{profile.headline}</p>
                {profile.company && (
                  <p className="flex items-center gap-1 text-xs text-[#b4b5c8] mt-1">
                    <Building2 size={12} /> {profile.company}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="text-white font-semibold">{profile.rating.toFixed(1)}</span>
                    <span className="text-[#8b8ca8]">({profile.totalReviews} reviews)</span>
                  </span>
                  <span className="text-[#8b8ca8]">{profile.totalInterviews} interviews</span>
                  {profile.experience && (
                    <span className="text-[#8b8ca8]">{profile.experience}</span>
                  )}
                </div>
              </div>
            </div>

            {isDetail(profile) && profile.bio && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-[#5c5d72] mb-2">About</h4>
                <p className="text-sm text-[#b4b5c8] leading-relaxed">{profile.bio}</p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#5c5d72] mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded-md bg-[#0b0c14] text-[#a5b4fc] border border-[#2d2e3e]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#5c5d72] mb-2 flex items-center gap-1">
                <Calendar size={12} /> Available Slots
              </h4>
              {loadingSlots ? (
                <p className="text-xs text-[#8b8ca8] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading slots…
                </p>
              ) : upcomingSlots.length === 0 ? (
                <p className="text-xs text-[#8b8ca8]">No open slots in the next 14 days.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {upcomingSlots.map((slot) => (
                    <div
                      key={slot.startAt}
                      className="text-xs px-2 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-center"
                    >
                      <span className="block text-white font-semibold text-[10px]">{slot.date}</span>
                      <span className="text-[#818cf8]">{slot.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isDetail(profile) && profile.recentReviews.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-[#5c5d72] mb-3">Reviews</h4>
                <ul className="space-y-3 max-h-40 overflow-y-auto">
                  {profile.recentReviews.map((review, i) => (
                    <li key={i} className="rounded-lg bg-[#0b0c14] border border-[#2d2e3e] p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{review.reviewerName}</span>
                        <span className="flex items-center gap-0.5 text-amber-400 text-xs">
                          <Star size={11} className="fill-amber-400" />
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-[#b4b5c8] line-clamp-2">{review.comment}</p>
                      <p className="text-[10px] text-[#5c5d72] mt-1">{formatRelativeTime(review.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#2d2e3e]">
              <p className="text-2xl font-bold text-white">{profile.priceLabel}</p>
              <button
                type="button"
                disabled={hasScheduled}
                onClick={() => onBookInterview(interviewer)}
                className="px-6 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
              >
                {hasScheduled ? 'Already Scheduled' : 'Book Interview'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
