import { useMemo, useState } from 'react'
import { Code2, Eye, Loader2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import Editor from '@monaco-editor/react'
import {
  categoryLabel,
  CHALLENGE_CATEGORIES,
  DIFFICULTY_OPTIONS,
  difficultyBadgeClass,
  PROGRAMMING_LANGUAGES,
  STATUS_OPTIONS,
  statusBadgeClass,
  useCreateAdminProblemMutation,
  useDeleteAdminProblemMutation,
  useListAdminProblemsQuery,
  useUpdateAdminProblemMutation,
  useUpdateAdminProblemStatusMutation,
  type CodingProblemDetail,
  type CreateCodingProblemRequest,
  type ProblemTestCase,
} from '../../api/codingProblemsApi'
import { extractApiError } from '../../lib/extractApiError'

type AdminView = 'manage' | 'add'

const emptyForm = (): CreateCodingProblemRequest => ({
  title: '',
  description: '',
  difficulty: 'medium',
  category: 'DSA',
  languages: ['java'],
  tags: [],
  companies: [],
  starterCode: { java: 'class Solution {\n\n}' },
  testCases: [{ name: 'Test Case 1', input: '', expected: '' }],
  solution: '',
  hints: [''],
  constraints: [''],
  examples: [{ input: '', output: '' }],
  status: 'DRAFT',
})

export function AdminCodingChallengesPanel() {
  const [view, setView] = useState<AdminView>('manage')
  const [q, setQ] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<CodingProblemDetail | null>(null)
  const [form, setForm] = useState<CreateCodingProblemRequest>(emptyForm())
  const [activeLang, setActiveLang] = useState('java')

  const { data: problems = [], isLoading, refetch } = useListAdminProblemsQuery({
    q: q || undefined,
    difficulty: difficultyFilter,
    category: categoryFilter,
    status: statusFilter,
  })
  const [createProblem, { isLoading: creating }] = useCreateAdminProblemMutation()
  const [updateProblem, { isLoading: updating }] = useUpdateAdminProblemMutation()
  const [updateStatus] = useUpdateAdminProblemStatusMutation()
  const [deleteProblem] = useDeleteAdminProblemMutation()

  const inputClass = 'w-full h-9 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm'

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function openAdd() {
    setEditing(null)
    setForm(emptyForm())
    setActiveLang('java')
    setView('add')
    setError(null)
  }

  function openEdit(problem: CodingProblemDetail) {
    setEditing(problem)
    setForm({
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      category: problem.category,
      languages: problem.languages,
      tags: problem.tags,
      companies: problem.companies,
      starterCode: problem.starterCode,
      testCases: problem.testCases.length ? problem.testCases : [{ name: 'Test Case 1', input: '', expected: '' }],
      solution: problem.solution ?? '',
      hints: problem.hints.length ? problem.hints : [''],
      constraints: problem.constraints.length ? problem.constraints : [''],
      examples: problem.examples.length ? problem.examples : [{ input: '', output: '' }],
      status: problem.status,
    })
    setActiveLang(problem.languages[0] ?? 'java')
    setView('add')
    setError(null)
  }

  async function save(status: 'DRAFT' | 'PUBLISHED') {
    setError(null)
    const payload: CreateCodingProblemRequest = {
      ...form,
      tags: form.tags.filter(Boolean),
      companies: form.companies.filter(Boolean),
      hints: form.hints?.filter(Boolean) ?? [],
      constraints: form.constraints?.filter(Boolean) ?? [],
      examples: form.examples?.filter((e) => e.input || e.output) ?? [],
      testCases: form.testCases.filter((t) => t.input || t.expected),
      status,
    }
    try {
      if (editing) {
        await updateProblem({ id: editing.id, body: payload }).unwrap()
        showToast(status === 'PUBLISHED' ? 'Problem published successfully' : 'Draft saved successfully')
      } else {
        await createProblem(payload).unwrap()
        showToast(status === 'PUBLISHED' ? 'Problem published successfully' : 'Draft saved successfully')
      }
      setView('manage')
      setEditing(null)
      setForm(emptyForm())
      void refetch()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to save problem')
    }
  }

  async function toggleStatus(problem: CodingProblemDetail) {
    const next = problem.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      await updateStatus({ id: problem.id, status: next }).unwrap()
      showToast(next === 'PUBLISHED' ? 'Problem published' : 'Problem unpublished')
    } catch (err) {
      setError(extractApiError(err) || 'Failed to update status')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this problem?')) return
    try {
      await deleteProblem(id).unwrap()
      showToast('Problem deleted')
    } catch (err) {
      setError(extractApiError(err) || 'Failed to delete')
    }
  }

  if (view === 'add') {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">{editing ? 'Edit Problem' : 'Add New Problem'}</h2>
            <p className="text-xs text-[#5c5d72] mt-0.5">Complete all fields before publishing</p>
          </div>
          <button type="button" onClick={() => { setView('manage'); setEditing(null) }} className="text-sm text-[#818cf8] hover:underline">
            ← Back to Manage Problems
          </button>
        </div>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        <div className="space-y-4 rounded-xl border border-[#2d2e3e] bg-[#161722] p-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8b8ca8] mb-1 block">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Two Sum" />
            </div>
            <div>
              <label className="text-xs text-[#8b8ca8] mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                {CHALLENGE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8b8ca8] mb-1 block">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputClass}>
                {DIFFICULTY_OPTIONS.filter((d) => d.id !== 'all').map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8b8ca8] mb-1 block">Languages (multi-select)</label>
              <div className="flex flex-wrap gap-2">
                {PROGRAMMING_LANGUAGES.map((l) => {
                  const selected = form.languages.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        const langs = selected ? form.languages.filter((x) => x !== l.id) : [...form.languages, l.id]
                        setForm({ ...form, languages: langs.length ? langs : [l.id] })
                        if (!selected) setActiveLang(l.id)
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border ${selected ? 'border-violet-500 bg-violet-500/20 text-white' : 'border-[#2d2e3e] text-[#8b8ca8]'}`}
                    >
                      {l.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8b8ca8] mb-1 block">Problem Description</label>
            <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-auto py-2`} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8b8ca8] mb-1 block">Tags (comma-separated)</label>
              <input value={form.tags.join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className={inputClass} placeholder="Array, HashMap" />
            </div>
            <div>
              <label className="text-xs text-[#8b8ca8] mb-1 block">Company Tags (comma-separated)</label>
              <input value={form.companies.join(', ')} onChange={(e) => setForm({ ...form, companies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className={inputClass} placeholder="Amazon, Google" />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8b8ca8] mb-2 block">Examples</label>
            {form.examples?.map((ex, i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-2 mb-2">
                <input value={ex.input} onChange={(e) => { const examples = [...(form.examples ?? [])]; examples[i] = { ...ex, input: e.target.value }; setForm({ ...form, examples }) }} placeholder="Input" className={inputClass} />
                <input value={ex.output} onChange={(e) => { const examples = [...(form.examples ?? [])]; examples[i] = { ...ex, output: e.target.value }; setForm({ ...form, examples }) }} placeholder="Output" className={inputClass} />
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, examples: [...(form.examples ?? []), { input: '', output: '' }] })} className="text-xs text-violet-400 hover:underline">+ Add example</button>
          </div>

          <div>
            <label className="text-xs text-[#8b8ca8] mb-2 block">Constraints</label>
            {form.constraints?.map((c, i) => (
              <input key={i} value={c} onChange={(e) => { const constraints = [...(form.constraints ?? [])]; constraints[i] = e.target.value; setForm({ ...form, constraints }) }} className={`${inputClass} mb-2`} placeholder="2 <= nums.length <= 10^4" />
            ))}
            <button type="button" onClick={() => setForm({ ...form, constraints: [...(form.constraints ?? []), ''] })} className="text-xs text-violet-400 hover:underline">+ Add constraint</button>
          </div>

          <div>
            <div className="flex gap-2 mb-2">
              {form.languages.map((l) => (
                <button key={l} type="button" onClick={() => setActiveLang(l)} className={`px-2 py-1 rounded text-xs ${activeLang === l ? 'bg-violet-600 text-white' : 'bg-[#0b0c14] text-[#8b8ca8]'}`}>{l}</button>
              ))}
            </div>
            <label className="text-xs text-[#8b8ca8] mb-1 block">Starter Code ({activeLang})</label>
            <div className="rounded-lg overflow-hidden border border-[#2d2e3e] h-48">
              <Editor
                language={activeLang === 'cpp' ? 'cpp' : activeLang}
                theme="vs-dark"
                value={form.starterCode[activeLang] ?? ''}
                onChange={(v) => setForm({ ...form, starterCode: { ...form.starterCode, [activeLang]: v ?? '' } })}
                options={{ readOnly: false, minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8b8ca8] mb-2 block">Test Cases</label>
            {form.testCases.map((tc, i) => (
              <TestCaseRow key={i} tc={tc} onChange={(next) => { const testCases = [...form.testCases]; testCases[i] = next; setForm({ ...form, testCases }) }} />
            ))}
            <button type="button" onClick={() => setForm({ ...form, testCases: [...form.testCases, { name: `Test Case ${form.testCases.length + 1}`, input: '', expected: '' }] })} className="text-xs text-violet-400 hover:underline">+ Add test case</button>
          </div>

          <div>
            <label className="text-xs text-[#8b8ca8] mb-1 block">Solution Explanation (hidden from students)</label>
            <textarea rows={3} value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} className={`${inputClass} h-auto py-2 font-mono text-xs`} />
          </div>

          <div>
            <label className="text-xs text-[#8b8ca8] mb-2 block">Hints</label>
            {form.hints?.map((h, i) => (
              <input key={i} value={h} onChange={(e) => { const hints = [...(form.hints ?? [])]; hints[i] = e.target.value; setForm({ ...form, hints }) }} className={`${inputClass} mb-2`} placeholder="Hint for students" />
            ))}
            <button type="button" onClick={() => setForm({ ...form, hints: [...(form.hints ?? []), ''] })} className="text-xs text-violet-400 hover:underline">+ Add hint</button>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-[#2d2e3e]">
            <button type="button" onClick={() => { setView('manage'); setEditing(null) }} className="px-4 py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] text-sm">Cancel</button>
            <button type="button" disabled={creating || updating} onClick={() => void save('DRAFT')} className="px-4 py-2 rounded-lg border border-violet-500/40 text-violet-300 text-sm font-semibold disabled:opacity-50">Save Draft</button>
            <button type="button" disabled={creating || updating} onClick={() => void save('PUBLISHED')} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-50">Publish Problem</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Code2 size={18} className="text-violet-400" /> Manage Problems</h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">{problems.length} problems in database</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void refetch()} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"><RefreshCw size={14} /></button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500"><Plus size={14} /> Add New Problem</button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <div className="relative sm:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, tag, company…" className={`pl-9 ${inputClass}`} />
        </div>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className={inputClass}>{DIFFICULTY_OPTIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>{STATUS_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
      </div>
      <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${inputClass} mb-4 max-w-xs`}>
        <option value="all">All categories</option>
        {CHALLENGE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
      ) : problems.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3e] bg-[#161722] p-12 text-center text-sm text-[#5c5d72]">No problems yet. Click Add New Problem to create one.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2d2e3e]">
          <table className="w-full text-sm">
            <thead className="bg-[#0f1018] text-[#5c5d72] text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Problem</th>
                <th className="text-left px-4 py-3">Difficulty</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Languages</th>
                <th className="text-left px-4 py-3">Companies</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id} className="border-t border-[#2d2e3e] bg-[#161722] hover:bg-[#1a1b28]">
                  <td className="px-4 py-3 font-medium text-white">{p.title}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${difficultyBadgeClass(p.difficulty)}`}>{p.difficulty}</span></td>
                  <td className="px-4 py-3 text-[#8b8ca8]">{categoryLabel(p.category)}</td>
                  <td className="px-4 py-3 text-[#8b8ca8]">{p.languages.join(', ')}</td>
                  <td className="px-4 py-3 text-[#8b8ca8] truncate max-w-[120px]">{p.companies.slice(0, 2).join(', ') || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadgeClass(p.status)}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-[#5c5d72] text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs text-violet-400 hover:underline inline-flex items-center gap-1"><Eye size={12} /> Edit</button>
                      <button onClick={() => void toggleStatus(p)} className="text-xs text-amber-400 hover:underline">{p.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>
                      <button onClick={() => void handleDelete(p.id)} className="text-[#5c5d72] hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TestCaseRow({ tc, onChange }: { tc: ProblemTestCase; onChange: (tc: ProblemTestCase) => void }) {
  const inputClass = 'w-full h-9 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm'
  return (
    <div className="grid sm:grid-cols-3 gap-2 mb-2 p-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e]">
      <input value={tc.name} onChange={(e) => onChange({ ...tc, name: e.target.value })} placeholder="Name" className={inputClass} />
      <input value={tc.input} onChange={(e) => onChange({ ...tc, input: e.target.value })} placeholder="Input" className={inputClass} />
      <input value={tc.expected} onChange={(e) => onChange({ ...tc, expected: e.target.value })} placeholder="Expected output" className={inputClass} />
    </div>
  )
}
