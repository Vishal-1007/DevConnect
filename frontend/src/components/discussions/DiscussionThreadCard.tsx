import { CheckCircle2, MessageSquare, Pin, User } from 'lucide-react'
import type { DiscussionThread } from '../../api/types'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'
import { topicLabels } from '../../data/discussionsData'

interface DiscussionThreadCardProps {
  thread: DiscussionThread
  active?: boolean
  onSelect: () => void
}

export function DiscussionThreadCard({ thread, active, onSelect }: DiscussionThreadCardProps) {
  const topicLabel = topicLabels[thread.topic] ?? thread.topic

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${
        active
          ? 'border-[#6366f1] bg-[#6366f1]/10'
          : thread.pinned
            ? 'border-amber-500/30 bg-[#161722] hover:border-amber-500/50'
            : 'border-[#2d2e3e] bg-[#161722] hover:border-[#6366f1]/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <img
          src={avatarUrl(thread.authorDisplayName, 40)}
          alt=""
          className="w-10 h-10 rounded-full shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {thread.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Pin size={10} />
                Pinned
              </span>
            )}
            {thread.solved && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={10} />
                Solved
              </span>
            )}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25">
              {topicLabel}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">{thread.title}</h3>
          <p className="text-xs text-[#8b8ca8] mt-1 line-clamp-2">{thread.content}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-[#5c5d72]">
            <span className="flex items-center gap-1">
              <User size={11} />
              {thread.authorDisplayName}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={11} />
              {thread.replyCount} replies
            </span>
            <span>{formatRelativeTime(thread.createdAt)}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
