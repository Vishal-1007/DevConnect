import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Send,
} from 'lucide-react'
import {
  useAddReplyMutation,
  useGetDiscussionQuery,
  useListRepliesQuery,
  useMarkSolvedMutation,
} from '../../api/discussionsApi'
import type { DiscussionThread } from '../../api/types'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'
import { topicLabels } from '../../data/discussionsData'

interface DiscussionThreadPanelProps {
  thread: DiscussionThread
  currentUserId?: string
  onBack: () => void
}

export function DiscussionThreadPanel({ thread: initialThread, currentUserId, onBack }: DiscussionThreadPanelProps) {
  const [replyDraft, setReplyDraft] = useState('')
  const { data: thread = initialThread } = useGetDiscussionQuery(initialThread.id)
  const { data: replies, isLoading: loadingReplies } = useListRepliesQuery(thread.id)
  const [addReply, { isLoading: addingReply }] = useAddReplyMutation()
  const [markSolved, { isLoading: markingSolved }] = useMarkSolvedMutation()

  const isAuthor = currentUserId === thread.authorId
  const topicLabel = topicLabels[thread.topic] ?? thread.topic

  async function handleReply() {
    if (!replyDraft.trim() || addingReply) return
    await addReply({ threadId: thread.id, content: replyDraft.trim() })
    setReplyDraft('')
  }

  async function handleMarkSolved(replyId: string) {
    if (markingSolved || thread.solved) return
    await markSolved({ threadId: thread.id, replyId })
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#8b8ca8] hover:text-white transition-colors -ml-1"
      >
        <ArrowLeft size={16} />
        Back to discussions
      </button>

      <article className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {thread.solved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={12} />
              Solved
            </span>
          )}
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25">
            {topicLabel}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white">{thread.title}</h2>

        <div className="flex items-center gap-3 mt-3 mb-4">
          <img src={avatarUrl(thread.authorDisplayName, 36)} alt="" className="w-9 h-9 rounded-full" />
          <div>
            <p className="text-sm font-medium text-white">{thread.authorDisplayName}</p>
            <p className="text-xs text-[#8b8ca8]">
              {thread.authorRole ?? 'Developer'} · {formatRelativeTime(thread.createdAt)}
            </p>
          </div>
        </div>

        <p className="text-sm text-[#e2e8f0] leading-relaxed whitespace-pre-wrap">{thread.content}</p>

        {thread.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#0b0c14] text-[#8b8ca8] border border-[#2d2e3e]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquarePlus size={16} className="text-[#818cf8]" />
          {thread.replyCount} {thread.replyCount === 1 ? 'Reply' : 'Replies'}
        </h3>

        {loadingReplies && (
          <div className="flex items-center gap-2 text-xs text-[#8b8ca8] py-4">
            <Loader2 size={14} className="animate-spin" />
            Loading replies…
          </div>
        )}

        <div className="space-y-3 mb-4">
          {replies?.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-lg border p-4 ${
                reply.acceptedAnswer
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-[#2d2e3e] bg-[#0b0c14]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2 flex-1 min-w-0">
                  <img
                    src={avatarUrl(reply.authorDisplayName, 32)}
                    alt=""
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-white">{reply.authorDisplayName}</span>
                      <span className="text-[10px] text-[#5c5d72]">
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                      {reply.acceptedAnswer && (
                        <span className="text-[10px] text-emerald-400 font-medium">Accepted answer</span>
                      )}
                    </div>
                    <p className="text-sm text-[#b4b5c8] mt-1 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
                {isAuthor && !thread.solved && !reply.acceptedAnswer && (
                  <button
                    type="button"
                    disabled={markingSolved}
                    onClick={() => handleMarkSolved(reply.id)}
                    className="shrink-0 text-[10px] px-2 py-1 rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    Mark solved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-3 border-t border-[#2d2e3e]">
          <textarea
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder="Write your reply…"
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white placeholder:text-[#5c5d72] focus:outline-none focus:border-[#6366f1] resize-none"
          />
          <button
            type="button"
            disabled={!replyDraft.trim() || addingReply}
            onClick={handleReply}
            className="self-end px-3 py-2 rounded-lg dc-gradient-btn text-white disabled:opacity-50"
          >
            {addingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
