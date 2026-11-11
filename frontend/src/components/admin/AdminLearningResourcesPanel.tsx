import { useMemo, useState } from 'react'
import {
  BookOpen, Loader2, Plus, RefreshCw, Search, Trash2, Upload, Eye, Download, Globe, Lock,
} from 'lucide-react'
import {
  useGetLearningResourceAnalyticsQuery,
  useListLearningResourceCategoriesQuery,
  useListAdminLearningResourcesQuery,
  usePublishAdminLearningResourceMutation,
  useUnpublishAdminLearningResourceMutation,
  useDeleteAdminLearningResourceMutation,
} from '../../api/adminLearningResourcesApi'
import { uploadAdminLearningResource } from '../../lib/adminLearningUpload'
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

export function AdminLearningResourcesPanel() {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [visibility, setVisibility] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', tags: '', difficulty: 'BEGINNER', visibility: 'DRAFT',
    file: null as File | null, thumbnail: null as File | null,
  })

  const { data: analytics } = useGetLearningResourceAnalyticsQuery()
  const { data: categories = [] } = useListLearningResourceCategoriesQuery()
  const { data: resources = [], isLoading, refetch } = useListAdminLearningResourcesQuery({
    visibility: visibility || undefined, categoryId: categoryId || undefined, q: q || undefined,
  })
  const [publish] = usePublishAdminLearningResourceMutation()
  const [unpublish] = useUnpublishAdminLearningResourceMutation()
  const [deleteResource] = useDeleteAdminLearningResourceMutation()

  const grouped = useMemo(() => {
    const map = new Map<string, typeof resources>()
    resources.forEach((r) => {
      const key = r.categoryName ?? 'Uncategorized'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    return [...map.entries()]
  }, [resources])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !form.file || !form.categoryId) {
      setError('Title, category, and file are required.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      await uploadAdminLearningResource({
        title: form.title,
        description: form.description || undefined,
        categoryId: form.categoryId,
        tags: form.tags || undefined,
        difficulty: form.difficulty,
        visibility: form.visibility,
        file: form.file,
        thumbnail: form.thumbnail,
      }, accessToken, setProgress)
      setShowForm(false)
      setForm({ title: '', description: '', categoryId: '', tags: '', difficulty: 'BEGINNER', visibility: 'DRAFT', file: null, thumbnail: null })
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
            <BookOpen size={18} className="text-violet-400" /> Learning Resources
          </h1>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Upload notes, PDFs, and study material for learners</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => refetch()} className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white">
            <RefreshCw size={14} />
          </button>
          <button type="button" onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg">
            <Plus size={13} /> Upload Resource
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatCard label="Total Resources" value={analytics?.totalResources ?? 0} color="#a78bfa" />
        <StatCard label="Total Downloads" value={analytics?.totalDownloads ?? 0} color="#34d399" />
        <StatCard label="Total Views" value={analytics?.totalViews ?? 0} color="#60a5fa" />
        <StatCard label="Published" value={analytics?.publicCount ?? 0} color="#22d3ee" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={13} className="text-[#5c5d72]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources…"
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
            placeholder="Resource title" className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description" rows={3} className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          <div className="grid sm:grid-cols-3 gap-3">
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              className="bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white">
              <option value="DRAFT">Draft</option>
              <option value="PUBLIC">Public</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags (comma separated)" className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white" />
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-[#8b8ca8]">
              Resource file (PDF, DOCX, PPT, ZIP)
              <input required type="file" accept=".pdf,.docx,.ppt,.pptx,.zip"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
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
      ) : resources.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#2d2e3e] rounded-xl">
          <BookOpen size={32} className="text-[#5c5d72] mx-auto mb-2" />
          <p className="text-sm text-white font-semibold">No resources yet</p>
          <p className="text-xs text-[#8b8ca8] mt-1">Upload PDFs and study notes to populate the learner catalog.</p>
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xs font-bold text-violet-300 mb-2">{category}</h2>
            <div className="space-y-2">
              {items.map((r) => (
                <div key={r.id} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 flex flex-wrap items-center gap-3">
                  {r.thumbnailUrl ? (
                    <img src={mediaSrc(r.thumbnailUrl)} alt="" className="w-16 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-violet-600/20 flex items-center justify-center">
                      <BookOpen size={18} className="text-violet-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-semibold text-white">{r.title}</p>
                    <p className="text-[11px] text-[#8b8ca8] line-clamp-1">{r.description}</p>
                    <div className="flex gap-3 mt-1 text-[10px] text-[#5c5d72]">
                      <span className="flex items-center gap-1"><Eye size={10} />{r.viewCount}</span>
                      <span className="flex items-center gap-1"><Download size={10} />{r.downloadCount}</span>
                      <span>{r.difficulty}</span>
                      <span className={r.visibility === 'PUBLIC' ? 'text-emerald-400' : r.visibility === 'PREMIUM' ? 'text-amber-400' : 'text-[#8b8ca8]'}>
                        {r.visibility === 'PUBLIC' ? <Globe size={10} className="inline" /> : r.visibility === 'PREMIUM' ? <Lock size={10} className="inline" /> : null} {r.visibility}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.visibility === 'DRAFT' ? (
                      <button type="button" onClick={() => publish(r.id).unwrap().then(() => refetch())}
                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30">Publish</button>
                    ) : (
                      <button type="button" onClick={() => unpublish(r.id).unwrap().then(() => refetch())}
                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white">Unpublish</button>
                    )}
                    <button type="button" onClick={() => deleteResource(r.id).unwrap().then(() => refetch())}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
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
