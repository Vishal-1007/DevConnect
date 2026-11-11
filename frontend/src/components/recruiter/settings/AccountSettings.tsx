import { useRef } from 'react'
import { Camera, Save } from 'lucide-react'
import type { RecruiterSettingsData } from '../../../data/recruiterSettingsData'
import { initialsFromName } from '../../../data/recruiterSettingsData'
import { SettingsCard, SettingsField, SettingsInput } from './SettingsLayout'

type Props = {
  account: RecruiterSettingsData['account']
  onChange: (account: RecruiterSettingsData['account']) => void
  onSave?: () => void
}

export function AccountSettings({ account, onChange, onSave }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function patch(field: keyof RecruiterSettingsData['account'], value: string | null) {
    const next = { ...account, [field]: value }
    if (field === 'name' && value) {
      next.avatar = initialsFromName(value)
    }
    onChange(next)
  }

  function handlePhotoSelect(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onChange({
        ...account,
        photoUrl: typeof reader.result === 'string' ? reader.result : account.photoUrl,
      })
    }
    reader.readAsDataURL(file)
  }

  const displayAvatar = account.photoUrl ? (
    <img
      src={account.photoUrl}
      alt={account.name}
      className="h-20 w-20 rounded-full object-cover ring-2 ring-violet-500/30"
    />
  ) : (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white ring-2 ring-violet-500/20">
      {account.avatar}
    </div>
  )

  return (
    <SettingsCard
      title="Account"
      description="Manage your recruiter profile and company details"
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {displayAvatar}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full border border-[#2d2e3e] bg-[#161722] p-1.5 text-violet-300 transition hover:text-white"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
            />
          </div>
          <p className="text-[10px] text-[#8b8ca8]">Profile photo upload</p>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsField label="Full Name">
            <SettingsInput value={account.name} onChange={(v) => patch('name', v)} />
          </SettingsField>
          <SettingsField label="Email">
            <SettingsInput type="email" value={account.email} onChange={(v) => patch('email', v)} />
          </SettingsField>
          <SettingsField label="Phone Number">
            <SettingsInput value={account.phone} onChange={(v) => patch('phone', v)} />
          </SettingsField>
          <SettingsField label="Designation">
            <SettingsInput value={account.designation} onChange={(v) => patch('designation', v)} />
          </SettingsField>
          <div className="sm:col-span-2">
            <SettingsField label="Company Name">
              <SettingsInput value={account.company} onChange={(v) => patch('company', v)} />
            </SettingsField>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <Save size={16} />
        Save Changes
      </button>
    </SettingsCard>
  )
}
