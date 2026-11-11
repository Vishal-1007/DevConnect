import { Briefcase, Plus, Trash2 } from 'lucide-react'
import { ProfileSectionHeader, profileInputCls, profileTextareaCls, normalizeMonthInput, MONTH_INPUT_MIN, MONTH_INPUT_MAX } from './profileUi'
import { newId, type WorkExperience } from '../../data/candidateProfileData'

type Props = {
  experiences: WorkExperience[]
  onChange: (experiences: WorkExperience[]) => void
}

export function ExperienceSection({ experiences, onChange }: Props) {
  function update(id: string, patch: Partial<WorkExperience>) {
    onChange(experiences.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function remove(id: string) {
    onChange(experiences.filter((e) => e.id !== id))
  }

  function add() {
    onChange([
      ...experiences,
      {
        id: newId('exp'),
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        responsibilities: '',
      },
    ])
  }

  function toggleCurrentlyWorking(id: string, checked: boolean) {
    onChange(
      experiences.map((e) =>
        e.id === id
          ? { ...e, currentlyWorking: checked, endDate: checked ? '' : e.endDate }
          : e,
      ),
    )
  }

  return (
    <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
      <div className="space-y-3 border-b border-[#2d2e3e] pb-4">
        <ProfileSectionHeader
          icon={Briefcase}
          title="Work Experience"
          desc="Your professional timeline visible to recruiters"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              add()
            }}
            className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
          >
            <Plus size={12} />
            Add Experience
          </button>
        </div>
      </div>

      <div className="relative space-y-0">
        {experiences.map((exp, idx) => (
          <div key={exp.id} className="relative flex gap-4 pb-6 last:pb-0">
            {idx < experiences.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#2d2e3e]" />
            )}
            <div className="relative z-10 mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-[#6366f1] bg-[#161722]" />
            <div className="flex-1 rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <input
                    className={profileInputCls}
                    value={exp.role}
                    onChange={(e) => update(exp.id, { role: e.target.value })}
                    placeholder="Role"
                  />
                  <input
                    className={profileInputCls}
                    value={exp.company}
                    onChange={(e) => update(exp.id, { company: e.target.value })}
                    placeholder="Company"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(exp.id)}
                  className="shrink-0 rounded-lg p-1.5 text-[#8b8ca8] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] text-[#8b8ca8]">Start Date</label>
                  <input
                    type="month"
                    min={MONTH_INPUT_MIN}
                    max={MONTH_INPUT_MAX}
                    className={profileInputCls}
                    value={exp.startDate}
                    onChange={(e) => update(exp.id, { startDate: normalizeMonthInput(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-[#8b8ca8]">End Date</label>
                  {exp.currentlyWorking ? (
                    <input
                      type="text"
                      readOnly
                      disabled
                      value=""
                      placeholder=""
                      className={`${profileInputCls} cursor-not-allowed opacity-40`}
                      aria-label="End date not applicable — currently working"
                    />
                  ) : (
                    <input
                      type="month"
                      min={MONTH_INPUT_MIN}
                      max={MONTH_INPUT_MAX}
                      className={profileInputCls}
                      value={exp.endDate}
                      onChange={(e) => update(exp.id, { endDate: normalizeMonthInput(e.target.value) })}
                    />
                  )}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={exp.currentlyWorking}
                  onChange={(e) => toggleCurrentlyWorking(exp.id, e.target.checked)}
                  className="h-4 w-4 rounded border-[#2d2e3e] accent-[#6366f1]"
                />
                <span className="text-xs text-[#8b8ca8]">Currently working here</span>
              </label>

              <textarea
                className={profileTextareaCls}
                value={exp.responsibilities}
                onChange={(e) => update(exp.id, { responsibilities: e.target.value })}
                placeholder="Key responsibilities and achievements..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
