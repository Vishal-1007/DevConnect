import { useEffect, useRef, useState } from 'react'
import { Film, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { validateVideoFile } from '../../lib/streamUpload'

interface StreamLessonUploadFieldProps {
  videoFile: File | null
  thumbnailFile: File | null
  uploadProgress?: number
  uploading?: boolean
  error?: string | null
  onVideoChange: (file: File | null) => void
  onThumbnailChange: (file: File | null) => void
}

export function StreamLessonUploadField({
  videoFile,
  thumbnailFile,
  uploadProgress,
  uploading,
  error,
  onVideoChange,
  onThumbnailChange,
}: StreamLessonUploadFieldProps) {
  const [dragActive, setDragActive] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!videoFile) {
      setVideoPreview(null)
      return
    }
    const url = URL.createObjectURL(videoFile)
    setVideoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbPreview(null)
      return
    }
    const url = URL.createObjectURL(thumbnailFile)
    setThumbPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [thumbnailFile])

  function handleVideo(file: File | null) {
    if (!file) {
      onVideoChange(null)
      return
    }
    const validation = validateVideoFile(file)
    if (validation) {
      setLocalError(validation)
      return
    }
    setLocalError(null)
    onVideoChange(file)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleVideo(e.dataTransfer.files?.[0] ?? null)
        }}
        className={`rounded-xl border border-dashed p-4 transition-colors ${
          dragActive ? 'border-violet-400 bg-violet-500/10' : 'border-[#2d2e3e] bg-[#12131c]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Film size={14} className="text-violet-400" /> Lesson video
            </p>
            <p className="text-[10px] text-[#8b8ca8] mt-0.5">Drag & drop or browse · MP4, WEBM, MOV · max 500MB</p>
            {videoFile && <p className="text-[10px] text-violet-300 mt-1 truncate">{videoFile.name}</p>}
          </div>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-600/15 px-3 py-1.5 text-[11px] font-semibold text-violet-200 hover:bg-violet-600/25"
          >
            <Upload size={12} /> Upload video
          </button>
        </div>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="hidden"
          onChange={(e) => handleVideo(e.target.files?.[0] ?? null)}
        />
        {uploading && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-[#1e1f2e] overflow-hidden">
              <div className="h-full bg-violet-500 transition-all" style={{ width: `${uploadProgress ?? 0}%` }} />
            </div>
            <p className="text-[10px] text-[#8b8ca8] mt-1 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Uploading {uploadProgress ?? 0}%
            </p>
          </div>
        )}
        {videoPreview && !uploading && (
          <video src={videoPreview} controls className="mt-3 w-full max-h-40 rounded-lg bg-black" />
        )}
      </div>

      <div className="rounded-xl border border-[#2d2e3e] bg-[#12131c] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ImageIcon size={14} className="text-emerald-400" /> Thumbnail (optional)
            </p>
            {thumbnailFile && <p className="text-[10px] text-[#8b8ca8] mt-0.5 truncate">{thumbnailFile.name}</p>}
          </div>
          <label className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#2d2e3e] px-3 py-1.5 text-[11px] font-semibold text-[#8b8ca8] hover:text-white cursor-pointer">
            <Upload size={12} /> Upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onThumbnailChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {thumbnailFile && (
            <button type="button" onClick={() => onThumbnailChange(null)} className="text-[#5c5d72] hover:text-red-400">
              <X size={14} />
            </button>
          )}
        </div>
        {thumbPreview && <img src={thumbPreview} alt="" className="mt-3 h-20 w-full rounded-lg object-cover" />}
      </div>

      {(error || localError) && <p className="text-[10px] text-red-400">{error || localError}</p>}
    </div>
  )
}
