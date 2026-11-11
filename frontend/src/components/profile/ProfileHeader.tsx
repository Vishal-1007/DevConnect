import { useRef, useState } from 'react'
import { Camera, MapPin, Pencil, Trophy } from 'lucide-react'
import { avatarUrl } from '../../lib/avatar'

type Props = {
  name: string
  title: string
  location: string
  openToWork: boolean
  devScore: number
  rank: string
  completion: number
  photoUrl: string | null
  onPhotoChange: (dataUrl: string) => void
}

function isImageFile(file: File) {
  if (file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name)
}

export function ProfileHeader({
  name,
  title,
  location,
  openToWork,
  devScore,
  rank,
  completion,
  photoUrl,
  onPhotoChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const displayPhoto = photoUrl ?? avatarUrl(name, 96)

  function openPicker() {
    setPhotoError(null)
    fileRef.current?.click()
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!isImageFile(file)) {
      setPhotoError('Please choose a JPG, PNG, GIF, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be smaller than 5 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onPhotoChange(reader.result)
        setPhotoError(null)
      }
    }
    reader.onerror = () => setPhotoError('Could not read the image. Try another file.')
    reader.readAsDataURL(file)

    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722]/80 backdrop-blur-md">
      <div className="h-24 bg-gradient-to-r from-[#6366f1]/30 via-[#a855f7]/20 to-transparent" />
      <div className="relative px-5 pb-5">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative shrink-0">
              <img
                key={displayPhoto}
                src={displayPhoto}
                alt={name}
                className="h-24 w-24 rounded-2xl border-4 border-[#161722] object-cover ring-2 ring-[#6366f1]/40"
              />
              <button
                type="button"
                onClick={openPicker}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#2d2e3e] bg-[#6366f1] text-white shadow-lg hover:bg-[#5558e3]"
                title="Change photo"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
            <div className="min-w-0 pb-1">
              <h2 className="truncate text-xl font-bold text-white">{name || 'Your Name'}</h2>
              <p className="text-sm text-violet-300">{title || 'Professional Title'}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-[#8b8ca8]">
                <MapPin size={12} />
                {location || 'Add location'}
              </p>
              {openToWork && (
                <span className="mt-2 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  Open to Work
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:justify-end">
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">DevScore</p>
              <p className="text-2xl font-bold text-violet-200">{devScore}</p>
            </div>
            <div className="rounded-xl border border-[#2d2e3e] bg-white/5 px-4 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">Rank</p>
              <p className="flex items-center gap-1 text-xs font-semibold text-amber-300">
                <Trophy size={12} />
                {rank}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-[#8b8ca8]">Profile Completion</span>
            <span className="font-semibold text-violet-300">{completion}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#2d2e3e]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={openPicker}
          className="mt-3 flex items-center gap-1.5 text-xs text-[#8b8ca8] hover:text-violet-300"
        >
          <Pencil size={12} />
          Edit profile photo
        </button>
        {photoError && (
          <p className="mt-1 text-xs text-red-400">{photoError}</p>
        )}
      </div>
    </div>
  )
}
