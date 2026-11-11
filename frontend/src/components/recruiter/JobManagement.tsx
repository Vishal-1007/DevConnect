import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import type { RecruiterJob } from '../../data/recruiterData'
import { useSubscription } from '../../contexts/SubscriptionContext'

type JobForm = Omit<RecruiterJob, 'id' | 'applications' | 'postedAt'>

const EMPTY_FORM: JobForm = {
  title: '',
  company: 'Infosys',
  skills: [],
  experience: '0-3 Years',
  salary: '',
  location: 'Bangalore',
  minDevScore: 800,
  status: 'Active',
}

type Props = {
  jobs: RecruiterJob[]
  onChange: (jobs: RecruiterJob[]) => void
  onViewApplications?: () => void
  autoOpenCreate?: boolean
  onAutoOpenHandled?: () => void
}

export function JobManagement({
  jobs,
  onChange,
  onViewApplications,
  autoOpenCreate,
  onAutoOpenHandled,
}: Props) {
  const { consumeUsage, canUse, openUpgrade } = useSubscription()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<JobForm>(EMPTY_FORM)
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (autoOpenCreate) {
      setEditingId(null)
      setForm(EMPTY_FORM)
      setShowForm(true)
      onAutoOpenHandled?.()
    }
  }, [autoOpenCreate, onAutoOpenHandled])

  function openCreate() {
    if (!canUse('JOB_POST')) {
      openUpgrade('PRO')
      return
    }
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(job: RecruiterJob) {
    setEditingId(job.id)
    setForm({
      title: job.title,
      company: job.company,
      skills: [...job.skills],
      experience: job.experience,
      salary: job.salary,
      location: job.location,
      minDevScore: job.minDevScore,
      status: job.status,
    })
    setShowForm(true)
  }

  function addSkill() {
    const trimmed = skillInput.trim()
    if (!trimmed || form.skills.includes(trimmed)) return
    setForm({ ...form, skills: [...form.skills, trimmed] })
    setSkillInput('')
  }

  async function saveJob() {
    if (!form.title.trim()) return
    if (editingId) {
      onChange(jobs.map((j) => (j.id === editingId ? { ...j, ...form } : j)))
    } else {
      const allowed = await consumeUsage('JOB_POST')
      if (!allowed) return
      const newJob: RecruiterJob = {
        ...form,
        id: `j${Date.now()}`,
        applications: 0,
        postedAt: 'Just now',
      }
      onChange([newJob, ...jobs])
    }
    setShowForm(false)
    setEditingId(null)
  }

  async function deleteJob(id: string) {
    const job = jobs.find((j) => j.id === id)
    onChange(jobs.filter((j) => j.id !== id))
    if (job?.status === 'Active') {
      await consumeUsage('DECREMENT_JOB_POST')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Job Management</h2>
          <p className="text-sm text-[#8b8ca8]">
            {jobs.filter((j) => j.status === 'Active').length} active jobs · {jobs.length} total
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} />
          Create Job
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-md">
          <h3 className="mb-4 text-sm font-semibold text-white">
            {editingId ? 'Edit Job' : 'Create Job'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Job Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
            <input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
            <input
              placeholder="Experience"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
            <input
              placeholder="Salary"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
            <div>
              <label className="mb-1 block text-[11px] text-[#8b8ca8]">
                Minimum DevScore: {form.minDevScore}
              </label>
              <input
                type="range"
                min={0}
                max={1000}
                step={50}
                value={form.minDevScore}
                onChange={(e) => setForm({ ...form, minDevScore: Number(e.target.value) })}
                className="w-full accent-violet-500"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Add skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1 rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-lg border border-[#2d2e3e] px-3 text-sm text-white hover:border-violet-500/40"
            >
              Add
            </button>
          </div>
          {form.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.skills.map((s) => (
                <span key={s} className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[11px] text-violet-200">
                  {s}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={saveJob}
              className="rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2 text-sm font-semibold text-white"
            >
              Save Job
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-[#2d2e3e] px-4 py-2 text-sm text-[#8b8ca8]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-4 backdrop-blur-md"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{job.title}</h3>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-[#8b8ca8]">
                {job.company} · {job.location} · {job.salary}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-full border border-[#2d2e3e] bg-white/5 px-2 py-0.5 text-[11px] text-[#c4c5d6]">
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-violet-300">
                DevScore &gt; {job.minDevScore} required · {job.applications} applications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onViewApplications}
                className="flex items-center gap-1.5 rounded-lg border border-[#2d2e3e] bg-white/5 px-3 py-2 text-xs text-[#c4c5d6] hover:text-white"
              >
                <Users size={14} />
                Applications
              </button>
              <button
                type="button"
                onClick={() => openEdit(job)}
                className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => deleteJob(job.id)}
                className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
