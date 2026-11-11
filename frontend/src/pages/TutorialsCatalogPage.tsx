import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Loader2, Lock, Search } from 'lucide-react'
import { useBrowseTutorialsQuery, useSearchTutorialsQuery } from '../api/tutorialsApi'

type TutorialsCatalogPageProps = {
  creatorType?: 'ADMIN' | 'MENTOR'
  title: string
  subtitle: string
  basePath: string
}

export function TutorialsCatalogPage({ creatorType, title, subtitle, basePath }: TutorialsCatalogPageProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const { data: tutorials, isLoading } = useBrowseTutorialsQuery({ creatorType, category: category || undefined, q: search || undefined })
  const { data: searchResults } = useSearchTutorialsQuery(search, { skip: search.trim().length < 2 })

  const categories = useMemo(() => {
    const set = new Set<string>()
    ;(tutorials ?? []).forEach((t) => { if (t.category) set.add(t.category) })
    return Array.from(set).sort()
  }, [tutorials])

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen size={22} className="text-violet-400" /> {title}</h1>
        <p className="text-sm text-[#8b8ca8] mt-1">{subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tutorials, sections, topics…"
            className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#5c5d72]" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2.5 text-sm text-white">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {search.trim().length >= 2 && (searchResults?.length ?? 0) > 0 && (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-[#8b8ca8] uppercase">Search results</p>
          {searchResults!.map((r, i) => (
            <Link key={`${r.topicId ?? r.sectionId ?? r.tutorialId}-${i}`}
              to={r.topicId ? `${basePath}/${r.tutorialId}/${r.topicId}` : `${basePath}/${r.tutorialId}`}
              className="block text-sm text-white hover:text-violet-300 py-1">
              {r.topicTitle ?? r.sectionTitle ?? r.tutorialTitle}
              <span className="text-[#5c5d72] text-xs ml-2">{r.snippet}</span>
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(tutorials ?? []).map((tutorial) => (
            <Link key={tutorial.id} to={`${basePath}/${tutorial.id}`}
              className="bg-[#161722] border border-[#2d2e3e] hover:border-violet-500/30 rounded-xl p-4 space-y-3 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] text-violet-400 font-semibold uppercase">{tutorial.category} · {tutorial.difficulty}</p>
                  <h2 className="text-sm font-bold text-white mt-1">{tutorial.title}</h2>
                </div>
                {tutorial.locked && <Lock size={16} className="text-amber-400 shrink-0" />}
              </div>
              <p className="text-xs text-[#8b8ca8] line-clamp-2">{tutorial.description}</p>
              <div className="flex items-center justify-between text-[10px] text-[#5c5d72]">
                <span>{tutorial.topicCount} topics</span>
                <span>{tutorial.courseType === 'PAID' ? `₹${(tutorial.priceCents / 100).toFixed(0)}` : 'FREE'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
