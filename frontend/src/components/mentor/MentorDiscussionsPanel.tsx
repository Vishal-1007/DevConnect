/**
 * MentorDiscussionsPanel — forum-style community discussions for mentors.
 * Answer questions, share knowledge, publish insights.
 */
import { useMemo, useState } from 'react'
import {
  MessageSquare, Plus, RefreshCw, Loader2, Search, X, Send, Check,
  Pin, Bookmark, Lightbulb, HelpCircle, AlertTriangle, ChevronRight,
} from 'lucide-react'
import {
  useListDiscussionsQuery,
  useCreateDiscussionMutation,
  useListRepliesQuery,
  useAddReplyMutation,
  useMarkSolvedMutation,
} from '../../api/discussionsApi'
import type { DiscussionThread } from '../../api/types'
import { useAppSelector } from '../../hooks'
import { MentorFilterRow, MentorPanelShell, MENTOR_STAT_GRID } from './MentorPanelShell'

const TOPICS = [
  { id: 'all', label: 'All Topics' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'career', label: 'Career' },
  { id: 'interview-prep', label: 'Interview Prep' },
  { id: 'general', label: 'General' },
]

const INSIGHT_TEMPLATES = [
  {
    title: 'Production lesson learned this week',
    content: 'Share a concrete engineering lesson from a recent project — what worked, what failed, and what you would do differently.',
    topic: 'general',
    tags: ['insights', 'engineering'],
  },
  {
    title: 'Interview pattern developers miss',
    content: 'Break down a common interview pattern or mistake you see as a mentor, with a short example or framework.',
    topic: 'interview-prep',
    tags: ['interviews', 'mentorship'],
  },
  {
    title: 'Architecture trade-off deep dive',
    content: 'Compare two valid approaches to a real system design problem and explain when each makes sense.',
    topic: 'architecture',
    tags: ['system-design', 'trade-offs'],
  },
]

function Av({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center shrink-0 font-bold text-violet-300"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}

function Pill({ children, color }: { children: React.ReactNode; color: 'green' | 'violet' | 'amber' | 'gray' | 'blue' }) {
  const cls = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]',
  }[color]
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  )
}

function useBookmarks() {
  const key = 'mentor-discussion-bookmarks'
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    } catch {
      return new Set()
    }
  })
  const toggle = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(key, JSON.stringify([...next]))
      return next
    })
  }
  return { bookmarks, toggle }
}

function CreateDiscussionModal({ onClose }: { onClose: () => void }) {
  const [create, { isLoading }] = useCreateDiscussionMutation()
  const [form, setForm] = useState({ title: '', content: '', topic: 'general', tags: '' })
  const [error, setError] = useState('')

  const applyTemplate = (t: typeof INSIGHT_TEMPLATES[0]) => {
    setForm({ title: t.title, content: t.content, topic: t.topic, tags: t.tags.join(', ') })
  }

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.')
      return
    }
    setError('')
    try {
      await create({
        title: form.title.trim(),
        content: form.content.trim(),
        topic: form.topic,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }).unwrap()
      onClose()
    } catch {
      setError('Could not publish discussion. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-[#2d2e3e] flex items-center justify-between sticky top-0 bg-[#161722] z-10">
          <div>
            <h3 className="text-sm font-bold text-white">Publish Insight</h3>
            <p className="text-[10px] text-[#5c5d72] mt-0.5">Share knowledge with the developer community</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] text-[#5c5d72] mb-2 font-semibold uppercase tracking-wider">Quick templates</p>
            <div className="flex flex-wrap gap-2">
              {INSIGHT_TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-[#12131a] border border-[#2d2e3e] text-[#8b8ca8] hover:border-violet-500/40 hover:text-violet-300 transition-colors"
                >
                  {t.topic}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <p className="text-[10px] text-red-400">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-[10px] text-[#5c5d72] mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. How to approach graph problems in interviews?"
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#5c5d72] mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={5}
              placeholder="Share your insight, answer, or question in detail..."
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] resize-none focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Topic</label>
              <select
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                {TOPICS.filter((t) => t.id !== 'all').map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="java, spring, tips"
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publish Discussion
          </button>
        </div>
      </div>
    </div>
  )
}

function ThreadDetailDrawer({ thread, onClose }: { thread: DiscussionThread; onClose: () => void }) {
  const myId = useAppSelector((s) => s.auth.account?.id)
  const { data: replies = [], isLoading } = useListRepliesQuery(thread.id)
  const [addReply, { isLoading: replying }] = useAddReplyMutation()
  const [markSolved, { isLoading: solving }] = useMarkSolvedMutation()
  const [replyText, setReplyText] = useState('')
  const [error, setError] = useState('')

  const submitReply = async () => {
    if (!replyText.trim()) return
    setError('')
    try {
      await addReply({ threadId: thread.id, content: replyText.trim() }).unwrap()
      setReplyText('')
    } catch {
      setError('Could not post reply.')
    }
  }

  const acceptAnswer = async (replyId: string) => {
    try {
      await markSolved({ threadId: thread.id, replyId }).unwrap()
    } catch {
      setError('Only the thread author can mark as solved.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#12131a] border-l border-[#2d2e3e] h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#12131a] border-b border-[#2d2e3e] p-5 flex items-start gap-3 z-10">
          <Av name={thread.authorDisplayName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-white">{thread.title}</h3>
              {thread.solved && <Pill color="green"><Check size={9} />Solved</Pill>}
              {thread.pinned && <Pill color="amber"><Pin size={9} />Pinned</Pill>}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#5c5d72]">
              <Pill color="gray">{thread.topic}</Pill>
              <span>by {thread.authorDisplayName}</span>
              <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white shrink-0"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <p className="text-xs text-[#c4c5d6] leading-relaxed whitespace-pre-wrap">{thread.content}</p>
            {thread.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {thread.tags.map((tag) => (
                  <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-[#2d2e3e] text-[#8b8ca8]">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <MessageSquare size={13} className="text-violet-400" />
              {thread.replyCount} {thread.replyCount === 1 ? 'Reply' : 'Replies'}
            </h4>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-violet-400" /></div>
            ) : replies.length === 0 ? (
              <p className="text-xs text-[#5c5d72] text-center py-6">No replies yet — be the first mentor to help!</p>
            ) : (
              <div className="space-y-3">
                {replies.map((r) => (
                  <div
                    key={r.id}
                    className={`bg-[#161722] border rounded-xl p-4 ${r.acceptedAnswer ? 'border-emerald-500/30' : 'border-[#2d2e3e]'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Av name={r.authorDisplayName} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white">{r.authorDisplayName}</span>
                          {r.acceptedAnswer && <Pill color="green"><Check size={9} />Accepted</Pill>}
                          <span className="ml-auto text-[9px] text-[#5c5d72]">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-[#8b8ca8] leading-relaxed whitespace-pre-wrap">{r.content}</p>
                        {!thread.solved && thread.authorId === myId && !r.acceptedAnswer && (
                          <button
                            type="button"
                            onClick={() => acceptAnswer(r.id)}
                            disabled={solving}
                            className="mt-2 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Check size={11} /> Mark as accepted answer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!thread.solved && (
            <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider">Your answer</p>
              {error && <p className="text-[10px] text-red-400">{error}</p>}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Share your expertise — frameworks, examples, and actionable advice..."
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] resize-none focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={submitReply}
                disabled={replying || !replyText.trim()}
                className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                {replying ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Post Answer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function MentorDiscussionsPanel() {
  const myId = useAppSelector((s) => s.auth.account?.id)
  const [topic, setTopic] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'all' | 'unanswered' | 'mine' | 'bookmarks'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [activeThread, setActiveThread] = useState<DiscussionThread | null>(null)
  const { bookmarks, toggle: toggleBookmark } = useBookmarks()

  const { data: threads = [], isLoading, isError, refetch, isFetching } = useListDiscussionsQuery({
    topic: topic === 'all' ? undefined : topic,
    q: search.trim() || undefined,
    limit: 50,
  })

  const filtered = useMemo(() => {
    let list = [...threads]
    if (view === 'unanswered') list = list.filter((t) => !t.solved && t.replyCount === 0)
    if (view === 'mine' && myId) list = list.filter((t) => t.authorId === myId)
    if (view === 'bookmarks') list = list.filter((t) => bookmarks.has(t.id))
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [threads, view, myId, bookmarks])

  const stats = useMemo(() => ({
    total: threads.length,
    unanswered: threads.filter((t) => !t.solved && t.replyCount === 0).length,
    myPosts: myId ? threads.filter((t) => t.authorId === myId).length : 0,
    solved: threads.filter((t) => t.solved).length,
  }), [threads, myId])

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Discussions</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Answer developer questions, share knowledge, and publish insights</p>
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
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
          >
            <Plus size={13} /> Publish Insight
          </button>
        </div>
      </div>

      <div className={MENTOR_STAT_GRID}>
        {[
          { label: 'Active Threads', value: stats.total, icon: <MessageSquare size={14} className="text-violet-400" /> },
          { label: 'Needs Answer', value: stats.unanswered, icon: <HelpCircle size={14} className="text-amber-400" /> },
          { label: 'Your Posts', value: stats.myPosts, icon: <Lightbulb size={14} className="text-emerald-400" /> },
          { label: 'Solved', value: stats.solved, icon: <Check size={14} className="text-blue-400" /> },
        ].map((s) => (
          <div key={s.label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-[10px] text-[#8b8ca8]">{s.label}</span></div>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <MentorFilterRow
        search={(
          <>
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discussions..."
              className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
            />
          </>
        )}
      >
        {(['all', 'unanswered', 'mine', 'bookmarks'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              view === v
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {v === 'all' ? 'All' : v === 'unanswered' ? 'Needs Answer' : v === 'mine' ? 'My Posts' : 'Saved'}
          </button>
        ))}
      </MentorFilterRow>

      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTopic(t.id)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              topic === t.id
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
      ) : isError ? (
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">Could not load discussions</p>
          <button type="button" onClick={() => refetch()} className="text-xs text-violet-400 hover:text-violet-300 mt-2">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <MessageSquare size={40} className="text-[#3d3e52] mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">No discussions found</p>
          <p className="text-xs text-[#5c5d72] mb-4">Start a thread or adjust your filters</p>
          <button type="button" onClick={() => setShowCreate(true)} className="text-xs text-violet-400 hover:text-violet-300">Publish your first insight</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className={`bg-[#161722] border rounded-xl p-4 hover:border-[#3d3e52] transition-colors cursor-pointer ${
                t.pinned ? 'border-amber-500/20' : 'border-[#2d2e3e]'
              }`}
              onClick={() => setActiveThread(t)}
            >
              <div className="flex items-start gap-3">
                <Av name={t.authorDisplayName} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white">{t.title}</span>
                    {t.solved && <Pill color="green"><Check size={9} />Solved</Pill>}
                    {t.pinned && <Pill color="amber"><Pin size={9} />Pinned</Pill>}
                    {!t.solved && t.replyCount === 0 && <Pill color="amber">Needs answer</Pill>}
                    <Pill color="gray">{t.topic}</Pill>
                    <span className="ml-auto text-[9px] text-[#5c5d72]">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-[#8b8ca8] line-clamp-2 mb-2">{t.content}</p>
                  <div className="flex items-center gap-3 text-[10px] text-[#5c5d72]">
                    <span className="flex items-center gap-1"><MessageSquare size={11} />{t.replyCount} replies</span>
                    <span>by {t.authorDisplayName}</span>
                    {t.authorRole?.toLowerCase().includes('mentor') && (
                      <Pill color="violet">Mentor</Pill>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(t.id)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                      bookmarks.has(t.id) ? 'text-violet-400 bg-violet-500/15' : 'text-[#5c5d72] hover:text-violet-400 hover:bg-[#2d2e3e]'
                    }`}
                  >
                    <Bookmark size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveThread(t)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-violet-400 hover:bg-[#2d2e3e]"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateDiscussionModal onClose={() => setShowCreate(false)} />}
      {activeThread && <ThreadDetailDrawer thread={activeThread} onClose={() => setActiveThread(null)} />}
    </MentorPanelShell>
  )
}
