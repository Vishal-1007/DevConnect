import { Save, Sparkles } from 'lucide-react'
import {
  EXPERIENCE_OPTIONS,
  SKILL_OPTIONS,
  type RecruiterSettingsData,
} from '../../../data/recruiterSettingsData'
import { SettingsCard } from './SettingsLayout'
import { SettingsToggle } from './SettingsControls'

type Props = {
  hiringPrefs: RecruiterSettingsData['hiringPrefs']
  onChange: (hiringPrefs: RecruiterSettingsData['hiringPrefs']) => void
  onSave?: () => void
}

function toggleList(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export function HiringPreferences({ hiringPrefs, onChange, onSave }: Props) {
  function patch(p: Partial<RecruiterSettingsData['hiringPrefs']>) {
    onChange({ ...hiringPrefs, ...p })
  }

  return (
    <div className="space-y-4">
      <SettingsCard
        title="Preferences"
        description="Control default candidate filters and auto-shortlisting for your hiring workflow"
      >
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium text-[#8b8ca8]">Minimum DevScore</p>
              <span className="text-sm font-bold text-violet-300">{hiringPrefs.minDevScore}+</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={hiringPrefs.minDevScore}
              onChange={(e) => patch({ minDevScore: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#0b0c14] accent-violet-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-[#5c5d72]">
              <span>0</span>
              <span>1000</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium text-[#8b8ca8]">Preferred Skills</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() =>
                    patch({ preferredSkills: toggleList(hiringPrefs.preferredSkills, skill) })
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    hiringPrefs.preferredSkills.includes(skill)
                      ? 'border-violet-500/50 bg-violet-500/20 text-violet-200'
                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:border-violet-500/30 hover:text-white'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium text-[#8b8ca8]">Preferred Experience</p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((exp) => (
                <button
                  key={exp}
                  type="button"
                  onClick={() =>
                    patch({
                      preferredExperience: toggleList(hiringPrefs.preferredExperience, exp),
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    hiringPrefs.preferredExperience.includes(exp)
                      ? 'border-violet-500/50 bg-violet-500/20 text-violet-200'
                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:border-violet-500/30 hover:text-white'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Auto Shortlisting"
        description="Automatically shortlist high-scoring candidates that match your criteria"
        action={
          <SettingsToggle
            enabled={hiringPrefs.autoShortlistEnabled}
            onChange={(v) => patch({ autoShortlistEnabled: v })}
          />
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-violet-400" />
          <div className="flex-1 space-y-3">
            <p className="text-xs text-[#c4c5d6]">
              Auto shortlist candidates with DevScore above{' '}
              <span className="font-bold text-violet-300">
                {hiringPrefs.autoShortlistThreshold}
              </span>{' '}
              and skills match above{' '}
              <span className="font-bold text-violet-300">
                {hiringPrefs.skillsMatchThreshold}%
              </span>
            </p>
            {hiringPrefs.autoShortlistEnabled && (
              <>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-[#8b8ca8]">
                    <span>DevScore threshold</span>
                    <span className="font-semibold text-violet-300">
                      {hiringPrefs.autoShortlistThreshold}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={700}
                    max={1000}
                    step={10}
                    value={hiringPrefs.autoShortlistThreshold}
                    onChange={(e) =>
                      patch({ autoShortlistThreshold: Number(e.target.value) })
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#0b0c14] accent-violet-500"
                  />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-[#8b8ca8]">
                    <span>Skills match threshold</span>
                    <span className="font-semibold text-violet-300">
                      {hiringPrefs.skillsMatchThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={5}
                    value={hiringPrefs.skillsMatchThreshold}
                    onChange={(e) =>
                      patch({ skillsMatchThreshold: Number(e.target.value) })
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#0b0c14] accent-violet-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </SettingsCard>

      <button
        type="button"
        onClick={onSave}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <Save size={16} />
        Save Preferences
      </button>
    </div>
  )
}
