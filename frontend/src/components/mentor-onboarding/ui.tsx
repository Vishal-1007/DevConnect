import type { ReactNode } from 'react'

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[#2d2e3e]/80 bg-[#12131c]/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  )
}

export function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-[#a5b4fc] mb-1.5 tracking-wide">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0b0c14]/80 border border-[#2d2e3e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#6366f1]/60 focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className="w-full bg-[#0b0c14]/80 border border-[#2d2e3e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#6366f1]/60 focus:ring-2 focus:ring-[#6366f1]/20 transition-all resize-none"
    />
  )
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0b0c14]/80 border border-[#2d2e3e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366f1]/60 focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
    >
      <option value="">{placeholder ?? 'Select…'}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

export function GradientButton({
  children,
  onClick,
  disabled,
  type = 'button',
  variant = 'primary',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  variant?: 'primary' | 'ghost'
}) {
  if (variant === 'ghost') {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className="px-5 py-3 rounded-xl text-sm font-semibold text-[#8b8ca8] border border-[#2d2e3e] hover:border-[#6366f1]/40 hover:text-white transition-all disabled:opacity-40"
      >
        {children}
      </button>
    )
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white dc-gradient-btn shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

export function ChipToggle({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        selected
          ? 'bg-[#6366f1]/20 border-[#6366f1]/50 text-[#c7d2fe]'
          : 'bg-[#0b0c14]/60 border-[#2d2e3e] text-[#8b8ca8] hover:border-[#6366f1]/30'
      }`}
    >
      {label}
    </button>
  )
}
