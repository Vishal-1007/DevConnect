export function SettingsCard({
  title,
  description,
  children,
  action,
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="mt-1 text-xs text-[#8b8ca8]">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function SettingsField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">{label}</label>
      {children}
    </div>
  )
}

export function SettingsInput({
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-violet-500/50 focus:outline-none"
    />
  )
}

export function SettingsSelect({
  value,
  onChange,
  options,
  labels,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  labels?: Record<string, string>
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {labels?.[opt] ?? opt}
        </option>
      ))}
    </select>
  )
}
