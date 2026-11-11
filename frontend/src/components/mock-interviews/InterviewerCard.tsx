import { useState } from 'react'
import { BadgeCheck, Heart, Star } from 'lucide-react'
import type { MockInterviewerCard } from '../../api/mockInterviewApi'
import { useToggleMockInterviewerFavoriteMutation } from '../../api/mockInterviewApi'
import { avatarUrl } from '../../lib/avatar'

interface InterviewerCardProps {
  interviewer: MockInterviewerCard
  onViewProfile: (interviewer: MockInterviewerCard) => void
  onBookSlot: (interviewer: MockInterviewerCard) => void
}

function bookButtonLabel(status: string): { label: string; disabled: boolean } {
  const s = status?.toUpperCase() ?? 'NONE'
  if (s === 'ACCEPTED') return { label: 'Interview Scheduled', disabled: true }
  return { label: 'Book Slot', disabled: false }
}

function parsePriceParts(priceLabel: string, cents: number): { amount: string; suffix: string } {
  const match = priceLabel.match(/₹[\d,]+/)
  if (match) {
    return { amount: match[0], suffix: '/ session' }
  }
  return { amount: `₹${Math.round(cents / 100)}`, suffix: '/ session' }
}

function expYears(exp: string | null): string {
  if (!exp) return '—'
  const m = exp.match(/(\d+)/)
  return m ? m[1] : '—'
}

export function InterviewerCard({
  interviewer,
  onViewProfile,
  onBookSlot,
}: InterviewerCardProps) {
  const [favorited, setFavorited] = useState(interviewer.favorited)
  const [toggleFavorite, { isLoading: toggling }] = useToggleMockInterviewerFavoriteMutation()
  const { label: bookLabel, disabled: bookDisabled } = bookButtonLabel(interviewer.requestStatus)

  const imgSrc = interviewer.profilePicture ?? avatarUrl(interviewer.name, 88)
  const { amount, suffix } = parsePriceParts(interviewer.priceLabel, interviewer.pricePerInterviewCents)
  const roleLine = interviewer.company
    ? `${interviewer.headline}${interviewer.headline.includes('@') ? '' : ` @ ${interviewer.company}`}`
    : interviewer.headline

  async function handleFavorite() {
    try {
      const result = await toggleFavorite(interviewer.userId).unwrap()
      setFavorited(result.favorited)
    } catch {
      /* keep prior state */
    }
  }

  return (
    <article className="group relative rounded-xl bg-[#161722]/80 border border-[#2d2e3e] p-5 hover:border-[#6366f1]/40 hover:shadow-lg hover:shadow-[#6366f1]/5 transition-all duration-200 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => void handleFavorite()}
        disabled={toggling}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#2d2e3e]/60 transition-colors disabled:opacity-50 z-10"
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          size={18}
          className={favorited ? 'text-red-400 fill-red-400' : 'text-[#5c5d72] group-hover:text-[#8b8ca8]'}
        />
      </button>

      <div className="flex flex-col xl:flex-row xl:items-stretch gap-4 pr-6">
        {/* Left: profile + meta + skills */}
        <div className="flex gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            <img
              src={imgSrc}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-[#2d2e3e] group-hover:border-[#6366f1]/40 transition-colors"
            />
            {interviewer.online && (
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161722]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-white text-base">{interviewer.name}</h3>
              <BadgeCheck size={15} className="text-[#818cf8] shrink-0" />
            </div>
            <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-1">{roleLine}</p>

            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#8b8ca8] mt-2">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-white font-semibold">{interviewer.rating.toFixed(1)}</span>
              </span>
              <span className="text-[#5c5d72]">·</span>
              <span>{interviewer.totalReviews} reviews</span>
              <span className="text-[#5c5d72]">·</span>
              <span>{interviewer.totalInterviews} interviews</span>
              <span className="text-[#5c5d72]">·</span>
              <span>{expYears(interviewer.experience)} yrs experience</span>
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {interviewer.skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#0b0c14]/80 text-[#a5b4fc] border border-[#2d2e3e]"
                >
                  {skill}
                </span>
              ))}
              {interviewer.skills.length > 6 && (
                <span className="text-[10px] text-[#5c5d72] self-center">+{interviewer.skills.length - 6}</span>
              )}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="hidden xl:block w-px bg-[#2d2e3e] self-stretch my-1" />

        {/* Right: price + actions */}
        <div className="flex xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-3 xl:w-[160px] shrink-0 xl:pl-2">
          <div className="text-right">
            <p className="text-2xl font-bold text-white leading-none">{amount}</p>
            <p className="text-xs text-[#8b8ca8] mt-0.5">{suffix}</p>
          </div>
          <div className="flex gap-2 w-full xl:w-auto xl:flex-col">
            <button
              type="button"
              onClick={() => onViewProfile(interviewer)}
              className="flex-1 xl:w-full px-4 py-2.5 rounded-lg border border-[#2d2e3e] text-[#9ca3af] text-xs font-semibold hover:text-white hover:border-[#5c5d72] transition-colors whitespace-nowrap"
            >
              View Profile
            </button>
            <button
              type="button"
              disabled={bookDisabled}
              onClick={() => onBookSlot(interviewer)}
              className="flex-1 xl:w-full px-4 py-2.5 rounded-lg dc-gradient-btn text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-md shadow-[#6366f1]/20"
            >
              {bookLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
