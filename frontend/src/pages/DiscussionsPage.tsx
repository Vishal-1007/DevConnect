import { useMemo, useState } from 'react'
import {
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  X,
} from 'lucide-react'
import {
  useCreateDiscussionMutation,
  useListDiscussionsQuery,
} from '../api/discussionsApi'
import { useGetMyProfileQuery } from '../api/userApi'
import { DiscussionThreadCard } from '../components/discussions/DiscussionThreadCard'
import { DiscussionThreadPanel } from '../components/discussions/DiscussionThreadPanel'
import { DISCUSSION_TOPICS } from '../data/discussionsData'
import { extractApiError } from '../lib/extractApiError'

export function DiscussionsPage() {
  const { data: profile } = useGetMyProfileQuery()
  const [topic, setTopic] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showComposer, setShowComposer] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [newTopic, setNewTopic] = useState('general')
  const [tagInput, setTagInput] = useState('')

  const { data: threads, isLoading, isFetching, error } = useListDiscussionsQuery({
    topic,
    q: searchQuery || undefined,
  })
  const [createDiscussion, { isLoading: creating }] = useCreateDiscussionMutation()

  const selectedThread = useMemo(
    () => threads?.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId]
  )

  const stats = useMemo(() => {
    if (!threads) return { total: 0, solved: 0, open: 0 }
    return {
      total: threads.length,
      solved: threads.filter((t) => t.solved).length,
      open: threads.filter((t) => !t.solved).length,
    }
  }, [threads])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
    setSelectedId(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim() || creating) return

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5)

    const created = await createDiscussion({
      title: title.trim(),
      content: content.trim(),
      topic: newTopic,
      tags: tags.length ? tags : undefined,
    }).unwrap()

    setTitle('')
    setContent('')
    setTagInput('')
    setShowComposer(false)
    setSelectedId(created.id)
  }

  if (selectedThread) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <DiscussionThreadPanel
          thread={selectedThread}
          currentUserId={profile?.id}
          onBack={() => setSelectedId(null)}
        />
      </div>
    )
  }

  const inputClass =
    'w-full px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center shrink-0">
            <MessageSquareText className="w-5 h-5 text-[#818cf8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Discussions</h1>
            <p className="text-sm text-[#8b8ca8] mt-1 max-w-xl">
              Ask questions, share knowledge, and get answers from the DevConnect community.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowComposer((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold"
        >
          {showComposer ? <X size={16} /> : <Plus size={16} />}
          {showComposer ? 'Cancel' : 'Start discussion'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-3 text-center">
          <p className="text-lg font-bold text-white">{stats.total}</p>
          <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">Threads</p>
        </div>
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{stats.solved}</p>
          <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">Solved</p>
        </div>
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{stats.open}</p>
          <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">Open</p>
        </div>
      </div>

      {showComposer && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-[#161722] border border-[#6366f1]/30 p-5 mb-6 space-y-3"
        >
          <h2 className="text-sm font-semibold text-white">New discussion</h2>
          <input
            className={`${inputClass} h-10`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Discussion title"
            required
          />
          <textarea
            className={`${inputClass} py-3 min-h-[100px] resize-y`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your question or topic in detail…"
            required
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className={`${inputClass} h-10 w-auto`}
            >
              {DISCUSSION_TOPICS.filter((t) => t.id !== 'all').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              className={`${inputClass} h-10 flex-1 min-w-[160px]`}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Tags (comma-separated)"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Posting…
                </>
              ) : (
                'Post discussion'
              )}
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleSearch} className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search discussions…"
          className={`${inputClass} h-10 pl-9 pr-24`}
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md text-xs font-medium bg-[#6366f1]/20 text-[#a5b4fc] hover:bg-[#6366f1]/30"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-5">
        {DISCUSSION_TOPICS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              setTopic(filter.id)
              setSelectedId(null)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              topic === filter.id
                ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]'
                : 'bg-[#161722] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
        {isFetching && !isLoading && (
          <Loader2 size={14} className="animate-spin text-[#8b8ca8] self-center ml-1" />
        )}
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-300">{extractApiError(error)}</p>
          <p className="text-xs text-red-400/80 mt-1">
            Restart user-service (port 8082) with SPRING_PROFILES_ACTIVE=local to load discussions API.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8ca8]">
          <Loader2 size={20} className="animate-spin" />
          Loading discussions…
        </div>
      )}

      {!isLoading && threads && threads.length === 0 && (
        <div className="text-center py-16 rounded-xl bg-[#161722] border border-[#2d2e3e]">
          <MessageSquareText className="w-10 h-10 text-[#6366f1] mx-auto mb-3 opacity-60" />
          <p className="text-white font-medium">No discussions found</p>
          <p className="text-sm text-[#8b8ca8] mt-1">
            {searchQuery ? 'Try a different search term.' : 'Start the first discussion above.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {threads?.map((thread) => (
          <DiscussionThreadCard
            key={thread.id}
            thread={thread}
            active={selectedId === thread.id}
            onSelect={() => setSelectedId(thread.id)}
          />
        ))}
      </div>
    </div>
  )
}
