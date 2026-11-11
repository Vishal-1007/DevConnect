import { useState } from 'react'
import { Code2, Loader2, Plus } from 'lucide-react'
import {
  CHALLENGE_CATEGORIES,
  DIFFICULTY_OPTIONS,
  useCreateMentorProblemMutation,
  useListMentorProblemsQuery,
  categoryLabel,
  difficultyBadgeClass,
  statusBadgeClass,
  type CreateCodingProblemRequest,
} from '../../api/codingProblemsApi'
import { extractApiError } from '../../lib/extractApiError'

const emptyForm = (): CreateCodingProblemRequest => ({
  title: '',
  description: '',
  difficulty: 'medium',
  category: 'DSA',
  languages: ['java'],
  tags: [],
  companies: [],
  starterCode: { java: 'class Solution {\n\n}' },
  testCases: [],
  hints: [],
  constraints: [],
  examples: [],
  status: 'PENDING_APPROVAL',
})

export function MentorCreateChallengePanel() {
  const { data: myProblems = [], isLoading, refetch } = useListMentorProblemsQuery()
  const [createProblem, { isLoading: creating }] = useCreateMentorProblemMutation()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateCodingProblemRequest>(emptyForm())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const inputClass = 'w-full h-9 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      await createProblem(form).unwrap()
      setSuccess('Custom challenge submitted for admin approval.')
      setForm(emptyForm())
      setShowForm(false)
      void refetch()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to create challenge')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Code2 size={16} className="text-emerald-400" /> My Challenges
          </h3>
          <p className="text-xs text-[#8b8ca8] mt-1">Create custom problems for your mentees</p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
          <Plus size={14} /> Create Challenge
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="rounded-xl border border-[#2d2e3e] bg-[#161722] p-4 space-y-3">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          <textarea required placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-auto py-2`} />
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
              {CHALLENGE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputClass}>
              {DIFFICULTY_OPTIONS.filter((d) => d.id !== 'all').map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <textarea rows={5} placeholder="Starter code" value={form.starterCode.java ?? ''} onChange={(e) => setForm({ ...form, starterCode: { java: e.target.value } })} className={`${inputClass} h-auto py-2 font-mono text-xs`} />
          <button type="submit" disabled={creating} className="px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50">{creating ? 'Creating…' : 'Submit for Approval'}</button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-[#8b8ca8] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading…</p>
      ) : myProblems.length === 0 ? (
        <p className="text-sm text-[#5c5d72]">You have not created any custom challenges yet.</p>
      ) : (
        <ul className="space-y-2">
          {myProblems.map((c) => (
            <li key={c.id} className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">{c.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${difficultyBadgeClass(c.difficulty)}`}>{c.difficulty}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadgeClass(c.status)}`}>{c.status}</span>
              </div>
              <p className="text-xs text-[#5c5d72]">{categoryLabel(c.category)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
