import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  title: string
  desc: string
}

export function ProfileSectionHeader({ icon: Icon, title, desc }: Props) {
  return (
    <div className="flex items-start gap-3 border-b border-[#2d2e3e] pb-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/15">
        <Icon size={16} className="text-[#818cf8]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-[#5c5d72]">{desc}</p>
      </div>
    </div>
  )
}

export const profileInputCls =
  'w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm ' +
  'placeholder:text-[#5c5d72] focus:outline-none focus:border-[#6366f1]/60 transition-colors'

export const profileTextareaCls = `${profileInputCls} h-24 py-2.5 resize-none`

export const profileCardCls =
  'rounded-xl bg-[#161722]/80 border border-[#2d2e3e] backdrop-blur-sm p-5 space-y-4'

/** Allow only a 4-digit year (e.g. graduation year). */
export function normalizeYearInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4)
}

/** Clamp month input (YYYY-MM) so the year is always 4 digits and within range. */
export function normalizeMonthInput(value: string): string {
  if (!value) return ''
  const [yearPart, monthPart] = value.split('-')
  let year = (yearPart ?? '').replace(/\D/g, '').slice(0, 4)
  if (year.length === 4) {
    const y = Number(year)
    if (y < 1950) year = '1950'
    if (y > 2099) year = '2099'
  }
  if (!monthPart) return year
  const month = monthPart.replace(/\D/g, '').slice(0, 2)
  if (!month) return year
  return `${year}-${month.padStart(2, '0').slice(0, 2)}`
}

export const MONTH_INPUT_MIN = '1950-01'
export const MONTH_INPUT_MAX = '2099-12'
export const DATE_INPUT_MIN = '1900-01-01'

export function todayDateInputMax(): string {
  return new Date().toISOString().slice(0, 10)
}

