import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Search, Star, Loader2, Filter, AlertTriangle } from 'lucide-react'
import { useBrowseInterviewPacksQuery } from '../api/interviewMarketplaceApi'
import type { InterviewPackCard } from '../api/interviewMarketplaceApi'
import { extractApiError } from '../lib/extractApiError'

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard', 'expert'] as const

function PackCard({ pack, onPreview, onBuy }: { pack: InterviewPackCard; onPreview: () => void; onBuy: () => void }) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl overflow-hidden hover:border-violet-500/40 transition-all group">
      <div className="h-36 bg-gradient-to-br from-violet-900/40 to-[#0b0c14] flex items-center justify-center relative">
        {pack.thumbnailUrl ? (
          <img src={pack.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />
        ) : (
          <Briefcase className="w-10 h-10 text-violet-400/60" />
        )}
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-violet-200 border border-violet-500/30">
          {pack.difficultyLabel}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-violet-300 transition-colors">{pack.title}</h3>
          <p className="text-xs text-[#8b8ca8] mt-0.5">by {pack.mentorName}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#8b8ca8]">
          <span className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" />{pack.avgRating.toFixed(1)}</span>
          <span>{pack.questionCount} questions</span>
          <span>{pack.durationMinutes} min</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-white">{pack.free ? 'Free' : pack.priceLabel}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onPreview} className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-violet-500/40 transition-colors">
              Preview
            </button>
            <button type="button" onClick={onBuy} className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg dc-gradient-btn text-white">
              {pack.purchased ? 'Open' : pack.free ? 'Get Free' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InterviewMarketplacePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('all')
  const [minRating, setMinRating] = useState<number | undefined>()

  const { data, isLoading, isFetching, isError, error } = useBrowseInterviewPacksQuery({
    search: search || undefined,
    category: category || undefined,
    difficulty: difficulty === 'all' ? undefined : difficulty,
    minRating,
    page: 0,
    size: 24,
  })

  useEffect(() => {
    if (data) {
      console.log('Marketplace API Response', data)
    }
  }, [data])

  const packs = data?.items ?? []
  const loadError = isError ? extractApiError(error) : ''

  const categories = useMemo(() => {
    const set = new Set<string>()
    packs.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return Array.from(set)
  }, [packs])

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase size={22} className="text-violet-400" /> Interview Marketplace
        </h1>
        <p className="text-sm text-[#8b8ca8] mt-1">
          Premium interview packs from expert mentors — practice, purchase, and prepare.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packs, mentors, topics…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
          className="h-10 px-3 rounded-lg bg-[#161722] border border-[#2d2e3e] text-sm text-white"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d === 'all' ? 'All Difficulties' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
        <select
          value={minRating ?? ''}
          onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
          className="h-10 px-3 rounded-lg bg-[#161722] border border-[#2d2e3e] text-sm text-white"
        >
          <option value="">All Ratings</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#161722] border border-[#2d2e3e] text-sm text-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {(isLoading || isFetching) && <Loader2 size={18} className="animate-spin text-violet-400" />}
      </div>

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          <AlertTriangle size={16} /> {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#161722] border border-[#2d2e3e] animate-pulse" />
          ))}
        </div>
      ) : packs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#2d2e3e] rounded-2xl">
          <Filter className="w-10 h-10 text-[#5c5d72] mx-auto mb-3" />
          <p className="text-white font-semibold">No interview packs yet</p>
          <p className="text-sm text-[#8b8ca8] mt-1">Mentors can publish Public Free or Public Paid packs from the Interview Packs tab in the Mentor Panel.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              onPreview={() => navigate(`/interview-marketplace/${pack.id}?preview=1`)}
              onBuy={() => navigate(`/interview-marketplace/${pack.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
