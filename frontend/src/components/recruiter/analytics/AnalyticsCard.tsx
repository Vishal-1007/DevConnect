import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { AnalyticsPeriod } from '../../../data/recruiterAnalyticsData'
import { ANALYTICS_PERIOD_OPTIONS } from '../../../data/recruiterAnalyticsData'

type Props = {
  value: AnalyticsPeriod
  onChange: (period: AnalyticsPeriod) => void
  className?: string
}

export function AnalyticsPeriodSelect({ value, onChange, className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AnalyticsPeriod)}
      className={`rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-2 py-1 text-[11px] text-[#8b8ca8] focus:border-violet-500 focus:outline-none ${className}`}
    >
      {ANALYTICS_PERIOD_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

export function AnalyticsCardShell({
  title,
  subtitle,
  period,
  onPeriodChange,
  children,
  className = '',
  action,
}: {
  title: string
  subtitle?: string
  period?: AnalyticsPeriod
  onPeriodChange?: (p: AnalyticsPeriod) => void
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <div className={`rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#8b8ca8]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {period !== undefined && onPeriodChange && (
            <AnalyticsPeriodSelect value={period} onChange={onPeriodChange} />
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  )
}

export type AnalyticsCardProps = {
  label: string
  value: number | string
  delta: string
  icon: LucideIcon
  color: string
  bg: string
  spark: string
  onClick?: () => void
}

function MiniSparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 24" className="h-6 w-20 opacity-70" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="0,18 12,14 24,16 36,8 48,10 60,4 72,6 80,2"
      />
    </svg>
  )
}

export function AnalyticsCard({
  label,
  value,
  delta,
  icon: Icon,
  color,
  bg,
  spark,
  onClick,
}: AnalyticsCardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left backdrop-blur-md transition ${bg} bg-[#161722]/60 ${
        onClick ? 'hover:scale-[1.02] hover:brightness-110' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-xl border p-2 ${bg}`}>
          <Icon size={18} className={color} />
        </div>
        <MiniSparkline color={spark} />
      </div>
      <p className="mt-3 text-xs font-medium text-[#8b8ca8]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="mt-1 text-[11px] text-[#8b8ca8]">{delta}</p>
    </Tag>
  )
}
