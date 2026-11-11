type Props = {
  enabled: boolean
  onChange: (v: boolean) => void
  size?: 'sm' | 'md'
}

export function SettingsToggle({ enabled, onChange, size = 'md' }: Props) {
  const dims = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
  const knob = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const knobOn = size === 'sm' ? 'left-[18px]' : 'left-[22px]'

  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative shrink-0 rounded-full transition ${dims} ${
        enabled ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7]' : 'bg-[#2d2e3e]'
      }`}
    >
      <span
        className={`absolute top-0.5 rounded-full bg-white transition ${knob} ${
          enabled ? knobOn : 'left-0.5'
        }`}
      />
    </button>
  )
}

type CheckboxProps = {
  checked: boolean
  onChange: (v: boolean) => void
}

export function SettingsCheckbox({ checked, onChange }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex h-5 w-5 items-center justify-center rounded border transition ${
        checked
          ? 'border-violet-500 bg-violet-500/20 text-violet-300'
          : 'border-[#2d2e3e] bg-[#0b0c14]/40 text-transparent hover:border-violet-500/40'
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
