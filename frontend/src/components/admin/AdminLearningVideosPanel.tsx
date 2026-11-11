import { useMemo, useState } from 'react'
import {
  Radio, Loader2, Plus, RefreshCw, Search, Trash2, Upload, Eye, Globe, Lock, Clock,
} from 'lucide-react'
import {
  useGetLearningVideoAnalyticsQuery,
  useListLearningVideoCategoriesQuery,
  useListAdminLearningVideosQuery,
  usePublishAdminLearningVideoMutation,
  useUnpublishAdminLearningVideoMutation,
  useDeleteAdminLearningVideoMutation,
} from '../../api/adminLearningVideosApi'
import { uploadAdminLearningVideo } from '../../lib/adminLearningUpload'
import { extractApiError } from '../../lib/extractApiError'
import { useAppSelector } from '../../hooks'
import { apiUrl } from '../../config'

function mediaSrc(url: string | null | undefined) {
  if (!url) return undefined
  return apiUrl(url.startsWith('/') ? url : `/${url}`)
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl px-4 py-3 min-w-[120px]">
      <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function AdminLearningVideosPanel() {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [visibility, setVisibility] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', tags: '', durationSeconds: 0, visibility: 'DRAFT',
    video: null as File | null, thumbnail: null as File | null,
  })

  const { data: analytics } = useGetLearningVideoAnalyticsQuery()
  const { data: categories = [] } = useListLearningVideoCategoriesQuery()
  const { data: videos = [], isLoading, refetch } = useListAdminLearningVideosQuery({
    visibility: visibility || undefined, categoryId: categoryId || undefined, q: q || undefined,
  })
  const [publish] = usePublishAdminLearningVideoMutation()
  const [unpublish] = useUnpublishAdminLearningVideoMutation()
  const [deleteVideo] = useDeleteAdminLearningVideoMutation()

  const grouped = useMemo(() => {
    const map = new Map<string, typeof videos>()
    videos.forEach((v) => {
      const key = v.categoryName ?? 'Uncategorized'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(v)
    })
    return [...map.entries()]
  }, [videos])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !form.video || !form.categoryId) {
      setError('Title, category, and video are required.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      await uploadAdminLearningVideo({
        title: form.title,
        description: form.description || undefined,
        categoryId: form.categoryId,
        tags: form.tags || undefined,
        durationSeconds: form.durationSeconds,
        visibility: form.visibility,
        video: form.video,
        thumbnail: form.thumbnail,
      }, accessToken, setProgress)
      setShowForm(false)
      setForm({ title: '', description: '', categoryId: '', tags: '', durationSeconds: 0, visibility: 'DRAFT', video: null, thumbnail: null })
      refetch()
    } catch (err) {
      setError(extractApiError(err))
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={18} className="text-violet-400" /> Learning Streams
          </h1>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Upload platform educational videos for learners</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => refetch()} className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white">
            <RefreshCw size={14} />
          </button>
          <button type="button" onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg">
            <Plus size={13} /> Upload Video
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatCard label="Total Videos" value={analytics?.totalVideos ?? 0} color="#a78bfa" />
        <StatCard label="Total Views" value={analytics?.totalViews ?? 0} color="#34d399" />
        <StatCard label="Watch Time" value={`${Math.floor((analytics?.totalWatchSeconds ?? 0) / 3600)}h`} color="#60a5fa" />
        <StatCard label="Published" value={analytics?.publicCount ?? 0} color="#22d3ee" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={13} className="text-[#5c5d72]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos…"
            className="bg-transparent text-xs text-white outline-none flex-1" />
        </div>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}
          className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white">
          <option value="">All visibility</option>
          <option value="PUBLIC">Public</option>
          <option value="PREMIUM">Premium</option>
          <option value="DRAFT">Draft</option>
        </select>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {showForm && (
        <form onSubmit={handleUpload} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 space-y-3">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Video title" className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description" rows={3} className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          <div className="grid sm:grid-cols-4 gap-3">
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" min={0} value={form.durationSeconds || ''} onChange={(e) => setForm({ ...form, durationSeconds: Number(e.target.value) })}
              placeholder="Duration (sec)" className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
            <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
              <option value="DRAFT">Draft</option>
              <option value="PUBLIC">Public</option>
              <option value="PREMIUM">Premium</option>
            </select>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags" className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-[#8b8ca8]">
              Video (MP4, WEBM, MOV)
              <input required type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                onChange={(e) => setForm({ ...form, video: e.target.files?.[0] ?? null })}
                className="text-white file:mr-2 file:rounded file:border-0 file:bg-violet-600 file:px-2 file:py-1 file:text-xs file:text-white" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[#8b8ca8]">
              Thumbnail (optional)
              <input type="file" accept="image/*"
                onChange={(e) => setForm({ ...form, thumbnail: e.target.files?.[0] ?? null })}
                className="text-white file:mr-2 file:rounded file:border-0 file:bg-violet-600 file:px-2 file:py-1 file:text-xs file:text-white" />
            </label>
          </div>
          {uploading && (
            <div className="h-2 bg-[#2d2e3e] rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-[#8b8ca8] px-3 py-2">Cancel</button>
            <button type="submit" disabled={uploading}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              Upload
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#2d2e3e] rounded-xl">
          <Radio size={32} className="text-[#5c5d72] mx-auto mb-2" />
          <p className="text-sm text-white font-semibold">No videos yet</p>
          <p className="text-xs text-[#8b8ca8] mt-1">Upload educational videos to appear in the learner Learning Streams tab.</p>
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xs font-bold text-violet-300 mb-2">{category}</h2>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((v) => (
                <div key={v.id} className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
                  <div className="aspect-video bg-[#12131c] relative">
                    {v.thumbnailUrl ? (
                      <img src={mediaSrc(v.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Radio size={24} className="text-violet-400" /></div>
                    )}
                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock size={10} />{formatDuration(v.durationSeconds)}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-white line-clamp-1">{v.title}</p>
                    <div className="flex gap-2 mt-2 text-[10px] text-[#5c5d72]">
                      <span className="flex items-center gap-1"><Eye size={10} />{v.viewCount}</span>
                      <span className={v.visibility === 'PUBLIC' ? 'text-emerald-400' : v.visibility === 'PREMIUM' ? 'text-amber-400' : ''}>{v.visibility}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {v.visibility === 'DRAFT' ? (
                        <button type="button" onClick={() => publish(v.id).unwrap().then(() => refetch())}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400">Publish</button>
                      ) : (
                        <button type="button" onClick={() => unpublish(v.id).unwrap().then(() => refetch())}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8]">Unpublish</button>
                      )}
                      <button type="button" onClick={() => deleteVideo(v.id).unwrap().then(() => refetch())}
                        className="ml-auto p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
