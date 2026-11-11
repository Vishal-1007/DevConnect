import { useState } from 'react'
import {
  Bookmark,
  Download,
  FileText,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
} from 'lucide-react'
import {
  useLikePostMutation,
  useSavePostMutation,
  useUnlikePostMutation,
  useUnsavePostMutation,
} from '../../api/communityApi'
import type { CommunityPost } from '../../api/types'
import { CATEGORY_LABELS, developerBadge } from '../../data/communityData'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'
import { downloadCommunityFile, formatFileSize, resolveCommunityMediaUrl } from '../../lib/communityMedia'
import { useAppSelector } from '../../hooks'
import { useFollowedAuthors } from '../../lib/communityFollows'
import { CommentThread } from './CommentThread'
import { ImageLightbox } from './ImageLightbox'
import { PostCodeBlock } from './PostCodeBlock'
import { PostPollWidget } from './PostPollWidget'

interface FeedPostCardProps {
  post: CommunityPost
  isOwnPost: boolean
  currentUserId?: string
}

export function FeedPostCard({ post, isOwnPost, currentUserId }: FeedPostCardProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [showComments, setShowComments] = useState(false)
  const { isFollowing, toggleFollow } = useFollowedAuthors()
  const following = isFollowing(post.authorId)
  const [shareToast, setShareToast] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const [likePost, { isLoading: liking }] = useLikePostMutation()
  const [unlikePost, { isLoading: unliking }] = useUnlikePostMutation()
  const [savePost, { isLoading: saving }] = useSavePostMutation()
  const [unsavePost, { isLoading: unsaving }] = useUnsavePostMutation()

  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category
  const badge = developerBadge(post.likeCount * 2 + post.commentCount * 5 + 10)
  const togglingLike = liking || unliking
  const togglingSave = saving || unsaving
  const imageSrc = resolveCommunityMediaUrl(post.imageUrl)

  async function handleToggleLike() {
    if (togglingLike) return
    if (post.likedByMe) await unlikePost(post.id)
    else await likePost(post.id)
  }

  async function handleToggleSave() {
    if (togglingSave) return
    if (post.savedByMe) await unsavePost(post.id)
    else await savePost(post.id)
  }

  function handleShare() {
    const url = `${window.location.origin}/community?post=${post.id}`
    navigator.clipboard.writeText(url).catch(() => {})
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2000)
  }

  async function handleDownloadAttachment() {
    if (!post.attachment || !accessToken || downloading) return
    setDownloading(true)
    try {
      await downloadCommunityFile(post.attachment.url, accessToken, post.attachment.name)
    } catch {
      window.open(resolveCommunityMediaUrl(post.attachment.url), '_blank')
    } finally {
      setDownloading(false)
    }
  }

  const showTextContent = Boolean(
    post.content?.trim()
    && (!post.poll || post.content.trim() !== post.poll.question.trim()),
  )

  return (
    <>
      <article className="dc-glass-card rounded-2xl p-5 hover:border-[#6366f1]/30 hover:shadow-lg hover:shadow-[#6366f1]/5 transition-all duration-200">
        <div className="flex gap-3">
          <img
            src={avatarUrl(post.authorDisplayName, 48)}
            alt=""
            className="w-12 h-12 rounded-full shrink-0 ring-2 ring-[#2d2e3e]"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-white text-sm">{post.authorDisplayName}</span>
                  {isOwnPost && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6366f1]/20 text-[#a5b4fc]">You</span>
                  )}
                  <span className={`text-[10px] font-medium ${badge.color}`}>{badge.label}</span>
                </div>
                {post.authorRole && (
                  <p className="text-xs text-[#8b8ca8] mt-0.5 truncate">{post.authorRole}</p>
                )}
                <p className="text-[10px] text-[#5c5d72] mt-0.5">{formatRelativeTime(post.createdAt)}</p>
              </div>
              {!isOwnPost && (
                <button
                  type="button"
                  onClick={() => toggleFollow(post.authorId)}
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    following
                      ? 'border-[#6366f1]/50 text-[#a5b4fc] bg-[#6366f1]/10'
                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  <UserPlus size={12} />
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25">
              {categoryLabel}
            </span>

            {showTextContent && (
              <p className="text-sm text-[#e2e8f0] mt-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            )}

            {imageSrc && (
              <button
                type="button"
                onClick={() => setLightboxSrc(imageSrc)}
                className="mt-3 block w-full rounded-xl overflow-hidden border border-[#2d2e3e] hover:border-[#6366f1]/40 transition-colors"
              >
                <img
                  src={imageSrc}
                  alt="Post attachment"
                  className="w-full max-h-96 object-cover"
                />
              </button>
            )}

            {post.attachment && (
              <div className="mt-3 p-4 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#6366f1]/20 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[#818cf8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{post.attachment.name}</p>
                    <p className="text-[10px] text-[#8b8ca8] mt-0.5">
                      {formatFileSize(post.attachment.size)}
                    </p>
                    <button
                      type="button"
                      disabled={downloading}
                      onClick={handleDownloadAttachment}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#818cf8] hover:text-white"
                    >
                      <Download size={14} />
                      {downloading ? 'Downloading…' : 'Download Attachment'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {post.code && <PostCodeBlock code={post.code} />}

            {post.poll && <PostPollWidget postId={post.id} poll={post.poll} />}

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#0b0c14] text-[#818cf8] border border-[#6366f1]/20 hover:bg-[#6366f1]/10 cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2d2e3e]/80">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={togglingLike}
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    post.likedByMe ? 'text-rose-400' : 'text-[#8b8ca8] hover:text-rose-400'
                  }`}
                >
                  <Heart size={16} className={post.likedByMe ? 'fill-current' : undefined} />
                  {post.likeCount}
                </button>
                <button
                  type="button"
                  onClick={() => setShowComments((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#8b8ca8] hover:text-[#818cf8] transition-colors"
                >
                  <MessageCircle size={16} />
                  {post.commentCount}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#8b8ca8] hover:text-[#818cf8] transition-colors"
                >
                  <Share2 size={16} />
                  Share
                </button>
              </div>
              <button
                type="button"
                disabled={togglingSave}
                onClick={handleToggleSave}
                className={`p-1.5 rounded-lg transition-colors ${
                  post.savedByMe ? 'text-[#818cf8]' : 'text-[#8b8ca8] hover:text-[#818cf8]'
                }`}
                aria-label={post.savedByMe ? 'Unsave post' : 'Save post'}
              >
                <Bookmark size={16} className={post.savedByMe ? 'fill-current' : undefined} />
              </button>
            </div>

            {shareToast && (
              <p className="text-[10px] text-emerald-400 mt-2">Link copied to clipboard</p>
            )}

            {showComments && (
              <CommentThread postId={post.id} currentUserId={currentUserId} />
            )}
          </div>
        </div>
      </article>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  )
}
