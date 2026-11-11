import { useState } from 'react'
import { Check, Trash2, UserPlus, X } from 'lucide-react'
import type { RecruiterSettingsData, TeamMember, TeamRole } from '../../../data/recruiterSettingsData'
import { TEAM_ROLE_PERMISSIONS, initialsFromName } from '../../../data/recruiterSettingsData'
import { SettingsCard, SettingsField, SettingsInput, SettingsSelect } from './SettingsLayout'

const ROLES: TeamRole[] = ['Admin', 'Recruiter', 'Viewer']

type Props = {
  team: RecruiterSettingsData['team']
  onChange: (team: RecruiterSettingsData['team']) => void
  onInvite?: (member: Omit<TeamMember, 'id'>) => void
  onRemove?: (id: string) => void
}

function TeamInviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void
  onInvite: (member: Omit<TeamMember, 'id'>) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [accessRole, setAccessRole] = useState<TeamRole>('Recruiter')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    onInvite({
      name: name.trim(),
      email: email.trim(),
      role: accessRole === 'Admin' ? 'Hiring Admin' : `${accessRole} Access`,
      accessRole,
      avatar: initialsFromName(name.trim()),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#2d2e3e] bg-[#161722] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8b8ca8] hover:bg-[#2d2e3e] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SettingsField label="Full Name">
            <SettingsInput value={name} onChange={setName} placeholder="Team member name" />
          </SettingsField>
          <SettingsField label="Email">
            <SettingsInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="colleague@company.com"
            />
          </SettingsField>
          <SettingsField label="Role">
            <SettingsSelect
              value={accessRole}
              onChange={(v) => setAccessRole(v as TeamRole)}
              options={ROLES}
            />
          </SettingsField>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <UserPlus size={16} />
            Send Invite
          </button>
        </form>
      </div>
    </div>
  )
}

export function TeamAccess({ team, onChange, onInvite, onRemove }: Props) {
  const [showInvite, setShowInvite] = useState(false)

  function updateRole(id: string, accessRole: TeamRole) {
    onChange({
      members: team.members.map((m) => (m.id === id ? { ...m, accessRole } : m)),
    })
  }

  function handleInvite(member: Omit<TeamMember, 'id'>) {
    onChange({
      members: [...team.members, { ...member, id: String(Date.now()) }],
    })
    onInvite?.(member)
  }

  return (
    <>
      <SettingsCard
        title="Team Access"
        description="Manage your company hiring team and recruiter permissions"
        action={
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <UserPlus size={14} />
            Invite Team Member
          </button>
        }
      >
        <div className="space-y-3">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                  {member.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{member.name}</p>
                  <p className="text-xs text-[#8b8ca8]">{member.role}</p>
                  <p className="text-[10px] text-[#5c5d72]">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.id === '1' ? (
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                    Admin
                  </span>
                ) : (
                  <div className="w-32">
                    <SettingsSelect
                      value={member.accessRole}
                      onChange={(v) => updateRole(member.id, v as TeamRole)}
                      options={ROLES}
                    />
                  </div>
                )}
                {member.id !== '1' && (
                  <button
                    type="button"
                    onClick={() => onRemove?.(member.id)}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(TEAM_ROLE_PERMISSIONS) as TeamRole[]).map((role) => {
            const info = TEAM_ROLE_PERMISSIONS[role]
            return (
              <div
                key={role}
                className="rounded-xl border border-[#2d2e3e]/40 bg-[#0b0c14]/30 p-3"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-violet-300">
                  {info.title}
                </p>
                <ul className="mt-2 space-y-1">
                  {info.permissions.map((permission) => (
                    <li
                      key={permission}
                      className="flex items-center gap-1.5 text-[11px] text-[#8b8ca8]"
                    >
                      <Check size={11} className="shrink-0 text-emerald-400" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </SettingsCard>

      {showInvite && (
        <TeamInviteModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />
      )}
    </>
  )
}
