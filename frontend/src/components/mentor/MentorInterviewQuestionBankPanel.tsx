/**
 * MentorInterviewQuestionBankPanel — mock interview question repository for mentors.
 */
import { useMemo, useState, type ReactNode } from 'react'
import {
  HelpCircle, Search, Loader2, RefreshCw, AlertTriangle, Bookmark, Copy, Check,
  Sparkles, Plus, X, Trash2, ChevronDown, ChevronUp, FileStack,
} from 'lucide-react'
import {
  useGetMentorInterviewQuestionsQuery,
  useToggleMentorInterviewQuestionSaveMutation,
  useGenerateMentorInterviewQuestionMutation,
  useCreateMentorInterviewQuestionMutation,
  useDeleteMentorInterviewQuestionMutation,
  type MentorInterviewQuestion,
  type MentorInterviewQuestionCategory,
  type MentorInterviewQuestionDifficulty,
} from '../../api/mentorWorkspaceApi'
import { MentorFilterRow, MentorPanelShell, MENTOR_STAT_GRID } from './MentorPanelShell'

const CATEGORIES: { id: MentorInterviewQuestionCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dsa', label: 'DSA' },
  { id: 'system_design', label: 'System Design' },
  { id: 'java', label: 'Java' },
  { id: 'react', label: 'React' },
  { id: 'spring_boot', label: 'Spring Boot' },
  { id: 'hr', label: 'HR' },
]

const DIFFICULTIES: { id: MentorInterviewQuestionDifficulty | 'all'; label: string }[] = [
  { id: 'all', label: 'All Levels' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

const VIEWS = [
  { id: 'all', label: 'All Questions' },
  { id: 'saved', label: 'Saved' },
  { id: 'templates', label: 'My Templates' },
  { id: 'ai', label: 'AI Generated' },
] as const

const DIFF_COLOR: Record<string, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  Hard: 'bg-red-500/15 text-red-300 border-red-500/25',
}

function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border ${className}`}>
      {children}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy question"
      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-emerald-400 hover:bg-[#2d2e3e] transition-colors"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

function GenerateModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<MentorInterviewQuestionCategory>('dsa')
  const [difficulty, setDifficulty] = useState<MentorInterviewQuestionDifficulty>('medium')
  const [topic, setTopic] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [generate, { isLoading }] = useGenerateMentorInterviewQuestionMutation()

  const submit = async () => {
    try {
      await generate({ category, difficulty, topic: topic.trim() || undefined, saveAsTemplate }).unwrap()
      onClose()
    } catch {
      // keep open
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#12131c] border border-[#2d2e3e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2e3e]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400" /> AI Question Generator
          </h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#8b8ca8]">
            Generate tailored mock interview questions with follow-ups and evaluation hints.
          </p>
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as MentorInterviewQuestionCategory)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                    category === c.id ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider mb-1.5 block">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.filter((d) => d.id !== 'all').map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id as MentorInterviewQuestionDifficulty)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                    difficulty === d.id ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wider mb-1.5 block">Topic (optional)</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. LRU cache, rate limiter, team conflict…"
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} />
            <span className="text-xs text-[#8b8ca8]">Save as reusable template</span>
          </label>
        </div>
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-[#2d2e3e]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-xs">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Generate Question
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateTemplateModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<MentorInterviewQuestionCategory>('dsa')
  const [difficulty, setDifficulty] = useState<MentorInterviewQuestionDifficulty>('medium')
  const [questionText, setQuestionText] = useState('')
  const [followUps, setFollowUps] = useState('')
  const [evaluationHints, setEvaluationHints] = useState('')
  const [error, setError] = useState('')
  const [create, { isLoading }] = useCreateMentorInterviewQuestionMutation()

  const submit = async () => {
    if (!questionText.trim()) {
      setError('Question text is required')
      return
    }
    try {
      await create({
        category,
        difficulty,
        questionText: questionText.trim(),
        followUps: followUps.trim() || undefined,
        evaluationHints: evaluationHints.trim() || undefined,
        template: true,
      }).unwrap()
      onClose()
    } catch {
      setError('Could not save template')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#12131c] border border-[#2d2e3e] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2e3e]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileStack size={14} className="text-violet-400" /> Save Question Template
          </h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id as MentorInterviewQuestionCategory)}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${
                  category === c.id ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {DIFFICULTIES.filter((d) => d.id !== 'all').map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id as MentorInterviewQuestionDifficulty)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border ${
                  difficulty === d.id ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Interview question…"
            rows={3}
            className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500 resize-none"
          />
          <textarea
            value={followUps}
            onChange={(e) => setFollowUps(e.target.value)}
            placeholder="Follow-up questions (one per line)…"
            rows={3}
            className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500 resize-none"
          />
          <textarea
            value={evaluationHints}
            onChange={(e) => setEvaluationHints(e.target.value)}
            placeholder="What to look for in a strong answer…"
            rows={2}
            className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500 resize-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-[#2d2e3e]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-xs">Cancel</button>
          <button type="button" onClick={submit} disabled={isLoading} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50">
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  onToggleSave,
  onDelete,
  expanded,
  onToggleExpand,
}: {
  question: MentorInterviewQuestion
  onToggleSave: () => void
  onDelete?: () => void
  expanded: boolean
  onToggleExpand: () => void
}) {
  const fullText = [
    question.questionText,
    question.followUps ? `\n\nFollow-ups:\n${question.followUps}` : '',
    question.evaluationHints ? `\n\nEvaluation:\n${question.evaluationHints}` : '',
  ].join('')

  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 hover:border-[#3d3e52] transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1c1d2a] flex items-center justify-center shrink-0">
          <HelpCircle size={14} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Pill className="bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]">{question.categoryLabel}</Pill>
            <Pill className={DIFF_COLOR[question.difficultyLabel] ?? DIFF_COLOR.Medium}>{question.difficultyLabel}</Pill>
            {question.aiGenerated && (
              <Pill className="bg-violet-500/15 text-violet-300 border-violet-500/25">
                <Sparkles size={9} className="mr-0.5" /> AI
              </Pill>
            )}
            {question.template && (
              <Pill className="bg-cyan-500/15 text-cyan-300 border-cyan-500/25">Template</Pill>
            )}
          </div>
          <p className="text-sm text-white leading-relaxed">{question.questionText}</p>
          {expanded && (question.followUps || question.evaluationHints) && (
            <div className="mt-3 space-y-2">
              {question.followUps && (
                <div className="bg-[#0b0c14] rounded-lg p-3">
                  <p className="text-[10px] font-bold text-[#8b8ca8] uppercase mb-1">Follow-ups</p>
                  <pre className="text-xs text-[#a5a6bb] whitespace-pre-wrap">{question.followUps}</pre>
                </div>
              )}
              {question.evaluationHints && (
                <div className="bg-[#0b0c14] rounded-lg p-3">
                  <p className="text-[10px] font-bold text-[#8b8ca8] uppercase mb-1">Evaluation Hints</p>
                  <p className="text-xs text-[#a5a6bb]">{question.evaluationHints}</p>
                </div>
              )}
            </div>
          )}
          {(question.followUps || question.evaluationHints) && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5"
            >
              {expanded ? <><ChevronUp size={10} /> Hide details</> : <><ChevronDown size={10} /> Show follow-ups</>}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleSave}
            title={question.saved ? 'Remove from saved' : 'Save question'}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              question.saved ? 'text-amber-400 bg-amber-500/15' : 'text-[#5c5d72] hover:text-amber-400 hover:bg-[#2d2e3e]'
            }`}
          >
            <Bookmark size={12} className={question.saved ? 'fill-amber-400' : ''} />
          </button>
          <CopyButton text={fullText} />
          {onDelete && question.custom && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-red-400 hover:bg-[#2d2e3e] transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function MentorInterviewQuestionBankPanel() {
  const [category, setCategory] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const { data: questions = [], isLoading, isError, refetch, isFetching } = useGetMentorInterviewQuestionsQuery({
    category,
    difficulty,
    search,
    view,
  })
  const [toggleSave] = useToggleMentorInterviewQuestionSaveMutation()
  const [deleteQuestion] = useDeleteMentorInterviewQuestionMutation()

  const stats = useMemo(() => ({
    total: questions.length,
    saved: questions.filter((q) => q.saved).length,
    ai: questions.filter((q) => q.aiGenerated).length,
    templates: questions.filter((q) => q.template).length,
  }), [questions])

  const handleDelete = async (q: MentorInterviewQuestion) => {
    if (!window.confirm('Delete this custom question?')) return
    await deleteQuestion(q.id)
  }

  if (isLoading && questions.length === 0) {
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
          <p className="text-sm text-white font-semibold mb-1">Could not load question bank</p>
          <button type="button" onClick={() => refetch()} className="text-xs text-violet-400 hover:text-violet-300 mt-2">Try again</button>
        </div>
      </MentorPanelShell>
    )
  }

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Interview Question Bank</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Curated questions for your mock interview sessions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
            className="flex items-center gap-1.5 bg-[#161722] border border-[#2d2e3e] hover:border-violet-500/40 text-[#8b8ca8] hover:text-white text-xs font-bold px-3 py-2 rounded-lg"
          >
            <Plus size={13} /> Save Template
          </button>
          <button
            type="button"
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
          >
            <Sparkles size={13} /> AI Generate
          </button>
        </div>
      </div>

      <div className={MENTOR_STAT_GRID}>
        {[
          { label: 'Questions', value: stats.total },
          { label: 'Saved', value: stats.saved },
          { label: 'Templates', value: stats.templates },
          { label: 'AI Generated', value: stats.ai },
        ].map((s) => (
          <div key={s.label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3">
            <p className="text-[10px] text-[#8b8ca8]">{s.label}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <MentorFilterRow
        search={
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
            />
          </div>
        }
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              category === c.id
                ? 'bg-violet-600 text-white'
                : 'bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-[#3d3e52]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </MentorFilterRow>

      <div className="flex flex-wrap gap-2 items-center w-full">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDifficulty(d.id)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
              difficulty === d.id ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {d.label}
          </button>
        ))}
        <span className="text-[#3d3e52] mx-1">|</span>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
              view === v.id ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <HelpCircle size={40} className="text-[#3d3e52] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#8b8ca8]">No questions match your filters</p>
          <p className="text-xs text-[#5c5d72] mt-1 mb-4">Try another category or generate a new AI question.</p>
          <button
            type="button"
            onClick={() => setShowGenerate(true)}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
          >
            <Sparkles size={13} /> Generate with AI
          </button>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              expanded={expandedId === q.id}
              onToggleExpand={() => setExpandedId(expandedId === q.id ? null : q.id)}
              onToggleSave={() => toggleSave(q.id)}
              onDelete={q.custom ? () => handleDelete(q) : undefined}
            />
          ))}
        </div>
      )}

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} />}
      {showCreate && <CreateTemplateModal onClose={() => setShowCreate(false)} />}
    </MentorPanelShell>
  )
}
