import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import { ProfileSectionHeader, profileInputCls, normalizeYearInput } from './profileUi'
import { newId, type Education } from '../../data/candidateProfileData'

type Props = {
  education: Education[]
  onChange: (education: Education[]) => void
}

export function EducationSection({ education, onChange }: Props) {
  function update(id: string, patch: Partial<Education>) {
    onChange(education.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function remove(id: string) {
    onChange(education.filter((e) => e.id !== id))
  }

  function add() {
    onChange([
      ...education,
      { id: newId('edu'), college: '', degree: '', branch: '', graduationYear: '', cgpa: '' },
    ])
  }

  return (
    <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-[#2d2e3e] pb-4">
        <ProfileSectionHeader
          icon={GraduationCap}
          title="Education"
          desc="Academic background for recruiter verification"
        />
        <button
          type="button"
          onClick={add}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      <div className="space-y-3">
        {education.map((edu) => (
          <div
            key={edu.id}
            className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/50 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <input
                className={`${profileInputCls} font-semibold`}
                value={edu.college}
                onChange={(e) => update(edu.id, { college: e.target.value })}
                placeholder="College Name"
              />
              <button
                type="button"
                onClick={() => remove(edu.id)}
                className="shrink-0 rounded-lg p-1.5 text-[#8b8ca8] hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={profileInputCls}
                value={edu.degree}
                onChange={(e) => update(edu.id, { degree: e.target.value })}
                placeholder="Degree"
              />
              <input
                className={profileInputCls}
                value={edu.branch}
                onChange={(e) => update(edu.id, { branch: e.target.value })}
                placeholder="Branch"
              />
              <input
                className={profileInputCls}
                value={edu.graduationYear}
                onChange={(e) => update(edu.id, { graduationYear: normalizeYearInput(e.target.value) })}
                placeholder="Graduation Year"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                title="Enter a 4-digit year"
              />
              <input
                className={profileInputCls}
                value={edu.cgpa}
                onChange={(e) => update(edu.id, { cgpa: e.target.value })}
                placeholder="CGPA"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
