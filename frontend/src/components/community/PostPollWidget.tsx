import { Loader2 } from 'lucide-react'
import { useVotePollMutation } from '../../api/communityApi'
import type { CommunityPostPoll } from '../../api/types'
import { extractApiError } from '../../lib/extractApiError'

interface PostPollWidgetProps {
  postId: string
  poll: CommunityPostPoll
}

export function PostPollWidget({ postId, poll }: PostPollWidgetProps) {
  const [votePoll, { isLoading, error }] = useVotePollMutation()
  const hasVoted = Boolean(poll.votedOptionId)

  async function handleVote(optionId: string) {
    if (hasVoted || isLoading) return
    await votePoll({ postId, optionId })
  }

  return (
    <div className="mt-3 p-4 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e]">
      <p className="text-sm font-semibold text-white mb-3">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((option) => {
          const selected = poll.votedOptionId === option.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={hasVoted || isLoading}
              onClick={() => handleVote(option.id)}
              className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                selected
                  ? 'border-[#6366f1]/60 bg-[#6366f1]/15'
                  : hasVoted
                    ? 'border-[#2d2e3e] bg-[#161722]/40 cursor-default'
                    : 'border-[#2d2e3e] hover:border-[#6366f1]/40 hover:bg-[#161722]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-white">{option.text}</span>
                {hasVoted && (
                  <span className="text-[10px] text-[#8b8ca8] shrink-0">{option.percentage}%</span>
                )}
              </div>
              {hasVoted && (
                <div className="h-1.5 rounded-full bg-[#2d2e3e] overflow-hidden">
                  <div
                    className="h-full rounded-full dc-gradient-btn transition-all duration-500"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-[#5c5d72] mt-3">
        {poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'}
        {isLoading && (
          <Loader2 size={12} className="inline ml-2 animate-spin text-[#818cf8]" />
        )}
      </p>
      {error && (
        <p className="text-[10px] text-red-300 mt-2">{extractApiError(error)}</p>
      )}
    </div>
  )
}
