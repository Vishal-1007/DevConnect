import { useRef, useState } from 'react'
import { BarChart3, Code2, FileText, Image, Loader2, Paperclip, X } from 'lucide-react'
import { useCreatePostMutation } from '../../api/communityApi'
import { useGetMyProfileQuery } from '../../api/userApi'
import type { CommunityPostCode, CommunityPostUpload } from '../../api/types'
import { FEED_CATEGORIES } from '../../data/communityData'
import { avatarUrl } from '../../lib/avatar'
import { extractApiError } from '../../lib/extractApiError'
import {
  ATTACHMENT_ACCEPT,
  IMAGE_ACCEPT,
  uploadCommunityFile,
  validateAttachmentFile,
  validateImageFile,
} from '../../lib/communityUpload'
import { formatFileSize, resolveCommunityMediaUrl } from '../../lib/communityMedia'
import { useAppSelector } from '../../hooks'
import { CodeSnippetModal } from './CodeSnippetModal'
import { PollCreatorModal } from './PollCreatorModal'

interface FeedComposerProps {
  onPosted?: (title: string) => void
  onError?: (message: string) => void
}

export function FeedComposer({ onPosted, onError }: FeedComposerProps) {
  const { data: profile } = useGetMyProfileQuery()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [createPost, { isLoading: creating }] = useCreatePostMutation()

  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<CommunityPostUpload | null>(null)

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [uploadedAttachment, setUploadedAttachment] = useState<CommunityPostUpload | null>(null)

  const [codeSnippet, setCodeSnippet] = useState<CommunityPostCode | null>(null)
  const [pollDraft, setPollDraft] = useState<{ question: string; options: string[] } | null>(null)

  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [pollModalOpen, setPollModalOpen] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  const displayName = profile?.displayName ?? profile?.username ?? 'You'
  const isBusy = creating || submitting

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setUploadedImage(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function clearAttachment() {
    setAttachmentFile(null)
    setUploadedAttachment(null)
    if (attachmentInputRef.current) attachmentInputRef.current.value = ''
  }

  function handleImageSelect(file: File) {
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      onError?.(validationError)
      return
    }
    setError(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setUploadedImage(null)
  }

  function handleAttachmentSelect(file: File) {
    const validationError = validateAttachmentFile(file)
    if (validationError) {
      setError(validationError)
      onError?.(validationError)
      return
    }
    setError(null)
    setAttachmentFile(file)
    setUploadedAttachment(null)
  }

  function canSubmit() {
    return Boolean(
      content.trim()
      || imageFile
      || uploadedImage
      || attachmentFile
      || uploadedAttachment
      || codeSnippet
      || pollDraft,
    )
  }

  async function handleSubmit() {
    if (!canSubmit() || isBusy || !accessToken) return
    setError(null)
    setSubmitting(true)
    setUploadProgress(null)

    const tags = tagInput
      .split(/[,\s#]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 5)

    try {
      let imagePayload: { imageUrl?: string; imageFileId?: string } = {}
      if (imageFile && !uploadedImage) {
        setUploadProgress(0)
        const uploaded = await uploadCommunityFile(imageFile, 'image', accessToken, setUploadProgress)
        setUploadedImage(uploaded)
        imagePayload = { imageUrl: uploaded.url, imageFileId: uploaded.fileId }
      } else if (uploadedImage) {
        imagePayload = { imageUrl: uploadedImage.url, imageFileId: uploadedImage.fileId }
      }

      let attachmentPayload: Record<string, string | number | undefined> = {}
      if (attachmentFile && !uploadedAttachment) {
        setUploadProgress(0)
        const uploaded = await uploadCommunityFile(attachmentFile, 'attachment', accessToken, setUploadProgress)
        setUploadedAttachment(uploaded)
        attachmentPayload = {
          attachmentName: uploaded.name,
          attachmentUrl: uploaded.url,
          attachmentSize: uploaded.size,
          attachmentType: uploaded.type,
          attachmentFileId: uploaded.fileId,
        }
      } else if (uploadedAttachment) {
        attachmentPayload = {
          attachmentName: uploadedAttachment.name,
          attachmentUrl: uploadedAttachment.url,
          attachmentSize: uploadedAttachment.size,
          attachmentType: uploadedAttachment.type,
          attachmentFileId: uploadedAttachment.fileId,
        }
      }

      await createPost({
        content: content.trim() || undefined,
        category,
        tags: tags.length ? tags : undefined,
        ...imagePayload,
        ...attachmentPayload,
        code: codeSnippet ?? undefined,
        poll: pollDraft ?? undefined,
      }).unwrap()

      setContent('')
      setTagInput('')
      clearImage()
      clearAttachment()
      setCodeSnippet(null)
      setPollDraft(null)
      setUploadProgress(null)
      onPosted?.((content.trim() || pollDraft?.question || 'Post').slice(0, 48))
    } catch (err) {
      const message = extractApiError(err) || 'Something went wrong'
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-sm text-white focus:outline-none focus:border-[#6366f1]'

  return (
    <>
      <div className="dc-glass-card rounded-2xl p-5 hover:border-[#6366f1]/25 transition-colors">
        <div className="flex gap-3">
          <img src={avatarUrl(displayName, 48)} alt="" className="w-12 h-12 rounded-full shrink-0 ring-2 ring-[#6366f1]/20" />
          <div className="flex-1 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your knowledge or ask something…"
              rows={3}
              className={`${inputClass} resize-none placeholder:text-[#5c5d72]`}
            />

            {(imagePreview || uploadedImage) && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
                <img
                  src={imagePreview ?? resolveCommunityMediaUrl(uploadedImage?.url)}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{imageFile?.name ?? uploadedImage?.name}</p>
                  <p className="text-[10px] text-[#8b8ca8]">Image attached</p>
                </div>
                <button type="button" onClick={clearImage} className="text-[#8b8ca8] hover:text-red-400">
                  <X size={16} />
                </button>
              </div>
            )}

            {(attachmentFile || uploadedAttachment) && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
                <div className="w-10 h-10 rounded-lg bg-[#6366f1]/20 flex items-center justify-center">
                  <FileText size={18} className="text-[#818cf8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">
                    {attachmentFile?.name ?? uploadedAttachment?.name}
                  </p>
                  <p className="text-[10px] text-[#8b8ca8]">
                    {formatFileSize(attachmentFile?.size ?? uploadedAttachment?.size ?? 0)}
                  </p>
                </div>
                <button type="button" onClick={clearAttachment} className="text-[#8b8ca8] hover:text-red-400">
                  <X size={16} />
                </button>
              </div>
            )}

            {codeSnippet && (
              <div className="p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-[#818cf8] uppercase">
                    {codeSnippet.language}
                  </span>
                  <button type="button" onClick={() => setCodeSnippet(null)} className="text-[#8b8ca8] hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
                <pre className="text-[10px] text-emerald-200 font-mono whitespace-pre-wrap line-clamp-4">
                  {codeSnippet.content}
                </pre>
              </div>
            )}

            {pollDraft && (
              <div className="p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-white">{pollDraft.question}</p>
                  <button type="button" onClick={() => setPollDraft(null)} className="text-[#8b8ca8] hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
                <ul className="space-y-1">
                  {pollDraft.options.map((opt) => (
                    <li key={opt} className="text-[10px] text-[#8b8ca8]">○ {opt}</li>
                  ))}
                </ul>
              </div>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageSelect(file)
              }}
            />
            <input
              ref={attachmentInputRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAttachmentSelect(file)
              }}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white hover:border-[#6366f1]/40 transition-colors"
              >
                <Image size={14} />
                Image
              </button>
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white hover:border-[#6366f1]/40 transition-colors"
              >
                <Paperclip size={14} />
                Attachment
              </button>
              <button
                type="button"
                onClick={() => setCodeModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white hover:border-[#6366f1]/40 transition-colors"
              >
                <Code2 size={14} />
                Code
              </button>
              <button
                type="button"
                onClick={() => setPollModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white hover:border-[#6366f1]/40 transition-colors"
              >
                <BarChart3 size={14} />
                Poll
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} h-10 sm:w-44`}
                aria-label="Category"
              >
                {FEED_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags… #java #react"
                className={`${inputClass} h-10 flex-1`}
              />
            </div>

            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-[#2d2e3e] overflow-hidden">
                  <div
                    className="h-full dc-gradient-btn transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#8b8ca8]">Uploading… {uploadProgress}%</p>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!canSubmit() || isBusy}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {uploadProgress !== null ? 'Uploading…' : 'Posting…'}
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CodeSnippetModal
        open={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        onInsert={(language, snippet) => setCodeSnippet({ language, content: snippet })}
      />
      <PollCreatorModal
        open={pollModalOpen}
        onClose={() => setPollModalOpen(false)}
        onInsert={(question, options) => setPollDraft({ question, options })}
      />
    </>
  )
}
