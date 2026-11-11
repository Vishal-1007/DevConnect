import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Crown, Loader2, Plus, Search, Video, X } from 'lucide-react'
import {
  useCreateVideoRoomMutation,
  useGetVideoRoomUsageQuery,
  useLazyCheckVideoRoomLimitQuery,
  useListVideoRoomsQuery,
} from '../api/videoRoomsApi'
import { VideoRoomCard } from '../components/video-rooms/VideoRoomCard'
import { VideoRoomDetailPanel } from '../components/video-rooms/VideoRoomDetailPanel'
import { VideoRoomUpgradeModal } from '../components/video-rooms/VideoRoomUpgradeModal'
import { VIDEO_ROOM_CATEGORIES } from '../data/videoRoomsData'
import { extractApiError } from '../lib/extractApiError'
import type { VideoRoom } from '../api/types'
import { useVideoRoomLobbySync } from '../hooks/useVideoRoomLobbySync'

function formatCooldown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Available now'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}

export function VideoRoomsPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [createdRoom, setCreatedRoom] = useState<VideoRoom | null>(null)
  const [copied, setCopied] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [tagInput, setTagInput] = useState('')

  const { data: usage } = useGetVideoRoomUsageQuery(undefined, {
    pollingInterval: 15_000,
    refetchOnMountOrArgChange: true,
  })
  const { data: rooms, isLoading, isFetching, error } = useListVideoRoomsQuery(
    {
      status: 'live',
      category,
      q: searchQuery || undefined,
    },
    {
      pollingInterval: 10_000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  )
  useVideoRoomLobbySync()

  const [freeSecondsLeft, setFreeSecondsLeft] = useState<number | null>(null)
  useEffect(() => {
    if (usage?.activeFreeRoomRemainingSeconds != null) {
      setFreeSecondsLeft(usage.activeFreeRoomRemainingSeconds)
    } else {
      setFreeSecondsLeft(null)
    }
  }, [usage?.activeFreeRoomRemainingSeconds])

  useEffect(() => {
    if (freeSecondsLeft == null || freeSecondsLeft <= 0) return
    const id = window.setInterval(() => {
      setFreeSecondsLeft((prev) => (prev != null && prev > 0 ? prev - 1 : prev))
    }, 1000)
    return () => window.clearInterval(id)
  }, [freeSecondsLeft])
  const [createRoom, { isLoading: creating }] = useCreateVideoRoomMutation()
  const [checkLimit] = useLazyCheckVideoRoomLimitQuery()

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 4000)
  }

  const isPremium = usage?.videoRoomPremium ?? false
  const freeMax = usage?.freeMaxParticipants ?? 6

  const selectedRoom = useMemo(
    () => rooms?.find((r) => r.id === selectedId) ?? rooms?.[0] ?? null,
    [rooms, selectedId]
  )

  const stats = useMemo(() => {
    if (!rooms) return { total: 0, joined: 0, open: 0, mine: 0 }
    return {
      total: rooms.length,
      joined: rooms.filter((r) => r.joinedByMe).length,
      open: rooms.filter((r) => !r.full).length,
      mine: rooms.filter((r) => r.hostId).length,
    }
  }, [rooms])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return

    const errors: Record<string, string> = {}
    if (!title.trim()) errors.title = 'Please enter room title'
    if (!description.trim()) errors.description = 'Please enter a description'
    if (!newCategory.trim()) errors.category = 'Please select a category'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setCreateError(null)

    if (!isPremium) {
      try {
        const limit = await checkLimit().unwrap()
        if (!limit.allowed) {
          const msg =
            limit.message ||
            "You already used today's free room. Upgrade for ₹50 unlimited access."
          setCreateError(msg)
          showToast(msg)
          setShowUpgrade(true)
          return
        }
      } catch {
        if (usage && !usage.canCreateFreeRoom) {
          const msg =
            "You already used today's free room. Upgrade for ₹50 unlimited access."
          setCreateError(msg)
          showToast(msg)
          setShowUpgrade(true)
          return
        }
      }
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: newCategory,
      maxParticipants: isPremium ? 50 : freeMax,
      tags: tags.length ? tags : undefined,
    }

    console.log('Creating room', payload)

    try {
      const created = await createRoom(payload).unwrap()
      console.log('Room created', created)

      setCreatedRoom(created)
      setShowCreate(false)
      setSelectedId(created.id)
      setTitle('')
      setDescription('')
      setTagInput('')
      setFieldErrors({})
      showToast('Room created — joining live session…')
      navigate(`/video-rooms/${created.id}`)
    } catch (err) {
      const msg = extractApiError(err) || 'Unable to create room'
      console.error('Room creation failed', err)
      setCreateError(msg)
      showToast(msg)
      if (msg.includes('Upgrade') || msg.includes('free meeting') || msg.includes('free room')) {
        setShowUpgrade(true)
      }
    }
  }

  async function copyMeetingLink() {
    const link = createdRoom?.joinUrl
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {toast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-xl bg-[#161722] border border-[#6366f1]/40 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      {showUpgrade && (
        <VideoRoomUpgradeModal
          usage={usage}
          title={
            usage?.canCreateFreeRoom === false
              ? 'Free meeting limit reached'
              : 'Upgrade to Video Room Pro'
          }
          subtitle={
            usage?.canCreateFreeRoom === false
              ? 'You have already used your free meeting today. Upgrade for ₹50.'
              : 'Unlock unlimited duration, participants, and room creation.'
          }
          onClose={() => setShowUpgrade(false)}
          onPurchased={() => setShowUpgrade(false)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-[#818cf8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Video Rooms</h1>
            <p className="text-sm text-[#8b8ca8] mt-1 max-w-xl">
              Live developer discussions, study rooms, and mentor sessions — not recorded courses.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isPremium && (
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#6366f1]/40 text-[#a5b4fc] text-sm font-semibold hover:bg-[#6366f1]/10"
            >
              <Crown size={16} />
              Pro ₹{usage?.premiumPriceInr ?? 50}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v)
              setCreatedRoom(null)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold hover:opacity-90"
          >
            {showCreate ? <X size={16} /> : <Plus size={16} />}
            {showCreate ? 'Cancel' : 'Go live'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Live rooms', value: stats.total },
          { label: 'You joined', value: stats.joined },
          { label: 'Open spots', value: stats.open },
          {
            label: isPremium ? 'Plan' : 'Free limit',
            value: isPremium ? 'Pro' : usage?.canCreateFreeRoom ? '1/day' : 'Used',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-[#161722] border border-[#2d2e3e] px-4 py-3"
          >
            <p className="text-xs text-[#8b8ca8]">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {!isPremium && usage && (
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#8b8ca8]">Free room rules</p>
            <ul className="mt-2 space-y-1 text-[#b4b5c8] text-xs">
              <li>Max {usage.freeMaxParticipants} participants</li>
              <li>{usage.freeDurationMinutes} minutes duration</li>
              <li>1 free room every 24 hours</li>
            </ul>
          </div>
          <div>
            <p className="text-xs text-[#8b8ca8]">Next free room</p>
            <p className="text-white font-semibold mt-2">
              {usage.canCreateFreeRoom
                ? 'Available now'
                : usage.nextFreeRoomAvailableAt
                  ? formatCooldown(usage.nextFreeRoomAvailableAt)
                  : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#8b8ca8]">Active free session</p>
            <p className="text-white font-semibold mt-2">
              {freeSecondsLeft != null && freeSecondsLeft > 0
                ? `${Math.floor(freeSecondsLeft / 60)}:${String(freeSecondsLeft % 60).padStart(2, '0')} left`
                : 'None'}
            </p>
          </div>
        </div>
      )}

      {createdRoom?.joinUrl && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 mb-6">
          <p className="text-sm font-semibold text-emerald-300">Meeting created successfully</p>
          <p className="text-xs text-[#b4b5c8] mt-2 break-all">{createdRoom.joinUrl}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={copyMeetingLink}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2d2e3e] text-xs text-white hover:bg-[#6366f1]/30"
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            {createdRoom.freeTierRoom && (
              <span className="text-xs text-amber-300 self-center">
                Free room · {usage?.freeDurationMinutes ?? 30} min limit
              </span>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-[#161722] border border-[#6366f1]/30 p-5 mb-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-white">Create new room</h2>
          {createError && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}
          {!isPremium && (
            <div className="rounded-lg bg-[#0b0c14] border border-[#2d2e3e] px-3 py-2 text-xs text-[#8b8ca8]">
              Free plan: max {freeMax} participants · {usage?.freeDurationMinutes ?? 30} min · 1 room / 24h
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8b8ca8] mb-1 block">Room title</label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }))
                }}
                placeholder="e.g. Spring Boot Security Discussion"
                maxLength={200}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-300 mt-1">{fieldErrors.title}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-[#8b8ca8] mb-1 block">Category</label>
              <select
                className={inputClass}
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value)
                  if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: '' }))
                }}
              >
                {VIDEO_ROOM_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8b8ca8] mb-1 block">Description</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }))
              }}
              placeholder="What will you discuss in this room?"
              maxLength={1000}
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-300 mt-1">{fieldErrors.description}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-[#8b8ca8] mb-1 block">Tags (comma-separated)</label>
            <input
              className={inputClass}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="backend, spring, security"
            />
          </div>
          {!isPremium && usage && !usage.canCreateFreeRoom && (
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Free limit used. Next free room in{' '}
              {usage.nextFreeRoomAvailableAt
                ? formatCooldown(usage.nextFreeRoomAvailableAt)
                : '24 hours'}
              . Upgrade for ₹{usage.premiumPriceInr ?? 50} for unlimited access.
            </p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="dc-gradient-btn px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Going live…' : 'Go live'}
          </button>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5d72]" />
          <input
            className={`${inputClass} pl-9`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search rooms by title or topic…"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg border border-[#2d2e3e] text-sm text-[#b4b5c8] hover:border-[#6366f1]/40 hover:text-white transition-colors"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {VIDEO_ROOM_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              category === cat.id
                ? 'border-[#6366f1] bg-[#6366f1]/15 text-[#a5b4fc]'
                : 'border-[#2d2e3e] text-[#8b8ca8] hover:border-[#6366f1]/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {extractApiError(error)}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            {isFetching && !isLoading && (
              <p className="text-xs text-[#8b8ca8] flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Refreshing…
              </p>
            )}
            {rooms?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2d2e3e] p-12 text-center">
                <Video className="w-10 h-10 text-[#5c5d72] mx-auto mb-3" />
                <p className="text-white font-medium">No live rooms right now</p>
                <p className="text-sm text-[#8b8ca8] mt-1">Be the first to start one.</p>
              </div>
            ) : (
              rooms?.map((room) => (
                <VideoRoomCard
                  key={room.id}
                  room={room}
                  active={selectedRoom?.id === room.id}
                  onSelect={() => setSelectedId(room.id)}
                />
              ))
            )}
          </div>
          <div className="lg:col-span-2">
            {selectedRoom ? (
              <VideoRoomDetailPanel room={selectedRoom} />
            ) : (
              <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-8 text-center text-[#8b8ca8] text-sm">
                Select a room to view details and join.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
