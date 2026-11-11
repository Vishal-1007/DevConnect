import { useMemo, useState } from 'react'
import { Loader2, Send, Trash2 } from 'lucide-react'
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useListCommentsQuery,
} from '../../api/communityApi'
import type { CommunityComment } from '../../api/types'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'

interface CommentThreadProps {
  postId: string
  currentUserId?: string
}

interface CommentNode extends CommunityComment {
  replies: CommentNode[]
}

function buildTree(comments: CommunityComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>()
  const roots: CommentNode[] = []
  comments.forEach((c) => map.set(c.id, { ...c, replies: [] }))
  comments.forEach((c) => {
    const node = map.get(c.id)!
    if (c.parentCommentId && map.has(c.parentCommentId)) {
      map.get(c.parentCommentId)!.replies.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  depth,
}: {
  comment: CommentNode
  postId: string
  currentUserId?: string
  depth: number
}) {
  const [replying, setReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [addComment, { isLoading: adding }] = useAddCommentMutation()
  const [deleteComment, { isLoading: deleting }] = useDeleteCommentMutation()

  async function handleReply() {
    if (!replyDraft.trim() || adding) return
    await addComment({
      postId,
      content: replyDraft.trim(),
      parentCommentId: comment.id,
    })
    setReplyDraft('')
    setReplying(false)
  }

  async function handleDelete() {
    if (deleting) return
    await deleteComment({ postId, commentId: comment.id })
  }

  return (
    <div className={depth > 0 ? 'ml-6 mt-2 border-l border-[#2d2e3e]/60 pl-3' : ''}>
      <div className="flex gap-2">
        <img
          src={avatarUrl(comment.authorDisplayName, 28)}
          alt=""
          className="w-7 h-7 rounded-full shrink-0 mt-0.5"
        />
        <div className="flex-1 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {comment.authorDisplayName}
              </span>
              <span className="text-[10px] text-[#5c5d72] shrink-0">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            {comment.authorId === currentUserId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-[#5c5d72] hover:text-red-400"
                aria-label="Delete comment"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <p className="text-xs text-[#b4b5c8] mt-1 leading-relaxed">{comment.content}</p>
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="text-[10px] text-[#818cf8] mt-1.5 hover:text-white"
          >
            Reply
          </button>
        </div>
      </div>

      {replying && (
        <div className="flex gap-2 mt-2 ml-9">
          <input
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 h-8 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-xs text-white focus:outline-none focus:border-[#6366f1]"
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
          />
          <button
            type="button"
            disabled={!replyDraft.trim() || adding}
            onClick={handleReply}
            className="px-2.5 rounded-lg dc-gradient-btn text-white disabled:opacity-50"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      )}

      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          currentUserId={currentUserId}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export function CommentThread({ postId, currentUserId }: CommentThreadProps) {
  const [draft, setDraft] = useState('')
  const { data: comments, isFetching } = useListCommentsQuery(postId)
  const [addComment, { isLoading: adding }] = useAddCommentMutation()

  const tree = useMemo(() => buildTree(comments ?? []), [comments])

  async function handleAdd() {
    if (!draft.trim() || adding) return
    await addComment({ postId, content: draft.trim() })
    setDraft('')
  }

  return (
    <div className="mt-4 space-y-3">
      {isFetching && !comments && (
        <div className="flex items-center gap-2 text-xs text-[#8b8ca8]">
          <Loader2 size={14} className="animate-spin" />
          Loading comments…
        </div>
      )}

      {tree.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          currentUserId={currentUserId}
          depth={0}
        />
      ))}

      <div className="flex gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 h-9 px-3 rounded-xl bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white focus:outline-none focus:border-[#6366f1]"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          type="button"
          disabled={!draft.trim() || adding}
          onClick={handleAdd}
          className="px-3 rounded-xl dc-gradient-btn text-white disabled:opacity-50"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
