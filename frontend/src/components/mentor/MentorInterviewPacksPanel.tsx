/**
 * Mentor interview packs — question set builder, reviews, analytics.
 */
import { useMemo, useState } from 'react'
import {
  Briefcase, Plus, Loader2, Trash2, Copy, BarChart3, ClipboardCheck,
  Star, X, Check,
} from 'lucide-react'
import {
  useMentorInterviewPacksQuery,
  useCreateInterviewPackMutation,
  useDeleteInterviewPackMutation,
  useDuplicateInterviewPackMutation,
  usePublishInterviewPackMutation,
  useMentorInterviewAssignmentsQuery,
  useMentorInterviewAssignmentDetailQuery,
  useSubmitMentorInterviewFeedbackMutation,
  useMentorInterviewAnalyticsQuery,
  type CreateInterviewPackRequest,
} from '../../api/interviewMarketplaceApi'
import { useGetMentorInterviewQuestionsQuery } from '../../api/mentorWorkspaceApi'
import { useGetMentorStudentsQuery } from '../../api/mentorWorkspaceApi'
import { extractApiError } from '../../lib/extractApiError'
import { MentorPanelShell, MENTOR_STAT_GRID } from './MentorPanelShell'

type SubTab = 'packs' | 'reviews' | 'analytics'

const VISIBILITY_OPTIONS = [
  { id: 'ASSIGNED_ONLY', label: 'Assigned Only' },
  { id: 'PUBLIC_FREE', label: 'Public Free' },
  { id: 'PUBLIC_PAID', label: 'Public Paid' },
] as const

function CreatePackModal({ onClose }: { onClose: () => void }) {
  const { data: questions } = useGetMentorInterviewQuestionsQuery({ view: 'all' })
  const { data: students } = useGetMentorStudentsQuery()
  const [create, { isLoading }] = useCreateInterviewPackMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [visibility, setVisibility] = useState<CreateInterviewPackRequest['visibility']>('PUBLIC_FREE')
  const [priceCents, setPriceCents] = useState(29900)
  const [validityDays, setValidityDays] = useState<number | ''>('')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [selectedLearners, setSelectedLearners] = useState<string[]>([])
  const [error, setError] = useState('')

  const selectableQuestions = questions ?? []

  const toggleQuestion = (id: string) => {
    setSelectedQuestions((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleLearner = (id: string) => {
    setSelectedLearners((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const submit = async (publish: boolean) => {
    if (!title.trim() || selectedQuestions.length === 0) return
    setError('')
    try {
      await create({
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes,
        difficulty,
        visibility,
        priceCents: visibility === 'PUBLIC_PAID' ? priceCents : 0,
        currency: 'INR',
        validityDays: validityDays === '' ? null : Number(validityDays),
        questionIds: selectedQuestions,
        assignToLearnerIds: visibility === 'ASSIGNED_ONLY' ? selectedLearners : undefined,
        publish: publish || visibility === 'ASSIGNED_ONLY',
      }).unwrap()
      onClose()
    } catch (e) {
      setError(extractApiError(e))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#12131c] border border-[#2d2e3e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#2d2e3e]">
          <h3 className="font-bold text-white">Create Question Set</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-[#8b8ca8]" /></button>
        </div>
        <div className="p-4 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pack title" className="w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full p-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm">
              {['easy', 'medium', 'hard', 'expert'].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} placeholder="Duration (min)" className="h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#8b8ca8] mb-2">Visibility</p>
            <div className="flex flex-wrap gap-2">
              {VISIBILITY_OPTIONS.map((v) => (
                <button key={v.id} type="button" onClick={() => setVisibility(v.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${visibility === v.id ? 'bg-violet-600/30 border-violet-500/50 text-white' : 'border-[#2d2e3e] text-[#8b8ca8]'}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          {visibility === 'PUBLIC_PAID' && (
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={priceCents / 100} onChange={(e) => setPriceCents(Math.round(Number(e.target.value) * 100))} placeholder="Price (₹)" className="h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm" />
              <input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Validity days (blank=lifetime)" className="h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm" />
            </div>
          )}
          {visibility === 'ASSIGNED_ONLY' && students && students.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#8b8ca8] mb-2">Assign To</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {students.map((s) => (
                  <label key={s.learnerId} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="checkbox" checked={selectedLearners.includes(s.learnerId)} onChange={() => toggleLearner(s.learnerId)} className="rounded" />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-[#8b8ca8] mb-2">Questions ({selectedQuestions.length} selected)</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {selectableQuestions.map((q) => (
                <label key={q.id} className="flex items-start gap-2 text-xs text-[#8b8ca8] cursor-pointer p-2 rounded-lg hover:bg-[#1c1d2a]">
                  <input type="checkbox" checked={selectedQuestions.includes(q.id)} onChange={() => toggleQuestion(q.id)} className="mt-0.5 rounded" />
                  <span className="line-clamp-2">{q.questionText}</span>
                </label>
              ))}
              {selectableQuestions.length === 0 && <p className="text-xs text-[#5c5d72]">Add questions in the Interview Question Bank tab first.</p>}
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            {(visibility === 'PUBLIC_FREE' || visibility === 'PUBLIC_PAID') && (
              <button type="button" disabled={isLoading || !title.trim() || selectedQuestions.length === 0} onClick={() => submit(false)} className="flex-1 py-2.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] text-sm font-bold hover:text-white disabled:opacity-50">
                Save Draft
              </button>
            )}
            <button type="button" disabled={isLoading || !title.trim() || selectedQuestions.length === 0} onClick={() => submit(true)} className="flex-1 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {visibility === 'ASSIGNED_ONLY' ? 'Publish & Assign' : 'Publish to Marketplace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewPanel() {
  const { data: assignments } = useMentorInterviewAssignmentsQuery({ status: 'SUBMITTED' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: detail } = useMentorInterviewAssignmentDetailQuery(selectedId!, { skip: !selectedId })
  const [submitFeedback, { isLoading }] = useSubmitMentorInterviewFeedbackMutation()
  const [score, setScore] = useState(8)
  const [strengths, setStrengths] = useState('')
  const [improvements, setImprovements] = useState('')
  const [recommendations, setRecommendations] = useState('')

  const submit = async () => {
    if (!selectedId) return
    await submitFeedback({
      id: selectedId,
      overallScore: score,
      strengths: strengths || undefined,
      improvements: improvements || undefined,
      recommendations: recommendations || undefined,
    }).unwrap()
    setSelectedId(null)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-xs font-bold text-[#8b8ca8] uppercase">Pending Reviews</p>
        {!assignments?.length && <p className="text-sm text-[#5c5d72]">No submissions awaiting review.</p>}
        {assignments?.map((a) => (
          <button key={a.id} type="button" onClick={() => setSelectedId(a.id)} className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedId === a.id ? 'border-violet-500/50 bg-violet-600/10' : 'border-[#2d2e3e] bg-[#161722] hover:border-violet-500/30'}`}>
            <p className="font-bold text-white text-sm">{a.packTitle}</p>
            <p className="text-xs text-[#8b8ca8]">{a.statusLabel} · {a.questionCount} questions</p>
          </button>
        ))}
      </div>
      {detail && (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-white">{detail.packTitle}</h3>
          {detail.submissions.map((s, i) => (
            <div key={s.questionId} className="p-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-xs">
              <p className="text-[#8b8ca8] mb-1">Answer {i + 1}</p>
              <p className="text-white whitespace-pre-wrap line-clamp-4">{s.answerText || s.answerCode || '(no answer)'}</p>
            </div>
          ))}
          <input type="number" min={0} max={10} step={0.5} value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm" placeholder="Overall score /10" />
          <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="Strengths" rows={2} className="w-full p-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm resize-none" />
          <textarea value={improvements} onChange={(e) => setImprovements(e.target.value)} placeholder="Areas for improvement" rows={2} className="w-full p-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm resize-none" />
          <textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} placeholder="Recommendations" rows={2} className="w-full p-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm resize-none" />
          <button type="button" disabled={isLoading} onClick={submit} className="w-full py-2 rounded-lg dc-gradient-btn text-white text-sm font-bold">Submit Feedback</button>
        </div>
      )}
    </div>
  )
}

export function MentorInterviewPacksPanel() {
  const [subTab, setSubTab] = useState<SubTab>('packs')
  const [showCreate, setShowCreate] = useState(false)
  const { data: packs, isLoading } = useMentorInterviewPacksQuery()
  const { data: analytics } = useMentorInterviewAnalyticsQuery(undefined, { skip: subTab !== 'analytics' })
  const [deletePack] = useDeleteInterviewPackMutation()
  const [duplicatePack] = useDuplicateInterviewPackMutation()
  const [publishPack] = usePublishInterviewPackMutation()

  const stats = useMemo(() => [
    { label: 'Question Sets', value: analytics?.questionSetsCreated ?? packs?.length ?? 0 },
    { label: 'Revenue', value: analytics?.revenueLabel ?? '₹0' },
    { label: 'Pending Reviews', value: analytics?.pendingReviews ?? 0 },
    { label: 'Avg Rating', value: analytics ? analytics.averageRating.toFixed(1) : '—' },
  ], [analytics, packs])

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
            <Briefcase size={18} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Interview Packs & Marketplace</h2>
            <p className="text-xs text-[#8b8ca8] mt-0.5">Build question sets, assign learners, sell on the marketplace, and review submissions.</p>
          </div>
        </div>
        {subTab === 'packs' && (
          <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg dc-gradient-btn text-white text-xs font-bold shrink-0">
            <Plus size={12} /> New Pack
          </button>
        )}
      </div>
      <div className={MENTOR_STAT_GRID}>
        {stats.map((s) => (
          <div key={s.label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase text-[#5c5d72]">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4 mb-4">
        {([
          ['packs', 'Question Sets', Briefcase],
          ['reviews', 'Pending Reviews', ClipboardCheck],
          ['analytics', 'Analytics', BarChart3],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setSubTab(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === id ? 'bg-violet-600 text-white' : 'bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8]'}`}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {subTab === 'packs' && (
        isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-violet-400" /></div>
        ) : !packs?.length ? (
          <div className="text-center py-12 border border-dashed border-[#2d2e3e] rounded-xl">
            <Briefcase className="w-10 h-10 text-[#5c5d72] mx-auto mb-3" />
            <p className="text-white font-semibold">No question sets yet</p>
            <p className="text-sm text-[#8b8ca8] mt-1">Combine questions into packs for assignment or marketplace sale.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {packs.map((p) => (
              <div key={p.id} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{p.title}</h3>
                    <p className="text-xs text-[#8b8ca8] mt-0.5">{p.questionCount} questions · {p.visibility.replace('_', ' ')}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => duplicatePack(p.id)} title="Duplicate" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]"><Copy size={12} /></button>
                    <button type="button" onClick={() => deletePack(p.id)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8b8ca8] hover:text-red-400 hover:bg-[#2d2e3e]"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-[#8b8ca8]">
                  <Star size={10} className="text-amber-400 fill-amber-400" /> {p.avgRating.toFixed(1)}
                  <span>{p.free ? 'Free' : p.priceLabel}</span>
                  <span>{p.salesCount} sales</span>
                  <span className={`px-1.5 py-0.5 rounded-full border ${
                    p.status === 'PUBLISHED' ? 'border-emerald-500/30 text-emerald-300' : 'border-amber-500/30 text-amber-300'
                  }`}>{p.status}</span>
                </div>
                {p.status === 'DRAFT' && (p.visibility === 'PUBLIC_FREE' || p.visibility === 'PUBLIC_PAID') && (
                  <button type="button" onClick={() => publishPack(p.id)} className="mt-2 w-full py-1.5 rounded-lg dc-gradient-btn text-white text-[11px] font-bold">
                    Publish to Marketplace
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {subTab === 'reviews' && <ReviewPanel />}

      {subTab === 'analytics' && analytics && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            ['Public Free Packs', analytics.publicFreePacks],
            ['Public Paid Packs', analytics.publicPaidPacks],
            ['Private Assignments', analytics.privateAssignments],
            ['Total Purchases', analytics.totalPurchases],
            ['Completion Rate', `${analytics.completionRatePct.toFixed(0)}%`],
            ['Pending Reviews', analytics.pendingReviews],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
              <p className="text-xs text-[#8b8ca8]">{label}</p>
              <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreatePackModal onClose={() => setShowCreate(false)} />}
    </MentorPanelShell>
  )
}
