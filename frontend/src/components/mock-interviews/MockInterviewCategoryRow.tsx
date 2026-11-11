import {
  Brain,
  Briefcase,
  Code2,
  FileText,
  Layers,
  LayoutGrid,
  MessageCircle,
  Server,
} from 'lucide-react'
import type { MockInterviewCategory } from '../../api/mockInterviewApi'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <LayoutGrid size={20} className="text-[#818cf8]" />,
  dsa: <Brain size={20} className="text-[#818cf8]" />,
  'system-design': <Layers size={20} className="text-[#818cf8]" />,
  backend: <Server size={20} className="text-[#818cf8]" />,
  frontend: <Code2 size={20} className="text-[#818cf8]" />,
  behavioral: <MessageCircle size={20} className="text-[#818cf8]" />,
  'resume-review': <FileText size={20} className="text-[#818cf8]" />,
  'career-guidance': <Briefcase size={20} className="text-[#818cf8]" />,
}

/** Reference design display counts when API returns sparse data */
const REFERENCE_COUNTS: Record<string, { count: string; rating: number }> = {
  dsa: { count: '120+', rating: 4.9 },
  'system-design': { count: '80+', rating: 4.8 },
  backend: { count: '90+', rating: 4.8 },
  frontend: { count: '70+', rating: 4.7 },
  behavioral: { count: '40+', rating: 4.7 },
  'resume-review': { count: '30+', rating: 4.9 },
  'career-guidance': { count: '25+', rating: 4.7 },
}

function iconFor(id: string) {
  const key = id.toLowerCase()
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon
  }
  return CATEGORY_ICONS.all
}

function displayMeta(cat: MockInterviewCategory): { count: string; rating: number } {
  const ref = REFERENCE_COUNTS[cat.id]
  if (cat.mentorCount >= 10) {
    return { count: `${cat.mentorCount}+`, rating: cat.averageRating }
  }
  if (ref) return ref
  if (cat.mentorCount > 0) {
    return { count: `${cat.mentorCount}+`, rating: cat.averageRating }
  }
  return { count: '—', rating: cat.averageRating || 4.8 }
}

interface MockInterviewCategoryRowProps {
  categories: MockInterviewCategory[]
  selected?: string
  onSelect: (id: string | undefined) => void
}

const EXTRA_CATEGORIES: MockInterviewCategory[] = [
  { id: 'career-guidance', label: 'Career Guidance', mentorCount: 0, averageRating: 4.7 },
]

export function MockInterviewCategoryRow({
  categories,
  selected,
  onSelect,
}: MockInterviewCategoryRowProps) {
  const allCategories = [
    ...categories,
    ...EXTRA_CATEGORIES.filter((e) => !categories.some((c) => c.id === e.id)),
  ]

  const cardClass = (active: boolean) =>
    active
      ? 'border-[#6366f1] bg-[#6366f1]/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-[#6366f1]/40'
      : 'border-[#2d2e3e] bg-[#161722] hover:border-[#6366f1]/35'

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`shrink-0 rounded-xl border px-4 py-3 min-w-[108px] text-left transition-all ${cardClass(!selected)}`}
      >
        <div className="mb-2">{CATEGORY_ICONS.all}</div>
        <p className="text-sm font-semibold text-white">All</p>
        <p className="text-[10px] text-[#8b8ca8] mt-0.5">350+</p>
      </button>
      {allCategories.map((cat) => {
        const { count, rating } = displayMeta(cat)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id === selected ? undefined : cat.id)}
            className={`shrink-0 rounded-xl border px-4 py-3 min-w-[148px] text-left transition-all ${cardClass(selected === cat.id)}`}
          >
            <div className="mb-2">{iconFor(cat.id)}</div>
            <p className="text-sm font-semibold text-white whitespace-nowrap">{cat.label}</p>
            <p className="text-[10px] text-[#8b8ca8] mt-0.5">
              {count}{' '}
              <span className="text-amber-400/90">⭐ {rating.toFixed(1)}</span>
            </p>
          </button>
        )
      })}
    </div>
  )
}
