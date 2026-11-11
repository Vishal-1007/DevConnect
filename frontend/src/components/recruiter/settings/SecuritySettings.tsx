import { Monitor, Save, Shield } from 'lucide-react'
import { useState } from 'react'
import type { RecruiterSettingsData } from '../../../data/recruiterSettingsData'
import { SettingsCard, SettingsField, SettingsInput } from './SettingsLayout'
import { SettingsToggle } from './SettingsControls'

type Props = {
  security: RecruiterSettingsData['security']
  onChange: (security: RecruiterSettingsData['security']) => void
  onSavePassword?: () => void
  onPasswordError?: (message: string) => void
  onTwoFactorChange?: (enabled: boolean) => void
}

export function SecuritySettings({
  security,
  onChange,
  onSavePassword,
  onPasswordError,
  onTwoFactorChange,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function handleUpdatePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      onPasswordError?.('Please fill in all password fields')
      return
    }
    if (newPassword.length < 8) {
      onPasswordError?.('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      onPasswordError?.('New password and confirmation do not match')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    onSavePassword?.()
  }

  return (
    <div className="space-y-4">
      <SettingsCard title="Change Password" description="Update your recruiter account password">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsField label="Current Password">
            <SettingsInput
              value={currentPassword}
              onChange={setCurrentPassword}
              type="password"
              placeholder="••••••••"
            />
          </SettingsField>
          <SettingsField label="New Password">
            <SettingsInput
              value={newPassword}
              onChange={setNewPassword}
              type="password"
              placeholder="••••••••"
            />
          </SettingsField>
          <div className="sm:col-span-2">
            <SettingsField label="Confirm Password">
              <SettingsInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                placeholder="••••••••"
              />
            </SettingsField>
          </div>
        </div>
        <button
          type="button"
          onClick={handleUpdatePassword}
          className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Save size={16} />
          Update Password
        </button>
      </SettingsCard>

      <SettingsCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your recruiter account"
        action={
          <SettingsToggle
            enabled={security.twoFactorEnabled}
            onChange={(v) => {
              onChange({ ...security, twoFactorEnabled: v })
              onTwoFactorChange?.(v)
            }}
          />
        }
      >
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <Shield size={16} className="text-emerald-400" />
          <p className="text-xs text-[#8b8ca8]">
            {security.twoFactorEnabled
              ? '2FA is enabled. Your account is protected with authenticator app verification.'
              : 'Enable 2FA to protect sensitive hiring data and candidate information.'}
          </p>
        </div>
      </SettingsCard>

      <SettingsCard title="Login Activity" description="Recent sign-ins to your recruiter account">
        <div className="space-y-2">
          {security.loginActivity.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2d2e3e]/60 bg-[#161722]">
                  <Monitor size={14} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{session.device}</p>
                  <p className="text-[10px] text-[#8b8ca8]">{session.location}</p>
                </div>
              </div>
              <p className="text-[10px] text-[#5c5d72]">{session.date}</p>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  )
}
