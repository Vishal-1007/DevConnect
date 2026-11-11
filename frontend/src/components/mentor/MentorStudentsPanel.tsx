/**
 * MentorStudentsPanel — mentee management with profiles, tasks, roadmaps, and notes.
 */
import { useMemo, useState, useEffect } from 'react'
import {
  Search, Users, Video, Edit3, X, Loader2, Target, TrendingUp,
  CheckCircle2, Circle, Plus, Trash2, CalendarDays, Briefcase,
  RefreshCw, StickyNote, History, Map,
  ChevronRight,
} from 'lucide-react'
import {
  useGetMentorStudentsQuery,
  useGetMentorStudentDetailQuery,
  useUpdateMentorStudentMutation,
  useCreateMentorStudentTaskMutation,
  useUpdateMentorStudentTaskMutation,
  useDeleteMentorStudentTaskMutation,
  useCreateMentorStudentRoadmapItemMutation,
  useUpdateMentorStudentRoadmapItemMutation,
  useDeleteMentorStudentRoadmapItemMutation,
  type MentorStudent,
} from '../../api/mentorWorkspaceApi'

type CategoryFilter = 'all' | 'job_seeker' | 'beginner' | 'interview_prep' | 'career_switch' | 'active_project'

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All Students' },
  { id: 'interview_prep', label: 'Interview Prep' },
  { id: 'job_seeker', label: 'Job Seekers' },
  { id: 'beginner', label: 'Beginners' },
  { id: 'career_switch', label: 'Career Switch' },
  { id: 'active_project', label: 'Active Projects' },
]

const CATEGORIES = [
  { id: 'interview_prep', label: 'Interview Prep' },
  { id: 'job_seeker', label: 'Job Seeker' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'career_switch', label: 'Career Switch' },
  { id: 'active_project', label: 'Active Project' },
]

function Av({ name, size = 40 }: { name: string; size?: number }) {
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

function Pill({ children, color }: { children: React.ReactNode; color: 'green' | 'gray' | 'violet' | 'blue' | 'amber' | 'red' }) {
  const cls = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    red: 'bg-red-500/15 text-red-400 border-red-500/25',
  }[color]
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  )
}

function ProgressBar({ value, color = '#818cf8' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 bg-[#2d2e3e] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

function ReadinessRing({ pct }: { pct: number }) {
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#2d2e3e" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} 100`} strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{pct}%</span>
    </div>
  )
}

function ImprovementChart({ points }: { points: { label: string; progressPct: number }[] }) {
  const max = Math.max(...points.map((p) => p.progressPct), 1)
  return (
    <div className="flex items-end gap-1.5 h-16">
      {points.map((p) => (
        <div key={p.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-violet-500/60 min-h-[4px] transition-all"
            style={{ height: `${Math.max(8, (p.progressPct / max) * 56)}px` }}
            title={`${p.label}: ${p.progressPct}%`}
          />
          <span className="text-[8px] text-[#5c5d72] truncate w-full text-center">{p.label}</span>
        </div>
      ))}
    </div>
  )
}

function StudentDetailDrawer({ student, onClose }: { student: MentorStudent; onClose: () => void }) {
  const { data: detail, isLoading, refetch } = useGetMentorStudentDetailQuery(student.learnerId)
  const [updateStudent, { isLoading: saving }] = useUpdateMentorStudentMutation()
  const [createTask] = useCreateMentorStudentTaskMutation()
  const [updateTask] = useUpdateMentorStudentTaskMutation()
  const [deleteTask] = useDeleteMentorStudentTaskMutation()
  const [createRoadmap] = useCreateMentorStudentRoadmapItemMutation()
  const [updateRoadmap] = useUpdateMentorStudentRoadmapItemMutation()
  const [deleteRoadmap] = useDeleteMentorStudentRoadmapItemMutation()

  const [tab, setTab] = useState<'overview' | 'history' | 'tasks' | 'roadmap'>('overview')
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState(student.category)
  const [weakArea, setWeakArea] = useState(student.weakArea)
  const [strongArea, setStrongArea] = useState(student.strongArea)
  const [readiness, setReadiness] = useState(student.interviewReadinessPct)
  const [target, setTarget] = useState(student.interviewTarget)
  const [dirty, setDirty] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newRoadmapTitle, setNewRoadmapTitle] = useState('')

  const syncFromDetail = () => {
    if (!detail) return
    setNotes(detail.notes)
    setCategory(detail.category)
    setWeakArea(detail.weakArea)
    setStrongArea(detail.strongArea)
    setReadiness(detail.interviewReadinessPct)
    setTarget(detail.interviewTarget)
    setDirty(false)
  }

  useEffect(() => {
    if (detail) syncFromDetail()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.learnerId])

  const handleSave = async () => {
    await updateStudent({
      learnerId: student.learnerId,
      body: { notes, category, weakArea, strongArea, interviewReadinessPct: readiness, interviewTarget: target },
    }).unwrap()
    setDirty(false)
    refetch()
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    await createTask({ learnerId: student.learnerId, title: newTaskTitle.trim() }).unwrap()
    setNewTaskTitle('')
  }

  const handleAddRoadmap = async () => {
    if (!newRoadmapTitle.trim()) return
    await createRoadmap({ learnerId: student.learnerId, title: newRoadmapTitle.trim() }).unwrap()
    setNewRoadmapTitle('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#12131a] border-l border-[#2d2e3e] flex flex-col h-full shadow-2xl animate-in slide-in-from-right">
        <div className="p-5 border-b border-[#2d2e3e] flex items-start gap-4">
          <Av name={student.name} size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-white">{student.name}</h2>
              <Pill color="gray">{student.role}</Pill>
              <Pill color={student.status === 'Active' ? 'green' : 'gray'}>{student.status}</Pill>
            </div>
            <p className="text-xs text-[#8b8ca8]">{student.categoryLabel} · {student.sessions} sessions · Last {student.lastSessionLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[#5c5d72] hover:text-white hover:bg-[#2d2e3e]">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-[#2d2e3e] px-5 gap-1 overflow-x-auto">
          {([
            ['overview', 'Overview', StickyNote],
            ['history', 'History', History],
            ['tasks', 'Tasks', CheckCircle2],
            ['roadmap', 'Roadmap', Map],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === id ? 'border-violet-500 text-violet-300' : 'border-transparent text-[#5c5d72] hover:text-white'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
          ) : !detail ? null : (
            <>
              {tab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3">
                      <p className="text-[9px] text-[#5c5d72] mb-1">Progress</p>
                      <p className="text-xl font-bold text-emerald-400 mb-2">{detail.progressPct}%</p>
                      <ProgressBar value={detail.progressPct} />
                    </div>
                    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3 flex items-center gap-3">
                      <ReadinessRing pct={readiness} />
                      <div>
                        <p className="text-[9px] text-[#5c5d72]">Interview Readiness</p>
                        <p className="text-xs font-semibold text-white">{target || 'No target set'}</p>
                        <p className="text-[9px] text-emerald-400">+{detail.improvementPct}% improvement</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#161722] border border-red-500/20 rounded-xl p-3">
                      <p className="text-[9px] text-[#5c5d72] mb-1">Weak Area</p>
                      <input
                        value={weakArea}
                        onChange={(e) => { setWeakArea(e.target.value); setDirty(true) }}
                        className="w-full bg-transparent text-sm font-semibold text-red-400 focus:outline-none"
                      />
                    </div>
                    <div className="bg-[#161722] border border-emerald-500/20 rounded-xl p-3">
                      <p className="text-[9px] text-[#5c5d72] mb-1">Strong Area</p>
                      <input
                        value={strongArea}
                        onChange={(e) => { setStrongArea(e.target.value); setDirty(true) }}
                        className="w-full bg-transparent text-sm font-semibold text-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-white">Profile & Categorization</p>
                    <div>
                      <label className="text-[9px] text-[#5c5d72]">Category</label>
                      <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setDirty(true) }}
                        className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-[#5c5d72]">Interview Target</label>
                      <input
                        value={target}
                        onChange={(e) => { setTarget(e.target.value); setDirty(true) }}
                        placeholder="e.g. Amazon, Google, Staff Engineer"
                        className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#5c5d72]">Interview Readiness ({readiness}%)</label>
                      <input
                        type="range" min={0} max={100} value={readiness}
                        onChange={(e) => { setReadiness(Number(e.target.value)); setDirty(true) }}
                        className="mt-2 w-full accent-violet-500"
                      />
                    </div>
                  </div>

                  <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
                    <p className="text-xs font-bold text-white mb-2">Mentor Notes</p>
                    <textarea
                      value={notes || detail.notes}
                      onChange={(e) => { setNotes(e.target.value); setDirty(true) }}
                      rows={4}
                      placeholder="Add notes about this student's goals, weaknesses, and progress..."
                      className="w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>

                  <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={14} className="text-violet-400" />
                      <p className="text-xs font-bold text-white">Improvement Trend</p>
                    </div>
                    <ImprovementChart points={detail.improvementTrend} />
                  </div>
                </div>
              )}

              {tab === 'history' && (
                <div className="space-y-2">
                  {detail.sessionHistory.length === 0 ? (
                    <p className="text-xs text-[#5c5d72] text-center py-8">No sessions yet</p>
                  ) : detail.sessionHistory.map((s) => (
                    <div key={s.bookingId} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <CalendarDays size={14} className="text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{s.title}</p>
                        <p className="text-[10px] text-[#5c5d72]">{s.dateLabel} · {s.durationMinutes} min · {s.requestType}</p>
                      </div>
                      <Pill color={s.status === 'completed' ? 'green' : s.status === 'confirmed' ? 'blue' : 'amber'}>
                        {s.status}
                      </Pill>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'tasks' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Assign a new task..."
                      className="flex-1 bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <button type="button" onClick={handleAddTask} className="px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500">
                      <Plus size={14} />
                    </button>
                  </div>
                  {detail.tasks.length === 0 ? (
                    <p className="text-xs text-[#5c5d72] text-center py-8">No tasks assigned yet</p>
                  ) : detail.tasks.map((t) => (
                    <div key={t.id} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => updateTask({
                          learnerId: student.learnerId,
                          taskId: t.id,
                          status: t.status === 'completed' ? 'pending' : 'completed',
                        })}
                        className="mt-0.5 text-violet-400 hover:text-emerald-400"
                      >
                        {t.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${t.status === 'completed' ? 'text-[#5c5d72] line-through' : 'text-white'}`}>{t.title}</p>
                        {t.description && <p className="text-[10px] text-[#5c5d72] mt-0.5">{t.description}</p>}
                        {t.dueDateLabel && <p className="text-[9px] text-amber-400 mt-1">Due {t.dueDateLabel}</p>}
                      </div>
                      <Pill color={t.status === 'completed' ? 'green' : t.status === 'in_progress' ? 'blue' : 'gray'}>{t.status.replace('_', ' ')}</Pill>
                      <button type="button" onClick={() => deleteTask({ learnerId: student.learnerId, taskId: t.id })} className="text-[#5c5d72] hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'roadmap' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={newRoadmapTitle}
                      onChange={(e) => setNewRoadmapTitle(e.target.value)}
                      placeholder="Add roadmap milestone..."
                      className="flex-1 bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRoadmap()}
                    />
                    <button type="button" onClick={handleAddRoadmap} className="px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500">
                      <Plus size={14} />
                    </button>
                  </div>
                  {detail.roadmap.length === 0 ? (
                    <p className="text-xs text-[#5c5d72] text-center py-8">No roadmap items yet</p>
                  ) : detail.roadmap.map((item, idx) => (
                    <div key={item.id} className="relative pl-6">
                      {idx < detail.roadmap.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#2d2e3e]" />
                      )}
                      <div className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                        item.status === 'completed' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : item.status === 'active' ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                          : 'border-[#3d3e52] bg-[#161722] text-[#5c5d72]'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3 ml-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-white">{item.title}</p>
                            {item.milestone && <p className="text-[10px] text-[#5c5d72]">{item.milestone}</p>}
                          </div>
                          <select
                            value={item.status}
                            onChange={(e) => updateRoadmap({ learnerId: student.learnerId, itemId: item.id, status: e.target.value })}
                            className="bg-[#12131a] border border-[#2d2e3e] rounded text-[9px] text-white px-1.5 py-0.5"
                          >
                            <option value="locked">Locked</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <button type="button" onClick={() => deleteRoadmap({ learnerId: student.learnerId, itemId: item.id })} className="mt-2 text-[9px] text-[#5c5d72] hover:text-red-400 flex items-center gap-1">
                          <Trash2 size={10} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {tab === 'overview' && (
          <div className="p-5 border-t border-[#2d2e3e] flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <StickyNote size={14} />}
              Save Profile
            </button>
            <button type="button" className="px-4 py-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600 hover:text-white flex items-center gap-1.5">
              <Video size={14} /> Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function MentorStudentsPanel() {
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MentorStudent | null>(null)
  const { data: students = [], isLoading, refetch, isFetching } = useGetMentorStudentsQuery(
    filter === 'all' ? undefined : { category: filter },
  )

  const filtered = useMemo(() =>
    students.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
      || s.weakArea.toLowerCase().includes(search.toLowerCase())
      || s.strongArea.toLowerCase().includes(search.toLowerCase())
      || s.interviewTarget.toLowerCase().includes(search.toLowerCase()),
    ),
  [students, search])

  const stats = useMemo(() => ({
    active: students.filter((s) => s.status === 'Active').length,
    interviewPrep: students.filter((s) => s.category === 'interview_prep').length,
    avgReadiness: students.length
      ? Math.round(students.reduce((a, s) => a + s.interviewReadinessPct, 0) / students.length)
      : 0,
  }), [students])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Mentees', value: stats.active, icon: Users, color: 'text-cyan-400' },
          { label: 'Interview Prep', value: stats.interviewPrep, icon: Target, color: 'text-violet-400' },
          { label: 'Avg Readiness', value: `${stats.avgReadiness}%`, icon: Briefcase, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={color} />
              <p className="text-[10px] text-[#5c5d72]">{label}</p>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              filter === t.id
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white">
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500 w-44"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-[#3d3e52] mb-3" />
          <p className="text-sm font-semibold text-white">No students yet</p>
          <p className="text-xs text-[#5c5d72] mt-1">Accept session requests to build your student list.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.learnerId}
              className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 hover:border-[#3d3e52] transition-colors cursor-pointer group"
              onClick={() => setSelected(s)}
            >
              <div className="flex items-start gap-4">
                <Av name={s.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-white">{s.name}</span>
                    <Pill color="gray">{s.role}</Pill>
                    <Pill color={s.status === 'Active' ? 'green' : 'gray'}>{s.status}</Pill>
                    <Pill color="violet">{s.categoryLabel}</Pill>
                    {s.interviewTarget && <Pill color="amber"><Target size={8} /> {s.interviewTarget}</Pill>}
                    <span className="ml-auto text-[10px] text-[#5c5d72]">Last: {s.lastSessionLabel}</span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                    <div><p className="text-[9px] text-[#5c5d72]">Sessions</p><p className="text-sm font-bold text-white">{s.sessions}</p></div>
                    <div><p className="text-[9px] text-[#5c5d72]">Progress</p><p className="text-sm font-bold text-emerald-400">{s.progressPct}%</p></div>
                    <div><p className="text-[9px] text-[#5c5d72]">Weak Area</p><p className="text-xs font-semibold text-red-400">{s.weakArea}</p></div>
                    <div><p className="text-[9px] text-[#5c5d72]">Strong Area</p><p className="text-xs font-semibold text-emerald-400">{s.strongArea}</p></div>
                    <div><p className="text-[9px] text-[#5c5d72]">Readiness</p><p className="text-sm font-bold text-violet-400">{s.interviewReadinessPct}%</p></div>
                  </div>
                  {s.notesPreview && (
                    <p className="text-[10px] text-[#8b8ca8] mb-2 line-clamp-1 italic">&ldquo;{s.notesPreview}&rdquo;</p>
                  )}
                  <div className="flex items-center gap-3">
                    <ProgressBar value={s.progressPct} />
                    {s.pendingTaskCount > 0 && (
                      <span className="text-[9px] text-amber-400 shrink-0">{s.pendingTaskCount} tasks pending</span>
                    )}
                    {s.improvementPct > 0 && (
                      <span className="text-[9px] text-emerald-400 shrink-0 flex items-center gap-0.5">
                        <TrendingUp size={10} /> +{s.improvementPct}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelected(s) }}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600 hover:text-white transition-colors"
                  >
                    <Edit3 size={11} /> Manage
                  </button>
                  <ChevronRight size={14} className="text-[#5c5d72]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <StudentDetailDrawer student={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
