/**
 * MentorSharedNotesPanel — store and share post-session learning materials with students.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  FileText, Plus, Search, Loader2, RefreshCw, AlertTriangle, Trash2,
  Share2, Download, X, Check, Code2, Map, HelpCircle, FileUp, Users,
  Eye, Edit3, BookOpen,
} from 'lucide-react'
import {
  useGetMentorSharedNotesQuery,
  useCreateMentorSharedNoteMutation,
  useUpdateMentorSharedNoteMutation,
  useShareMentorSharedNoteMutation,
  useDeleteMentorSharedNoteMutation,
  useLazyGetMentorSharedNoteFileQuery,
  useGetMentorStudentsQuery,
  type MentorSharedNote,
  type MentorSharedNoteType,
} from '../../api/mentorWorkspaceApi'
import { MentorPanelShell } from './MentorPanelShell'

const MATERIAL_TYPES: { id: MentorSharedNoteType | 'all'; label: string; icon: ReactNode }[] = [
  { id: 'all', label: 'All', icon: <FileText size={12} /> },
  { id: 'note', label: 'Notes', icon: <BookOpen size={12} /> },
  { id: 'pdf', label: 'PDFs', icon: <FileUp size={12} /> },
  { id: 'interview_question', label: 'Interview Q', icon: <HelpCircle size={12} /> },
  { id: 'roadmap', label: 'Roadmaps', icon: <Map size={12} /> },
  { id: 'code_sample', label: 'Code', icon: <Code2 size={12} /> },
]

const TYPE_COLORS: Record<MentorSharedNoteType, string> = {
  note: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  pdf: 'bg-red-500/15 text-red-300 border-red-500/25',
  interview_question: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  roadmap: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  code_sample: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function NoteFormModal({
  note,
  onClose,
}: {
  note?: MentorSharedNote
  onClose: () => void
}) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [materialType, setMaterialType] = useState<MentorSharedNoteType>(note?.materialType ?? 'note')
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '')
  const [published, setPublished] = useState(note?.published ?? false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [create, { isLoading: creating }] = useCreateMentorSharedNoteMutation()
  const [update, { isLoading: updating }] = useUpdateMentorSharedNoteMutation()
  const isLoading = creating || updating

  const submit = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError('')
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
    let fileDataBase64: string | undefined
    let fileName: string | undefined
    let fileMimeType: string | undefined

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File must be 5 MB or smaller')
        return
      }
      fileDataBase64 = await readFileAsBase64(file)
      fileName = file.name
      fileMimeType = file.type || 'application/octet-stream'
    }

    try {
      if (note) {
        await update({
          noteId: note.id,
          body: {
            title: title.trim(),
            content: content.trim() || undefined,
            materialType,
            tags: tagList,
            published,
            ...(file ? { fileName, fileMimeType, fileDataBase64 } : {}),
          },
        }).unwrap()
      } else {
        await create({
          title: title.trim(),
          content: content.trim() || undefined,
          materialType,
          tags: tagList,
          published,
          fileName,
          fileMimeType,
          fileDataBase64,
        }).unwrap()
      }
      onClose()
    } catch {
      setError('Could not save note. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#12131c] border border-[#2d2e3e] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2e3e]">
          <h3 className="text-sm font-bold text-white">{note ? 'Edit Material' : 'New Material'}</h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider mb-1.5 block">Material Type</label>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_TYPES.filter((t) => t.id !== 'all').map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMaterialType(t.id as MentorSharedNoteType)}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                    materialType === t.id
                      ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                      : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Design Session Recap"
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider mb-1.5 block">
              {materialType === 'code_sample' ? 'Code / Snippets' : 'Content'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                materialType === 'code_sample'
                  ? 'Paste code samples, snippets, or explanations…'
                  : materialType === 'interview_question'
                    ? 'Question, follow-ups, and evaluation rubric…'
                    : materialType === 'roadmap'
                      ? 'Week-by-week learning plan…'
                      : 'Notes, links, and study material for your students…'
              }
              rows={8}
              className={`w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500 resize-none ${
                materialType === 'code_sample' ? 'font-mono' : ''
              }`}
            />
          </div>
          {(materialType === 'pdf' || materialType === 'note') && (
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider mb-1.5 block">
                Attach PDF {materialType === 'pdf' ? '(required for PDF type)' : '(optional)'}
              </label>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#3d3e52] rounded-lg text-xs text-[#8b8ca8] hover:border-violet-500/50 hover:text-violet-300 transition-colors"
              >
                <FileUp size={14} />
                {file ? `${file.name} (${formatBytes(file.size)})` : note?.hasFile ? `Current: ${note.fileName}` : 'Click to upload PDF (max 5 MB)'}
              </button>
            </div>
          )}
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider mb-1.5 block">Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="dsa, system-design, post-session"
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded border-[#3d3e52]" />
            <span className="text-xs text-[#8b8ca8]">Mark as ready to share with students</span>
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-[#2d2e3e]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-xs">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {note ? 'Save Changes' : 'Create Material'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ShareModal({ note, onClose }: { note: MentorSharedNote; onClose: () => void }) {
  const { data: students = [] } = useGetMentorStudentsQuery()
  const [selected, setSelected] = useState<Set<string>>(() => new Set(note.sharedWithLearnerIds))
  const [message, setMessage] = useState('')
  const [share, { isLoading }] = useShareMentorSharedNoteMutation()

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = async () => {
    if (selected.size === 0) return
    try {
      await share({
        noteId: note.id,
        learnerIds: [...selected],
        message: message.trim() || undefined,
      }).unwrap()
      onClose()
    } catch {
      // keep modal open
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#12131c] border border-[#2d2e3e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2e3e]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Share2 size={14} className="text-violet-400" /> Share with Students</h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          <p className="text-xs text-[#8b8ca8]">Share <span className="text-white font-semibold">{note.title}</span> as post-session study material.</p>
          {students.length === 0 ? (
            <p className="text-xs text-[#5c5d72] text-center py-4">No students yet. Complete sessions to add mentees.</p>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <label key={s.learnerId} className="flex items-center gap-3 p-3 rounded-lg bg-[#161722] border border-[#2d2e3e] cursor-pointer hover:border-violet-500/30">
                  <input type="checkbox" checked={selected.has(s.learnerId)} onChange={() => toggle(s.learnerId)} className="rounded border-[#3d3e52]" />
                  <div>
                    <p className="text-xs font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-[#5c5d72]">{s.sessions} sessions · {s.categoryLabel ?? 'Active'}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message for students…"
            rows={2}
            className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-[#2d2e3e]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-xs">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading || selected.size === 0}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
            Share with {selected.size} student{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

function NoteDetailDrawer({
  note,
  onClose,
  onEdit,
  onShare,
  onDelete,
}: {
  note: MentorSharedNote
  onClose: () => void
  onEdit: () => void
  onShare: () => void
  onDelete: () => void
}) {
  const [fetchFile] = useLazyGetMentorSharedNoteFileQuery()

  const downloadFile = async () => {
    try {
      const file = await fetchFile(note.id).unwrap()
      const mime = file.fileMimeType || 'application/octet-stream'
      const link = document.createElement('a')
      link.href = `data:${mime};base64,${file.fileDataBase64}`
      link.download = file.fileName || 'download'
      link.click()
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#12131c] border-l border-[#2d2e3e] h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#12131c] border-b border-[#2d2e3e] px-5 py-4 flex items-center justify-between">
          <div>
            <span className={`inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full border mb-2 ${TYPE_COLORS[note.materialType]}`}>
              {note.materialTypeLabel}
            </span>
            <h3 className="text-sm font-bold text-white">{note.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 text-[10px] text-[#5c5d72]">
            <span>Updated {note.updatedAtLabel}</span>
            {note.sharedCount > 0 && (
              <span className="flex items-center gap-1 text-violet-400">
                <Users size={10} /> Shared with {note.sharedCount} student{note.sharedCount !== 1 ? 's' : ''}
              </span>
            )}
            {note.published && (
              <span className="flex items-center gap-1 text-emerald-400"><Check size={10} /> Published</span>
            )}
          </div>
          {note.content && (
            <pre className={`text-xs text-[#a5a6bb] bg-[#0b0c14] rounded-lg p-4 whitespace-pre-wrap leading-relaxed ${
              note.materialType === 'code_sample' ? 'font-mono' : ''
            }`}>
              {note.content}
            </pre>
          )}
          {note.hasFile && (
            <div className="flex items-center gap-3 p-3 bg-[#161722] border border-[#2d2e3e] rounded-lg">
              <FileUp size={16} className="text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{note.fileName}</p>
                <p className="text-[10px] text-[#5c5d72]">{formatBytes(note.fileSizeBytes)}</p>
              </div>
              <button type="button" onClick={downloadFile} className="text-[10px] font-bold text-violet-400 hover:text-white flex items-center gap-1">
                <Download size={12} /> Download
              </button>
            </div>
          )}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((t) => (
                <span key={t} className="text-[9px] bg-[#2d2e3e] text-[#8b8ca8] px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-[#12131c] border-t border-[#2d2e3e] px-5 py-4 flex gap-2">
          <button type="button" onClick={onShare} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">
            <Share2 size={12} /> Share
          </button>
          <button type="button" onClick={onEdit} className="px-3 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white"><Edit3 size={13} /></button>
          <button type="button" onClick={onDelete} className="px-3 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-red-400"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  )
}

export function MentorSharedNotesPanel() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editNote, setEditNote] = useState<MentorSharedNote | undefined>()
  const [shareNote, setShareNote] = useState<MentorSharedNote | null>(null)
  const [viewNote, setViewNote] = useState<MentorSharedNote | null>(null)

  const { data: notes = [], isLoading, isError, refetch, isFetching } = useGetMentorSharedNotesQuery({
    type: typeFilter,
    search,
  })
  const [deleteNote] = useDeleteMentorSharedNoteMutation()

  const stats = useMemo(() => ({
    total: notes.length,
    shared: notes.filter((n) => n.sharedCount > 0).length,
    pdfs: notes.filter((n) => n.materialType === 'pdf' || n.hasFile).length,
  }), [notes])

  const handleDelete = async (note: MentorSharedNote) => {
    if (!window.confirm(`Delete "${note.title}"?`)) return
    await deleteNote(note.id)
    setViewNote(null)
  }

  if (isLoading && notes.length === 0) {
    return (
      <MentorPanelShell>
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
      </MentorPanelShell>
    )
  }

  if (isError) {
    return (
      <MentorPanelShell>
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">Could not load shared notes</p>
          <button type="button" onClick={() => refetch()} className="text-xs text-violet-400 hover:text-violet-300 mt-2">Try again</button>
        </div>
      </MentorPanelShell>
    )
  }

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Shared Notes</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Store and share post-session study material with your students</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => { setEditNote(undefined); setShowForm(true) }}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} /> New Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full">
        {[
          { label: 'Total Materials', value: stats.total, icon: <FileText size={14} className="text-violet-400" /> },
          { label: 'Shared with Students', value: stats.shared, icon: <Share2 size={14} className="text-emerald-400" /> },
          { label: 'PDF Attachments', value: stats.pdfs, icon: <FileUp size={14} className="text-red-400" /> },
        ].map((s) => (
          <div key={s.label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-[10px] text-[#8b8ca8]">{s.label}</span></div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, tags, topics…"
            className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MATERIAL_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                typeFilter === t.id
                  ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                  : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <FileText size={40} className="text-[#3d3e52] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#8b8ca8]">No notes yet</p>
          <p className="text-xs text-[#5c5d72] mt-1 mb-4">Create notes to share with your students after sessions.</p>
          <button
            type="button"
            onClick={() => { setEditNote(undefined); setShowForm(true) }}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
          >
            <Plus size={13} /> Create your first note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full auto-rows-fr">
          {notes.map((n) => (
            <div
              key={n.id}
              className="h-full bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 hover:border-[#3d3e52] transition-colors group cursor-pointer"
              onClick={() => setViewNote(n)}
              onKeyDown={(e) => e.key === 'Enter' && setViewNote(n)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[n.materialType]}`}>
                      {n.materialTypeLabel}
                    </span>
                    {n.sharedCount > 0 && (
                      <span className="text-[9px] text-violet-400 flex items-center gap-0.5">
                        <Users size={9} /> {n.sharedCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShareNote(n) }}
                    className="p-1.5 rounded-lg text-[#5c5d72] hover:text-violet-400 hover:bg-violet-500/10"
                    title="Share"
                  >
                    <Share2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(n) }}
                    className="p-1.5 rounded-lg text-[#5c5d72] hover:text-red-400 hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {n.content && (
                <p className={`text-xs text-[#8b8ca8] bg-[#0b0c14] rounded-lg p-2 mb-3 line-clamp-3 leading-relaxed ${
                  n.materialType === 'code_sample' ? 'font-mono' : ''
                }`}>
                  {n.content}
                </p>
              )}
              {n.hasFile && (
                <div className="flex items-center gap-2 text-[10px] text-[#5c5d72] mb-2">
                  <FileUp size={11} className="text-red-400" />
                  <span className="truncate">{n.fileName}</span>
                  <span>{formatBytes(n.fileSizeBytes)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {n.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[9px] bg-[#2d2e3e] text-[#8b8ca8] px-1.5 py-0.5 rounded">#{t}</span>
                ))}
                <span className="ml-auto text-[9px] text-[#5c5d72] flex items-center gap-1">
                  <Eye size={9} /> {n.updatedAtLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NoteFormModal note={editNote} onClose={() => { setShowForm(false); setEditNote(undefined) }} />
      )}
      {shareNote && <ShareModal note={shareNote} onClose={() => setShareNote(null)} />}
      {viewNote && (
        <NoteDetailDrawer
          note={viewNote}
          onClose={() => setViewNote(null)}
          onEdit={() => { setEditNote(viewNote); setShowForm(true); setViewNote(null) }}
          onShare={() => { setShareNote(viewNote); setViewNote(null) }}
          onDelete={() => handleDelete(viewNote)}
        />
      )}
    </MentorPanelShell>
  )
}
