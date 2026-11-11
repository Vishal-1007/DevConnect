import type { MouseEvent } from 'react'
import { Code2, Plus, Trash2, CheckCircle2, Sparkles } from 'lucide-react'
import { ProfileSectionHeader, profileInputCls } from './profileUi'
import {
  newId,
  type CandidateSkill,
  type SkillLevel,
  type VerificationType,
} from '../../data/candidateProfileData'

type Props = {
  skills: CandidateSkill[]
  onChange: (skills: CandidateSkill[]) => void
}

const LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const VERIFICATION_LABEL: Record<VerificationType, string> = {
  ai: 'Verified by AI Interview',
  mentor: 'Mentor Verified',
  pending: 'Verification Pending',
  none: 'Not Verified',
}

function SkillBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#2d2e3e]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

export function SkillsSection({ skills, onChange }: Props) {
  const primary = skills.filter((s) => s.isPrimary)
  const secondary = skills.filter((s) => !s.isPrimary)

  function updateSkill(id: string, patch: Partial<CandidateSkill>) {
    onChange(skills.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function removeSkill(id: string) {
    onChange(skills.filter((s) => s.id !== id))
  }

  function addSkill(isPrimary: boolean) {
    onChange([
      ...skills,
      {
        id: newId('skill'),
        name: '',
        level: 'Intermediate',
        score: 70,
        verification: 'pending',
        isPrimary,
      },
    ])
  }

  function handleAdd(e: MouseEvent<HTMLButtonElement>, isPrimary: boolean) {
    e.preventDefault()
    e.stopPropagation()
    addSkill(isPrimary)
  }

  function renderSkillGroup(title: string, list: CandidateSkill[], isPrimary: boolean) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8ca8]">{title}</p>
          <button
            type="button"
            onClick={(e) => handleAdd(e, isPrimary)}
            className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
        <div className="space-y-3">
          {list.map((skill) => (
            <div
              key={skill.id}
              className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/50 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <input
                  className={`${profileInputCls} max-w-[160px]`}
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                  placeholder="Skill name"
                />
                <select
                  className={`${profileInputCls} w-auto`}
                  value={skill.level}
                  onChange={(e) => updateSkill(skill.id, { level: e.target.value as SkillLevel })}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l} className="bg-[#161722]">{l}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`${profileInputCls} w-20`}
                  value={skill.score}
                  onChange={(e) => updateSkill(skill.id, { score: Number(e.target.value) })}
                />
                <span className="text-xs text-[#8b8ca8]">%</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill.id)}
                  className="ml-auto rounded-lg p-1.5 text-[#8b8ca8] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <SkillBar score={skill.score} />
              <p className={`mt-1.5 flex items-center gap-1 text-[10px] ${
                skill.verification === 'ai' || skill.verification === 'mentor'
                  ? 'text-emerald-300'
                  : 'text-[#8b8ca8]'
              }`}>
                {(skill.verification === 'ai' || skill.verification === 'mentor') && (
                  <CheckCircle2 size={10} />
                )}
                {skill.verification === 'ai' && <Sparkles size={10} />}
                {VERIFICATION_LABEL[skill.verification]}
              </p>
            </div>
          ))}
          {list.length === 0 && (
            <p className="text-xs text-[#5c5d72]">No {title.toLowerCase()} added yet.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
      <ProfileSectionHeader
        icon={Code2}
        title="Skills"
        desc="Verified skills recruiters search by — ranked by DevScore"
      />
      {renderSkillGroup('Primary Skills', primary, true)}
      <div className="border-t border-[#2d2e3e] pt-4">
        {renderSkillGroup('Secondary Skills', secondary, false)}
      </div>
    </div>
  )
}
