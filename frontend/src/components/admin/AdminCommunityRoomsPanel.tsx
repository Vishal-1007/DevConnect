import { useMemo, useState } from 'react'
import {
  Video,
  RefreshCw,
  Search,
  Loader2,
  Star,
  Eye,
  EyeOff,
  Lock,
  Users2,
  Settings2,
  Plus,
  FolderOpen,
  Shield,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import {
  useListAdminCommunityRoomsQuery,
  useListFeaturedCommunityRoomsQuery,
  useGetCommunityRoomAnalyticsQuery,
  useListCommunityCategoriesQuery,
  useUpdateAdminCommunityRoomMutation,
  useClearCommunityRoomModeratorMutation,
  useCreateCommunityCategoryMutation,
  useUpdateCommunityCategoryMutation,
  useDeleteCommunityCategoryMutation,
  VISIBILITY_COLORS,
  type AdminCommunityRoom,
  type CommunityRoomCategory,
  type CommunityRoomAnalytics,
} from '../../api/adminCommunityRoomsApi'
import { useListUsersQuery } from '../../api/adminApi'
import { extractApiError } from '../../lib/extractApiError'

const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2']
const avatarColor = (s: string) => PALETTE[s.charCodeAt(0) % PALETTE.length]

function Av({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-400',
    red: 'bg-red-500/15 text-red-400',
    amber: 'bg-amber-500/15 text-amber-400',
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-violet-500/15 text-violet-400',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>
      {children}
    </span>
  )
}

function AlertBanner({ type, message, onDismiss }: { type: 'error' | 'success'; message: string; onDismiss?: () => void }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-xs ${
        type === 'error'
          ? 'bg-red-500/10 border border-red-500/30 text-red-300'
          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
      }`}
    >
      <p>{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-[#8b8ca8] hover:text-white shrink-0">
          ✕
        </button>
      )}
    </div>
  )
}

type PanelTab = 'rooms' | 'categories'
type StatusFilter = 'all' | 'live' | 'ended'
type VisibilityFilter = 'all' | 'public' | 'unlisted' | 'private'

function RoomManageModal({
  room,
  categories,
  users,
  onClose,
  onDone,
}: {
  room: AdminCommunityRoom
  categories: CommunityRoomCategory[]
  users: { id: string; username: string }[]
  onClose: () => void
  onDone: (type: 'success' | 'error', msg: string) => void
}) {
  const [featured, setFeatured] = useState(room.featured)
  const [featuredOrder, setFeaturedOrder] = useState(room.featuredOrder)
  const [visibility, setVisibility] = useState(room.visibility)
  const [category, setCategory] = useState(room.category)
  const [moderatorId, setModeratorId] = useState(room.moderatorId ?? '')
  const [modalError, setModalError] = useState<string | null>(null)
  const [update, { isLoading }] = useUpdateAdminCommunityRoomMutation()
  const [clearMod, { isLoading: clearing }] = useClearCommunityRoomModeratorMutation()

  async function save() {
    setModalError(null)
    try {
      await update({
        id: room.id,
        featured,
        featuredOrder,
        visibility,
        category,
        moderatorId: moderatorId || undefined,
      }).unwrap()
      onDone('success', `Updated ${room.title}`)
      onClose()
    } catch (err) {
      const msg = extractApiError(err)
      setModalError(msg)
      onDone('error', msg)
    }
  }

  async function removeModerator() {
    setModalError(null)
    try {
      await clearMod(room.id).unwrap()
      setModeratorId('')
      onDone('success', 'Moderator removed')
    } catch (err) {
      setModalError(extractApiError(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#2d2e3e] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">{room.title}</h3>
            <p className="text-xs text-[#8b8ca8] mt-0.5">Community room settings</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          {modalError && <AlertBanner type="error" message={modalError} onDismiss={() => setModalError(null)} />}

          <label className="flex items-center justify-between p-3 rounded-lg bg-[#12131c] border border-[#2d2e3e] cursor-pointer">
            <span className="flex items-center gap-2 text-xs text-white">
              <Star size={14} className={featured ? 'text-amber-400 fill-amber-400' : 'text-[#5c5d72]'} />
              Featured on homepage
            </span>
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-violet-500" />
          </label>

          {featured && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#5c5d72] font-semibold">Featured order</label>
              <input
                type="number"
                min={0}
                value={featuredOrder}
                onChange={(e) => setFeaturedOrder(Number(e.target.value))}
                className="mt-1 w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#5c5d72] font-semibold">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="mt-1 w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="public">Public — listed for all developers</option>
              <option value="unlisted">Unlisted — join via direct link only</option>
              <option value="private">Private — invite / moderator approval</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#5c5d72] font-semibold">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white"
            >
              {categories.filter((c) => c.active).map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.label}
                </option>
              ))}
              {!categories.some((c) => c.slug === category) && (
                <option value={category}>{room.categoryLabel}</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#5c5d72] font-semibold">Assigned moderator</label>
            <select
              value={moderatorId}
              onChange={(e) => setModeratorId(e.target.value)}
              className="mt-1 w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">— No moderator —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  @{u.username}
                </option>
              ))}
            </select>
            {room.moderatorId && (
              <button
                type="button"
                disabled={clearing}
                onClick={removeModerator}
                className="mt-2 text-[10px] text-red-300 hover:text-red-200"
              >
                Remove current moderator
              </button>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#12131c] border border-[#2d2e3e] text-xs text-[#8b8ca8] space-y-1">
            <p>
              <span className="text-[#5c5d72]">Host:</span> {room.hostDisplayName}
            </p>
            <p>
              <span className="text-[#5c5d72]">Participants:</span> {room.participantCount}/{room.maxParticipants}
            </p>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={save}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CategoryFormModal({
  initial,
  onClose,
  onDone,
}: {
  initial?: CommunityRoomCategory
  onClose: () => void
  onDone: (type: 'success' | 'error', msg: string) => void
}) {
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [displayOrder, setDisplayOrder] = useState(initial?.displayOrder ?? 0)
  const [active, setActive] = useState(initial?.active ?? true)
  const [create, { isLoading: creating }] = useCreateCommunityCategoryMutation()
  const [update, { isLoading: updating }] = useUpdateCommunityCategoryMutation()

  async function save() {
    try {
      if (initial) {
        await update({ id: initial.id, slug, label, description: description || undefined, displayOrder, active }).unwrap()
        onDone('success', 'Category updated')
      } else {
        await create({ slug, label, description: description || undefined, displayOrder, active }).unwrap()
        onDone('success', 'Category created')
      }
      onClose()
    } catch (err) {
      onDone('error', extractApiError(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-[#2d2e3e] flex justify-between">
          <h3 className="font-bold text-white">{initial ? 'Edit category' : 'New category'}</h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-3">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug (e.g. java)"
            disabled={!!initial}
            className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Display label"
            className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none"
          />
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white"
          />
          <label className="flex items-center gap-2 text-xs text-white">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-violet-500" />
            Active in filters
          </label>
          <button
            type="button"
            disabled={creating || updating || !slug.trim() || !label.trim()}
            onClick={save}
            className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {initial ? 'Update' : 'Create'} category
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminCommunityRoomsPanel() {
  const [panelTab, setPanelTab] = useState<PanelTab>('rooms')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('live')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const [search, setSearch] = useState('')
  const [editRoom, setEditRoom] = useState<AdminCommunityRoom | null>(null)
  const [editCategory, setEditCategory] = useState<CommunityRoomCategory | null | 'new'>(null)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const { data: rooms = [], isLoading, isFetching, refetch } = useListAdminCommunityRoomsQuery({
    status: statusFilter,
    category: categoryFilter,
    visibility: visibilityFilter,
    q: search,
  })
  const { data: featured = [] } = useListFeaturedCommunityRoomsQuery({ status: 'live' })
  const { data: analytics } = useGetCommunityRoomAnalyticsQuery()
  const { data: categories = [] } = useListCommunityCategoriesQuery()
  const { data: users = [] } = useListUsersQuery()
  const [updateRoom] = useUpdateAdminCommunityRoomMutation()
  const [deleteCategory] = useDeleteCommunityCategoryMutation()

  const stats: CommunityRoomAnalytics = analytics ?? {
    totalRooms: rooms.length,
    liveRooms: rooms.filter((r) => r.status === 'live').length,
    featuredCount: featured.length,
    publicCount: 0,
    unlistedCount: 0,
    privateCount: 0,
    withModeratorCount: 0,
    roomsByCategory: {},
  }

  const categoryOptions = useMemo(
    () => ['all', ...categories.filter((c) => c.active).map((c) => c.slug)],
    [categories]
  )

  async function toggleFeatured(room: AdminCommunityRoom) {
    try {
      await updateRoom({
        id: room.id,
        featured: !room.featured,
        featuredOrder: !room.featured ? Math.max(1, featured.length + 1) : 0,
      }).unwrap()
      setBanner({ type: 'success', message: room.featured ? 'Removed from featured' : 'Added to featured' })
      refetch()
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    }
  }

  async function bumpFeaturedOrder(room: AdminCommunityRoom, delta: number) {
    try {
      await updateRoom({
        id: room.id,
        featuredOrder: Math.max(0, room.featuredOrder + delta),
        featured: true,
      }).unwrap()
      refetch()
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Video size={20} className="text-violet-400" />
            Community Rooms
          </h2>
          <p className="text-xs text-[#8b8ca8] mt-1">
            Manage public developer communities — featured rooms, visibility, categories & moderators
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {banner && (
        <div className="mb-4">
          <AlertBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { l: 'Total rooms', v: stats.totalRooms, c: 'gray' },
          { l: 'Live now', v: stats.liveRooms, c: 'green' },
          { l: 'Featured', v: stats.featuredCount, c: 'amber' },
          { l: 'With moderator', v: stats.withModeratorCount, c: 'blue' },
          { l: 'Categories', v: categories.length, c: 'purple' },
        ].map((s) => (
          <div key={s.l} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{s.v}</p>
            <Pill color={s.c}>{s.l}</Pill>
          </div>
        ))}
      </div>

      {featured.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-bold text-white">Featured rooms</h3>
            <span className="text-[10px] text-[#5c5d72]">Shown prominently to developers</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {featured.map((room) => (
              <div
                key={room.id}
                className="min-w-[220px] shrink-0 bg-gradient-to-br from-violet-600/20 to-[#161722] border border-violet-500/30 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-white line-clamp-1">{room.title}</p>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      title="Move up"
                      onClick={() => bumpFeaturedOrder(room, -1)}
                      className="text-[#5c5d72] hover:text-white"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      onClick={() => bumpFeaturedOrder(room, 1)}
                      className="text-[#5c5d72] hover:text-white"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
                <Pill color="purple">{room.categoryLabel}</Pill>
                <p className="text-[10px] text-[#8b8ca8] mt-2 line-clamp-2">{room.description}</p>
                <div className="flex gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => setEditRoom(room)}
                    className="flex-1 py-1.5 rounded-lg bg-[#2d2e3e] text-[10px] text-white font-semibold hover:bg-[#3d3e52]"
                  >
                    Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(room)}
                    className="px-2 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 text-[10px]"
                    title="Unfeature"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setPanelTab('rooms')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            panelTab === 'rooms'
              ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
              : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8]'
          }`}
        >
          All rooms
        </button>
        <button
          type="button"
          onClick={() => setPanelTab('categories')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
            panelTab === 'categories'
              ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
              : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8]'
          }`}
        >
          <FolderOpen size={12} /> Categories
        </button>
        {panelTab === 'categories' && (
          <button
            type="button"
            onClick={() => setEditCategory('new')}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
          >
            <Plus size={12} /> Add category
          </button>
        )}
      </div>

      {panelTab === 'categories' ? (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                {['Label', 'Slug', 'Order', 'Rooms', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1d2a]">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-[#1c1d2a]/50">
                  <td className="px-4 py-3 text-sm text-white font-medium">{c.label}</td>
                  <td className="px-4 py-3 text-xs font-mono text-[#5c5d72]">{c.slug}</td>
                  <td className="px-4 py-3 text-xs text-[#8b8ca8]">{c.displayOrder}</td>
                  <td className="px-4 py-3 text-xs text-[#8b8ca8]">{c.roomCount}</td>
                  <td className="px-4 py-3">
                    <Pill color={c.active ? 'green' : 'gray'}>{c.active ? 'Active' : 'Hidden'}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditCategory(c)}
                      className="text-[10px] text-violet-300 hover:text-white mr-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={c.roomCount > 0}
                      onClick={async () => {
                        try {
                          await deleteCategory(c.id).unwrap()
                          setBanner({ type: 'success', message: 'Category deleted' })
                        } catch (err) {
                          setBanner({ type: 'error', message: extractApiError(err) })
                        }
                      }}
                      className="text-[10px] text-red-300 hover:text-white disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(['all', 'live', 'ended'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  statusFilter === s
                    ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                    : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8]'
                }`}
              >
                {s}
              </button>
            ))}
            <div className="w-px h-6 bg-[#2d2e3e] mx-1" />
            {categoryOptions.slice(0, 8).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  categoryFilter === c
                    ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                    : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8]'
                }`}
              >
                {c === 'all' ? 'All categories' : c.replace('-', ' ')}
              </button>
            ))}
            <div className="w-px h-6 bg-[#2d2e3e] mx-1" />
            {(['all', 'public', 'unlisted', 'private'] as VisibilityFilter[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibilityFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  visibilityFilter === v
                    ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                    : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="relative mb-4 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms…"
              className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#818cf8]"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-violet-400" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-12 text-center">
              <Video size={40} className="mx-auto text-[#2d2e3e] mb-3" />
              <p className="text-sm font-semibold text-white">No community rooms</p>
              <p className="text-xs text-[#5c5d72] mt-2">Restart user-service with local profile to seed demo rooms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`bg-[#161722] border rounded-xl p-4 transition-colors ${
                    room.featured ? 'border-amber-500/40' : 'border-[#2d2e3e] hover:border-[#3d3e52]'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                      <Video size={16} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">{room.title}</p>
                        {room.status === 'live' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        )}
                        {room.featured && (
                          <Pill color="amber">
                            <Star size={10} className="fill-current" /> Featured
                          </Pill>
                        )}
                      </div>
                      <p className="text-[10px] text-[#5c5d72]">
                        by {room.hostDisplayName} · {room.categoryLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditRoom(room)}
                      className="p-2 rounded-lg text-[#5c5d72] hover:text-white hover:bg-[#2d2e3e]"
                      title="Manage room"
                    >
                      <Settings2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-[#8b8ca8] mb-3 line-clamp-2">{room.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Pill color={VISIBILITY_COLORS[room.visibility] ?? 'gray'}>
                      {room.visibility === 'public' && <Eye size={10} />}
                      {room.visibility === 'unlisted' && <EyeOff size={10} />}
                      {room.visibility === 'private' && <Lock size={10} />}
                      {room.visibilityLabel}
                    </Pill>
                    <Pill color={room.status === 'live' ? 'green' : 'gray'}>{room.status}</Pill>
                    {room.moderatorDisplayName && (
                      <Pill color="blue">
                        <Shield size={10} /> {room.moderatorDisplayName}
                      </Pill>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] text-[#5c5d72]">
                      <Users2 size={11} /> {room.participantCount}/{room.maxParticipants}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(room)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${
                          room.featured
                            ? 'border-amber-500/40 text-amber-300'
                            : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                        }`}
                      >
                        <Star size={10} className={room.featured ? 'inline fill-current' : 'inline'} />{' '}
                        {room.featured ? 'Featured' : 'Feature'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editRoom && (
        <RoomManageModal
          room={editRoom}
          categories={categories}
          users={users.map((u) => ({ id: u.id, username: u.username }))}
          onClose={() => setEditRoom(null)}
          onDone={(type, msg) => {
            setBanner({ type, message: msg })
            if (type === 'success') refetch()
          }}
        />
      )}

      {editCategory && (
        <CategoryFormModal
          initial={editCategory === 'new' ? undefined : editCategory}
          onClose={() => setEditCategory(null)}
          onDone={(type, msg) => setBanner({ type, message: msg })}
        />
      )}
    </div>
  )
}
