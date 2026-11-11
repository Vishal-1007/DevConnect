import { Award, Plus, Trash2, ExternalLink } from 'lucide-react'
import { ProfileSectionHeader, profileInputCls, normalizeMonthInput, MONTH_INPUT_MIN, MONTH_INPUT_MAX } from './profileUi'
import { newId, type Certification } from '../../data/candidateProfileData'

type Props = {
  certifications: Certification[]
  onChange: (certifications: Certification[]) => void
}

export function CertificationsSection({ certifications, onChange }: Props) {
  function update(id: string, patch: Partial<Certification>) {
    onChange(certifications.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  function remove(id: string) {
    onChange(certifications.filter((c) => c.id !== id))
  }

  function add() {
    onChange([
      ...certifications,
      { id: newId('cert'), name: '', organization: '', issueDate: '', url: '' },
    ])
  }

  return (
    <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-[#2d2e3e] pb-4">
        <ProfileSectionHeader
          icon={Award}
          title="Certifications"
          desc="Professional certifications boost recruiter trust"
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
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/50 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <input
                className={`${profileInputCls} font-semibold`}
                value={cert.name}
                onChange={(e) => update(cert.id, { name: e.target.value })}
                placeholder="Certificate Name"
              />
              <button
                type="button"
                onClick={() => remove(cert.id)}
                className="shrink-0 rounded-lg p-1.5 text-[#8b8ca8] hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={profileInputCls}
                value={cert.organization}
                onChange={(e) => update(cert.id, { organization: e.target.value })}
                placeholder="Organization"
              />
              <input
                type="month"
                min={MONTH_INPUT_MIN}
                max={MONTH_INPUT_MAX}
                className={profileInputCls}
                value={cert.issueDate}
                onChange={(e) => update(cert.id, { issueDate: normalizeMonthInput(e.target.value) })}
              />
            </div>
            <input
              className={profileInputCls}
              value={cert.url}
              onChange={(e) => update(cert.id, { url: e.target.value })}
              placeholder="Certificate URL"
            />
            {cert.url && (
              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-violet-300 hover:underline"
              >
                <ExternalLink size={11} />
                View certificate
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
