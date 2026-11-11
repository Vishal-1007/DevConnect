import { ChevronRight } from 'lucide-react'
import type { AnalyticsPeriod } from '../../../data/recruiterAnalyticsData'
import { FUNNEL_SUMMARY, HIRING_FUNNEL } from '../../../data/recruiterAnalyticsData'
import { AnalyticsCardShell } from './AnalyticsCard'

type Props = {
  period: AnalyticsPeriod
  onPeriodChange: (p: AnalyticsPeriod) => void
}

export function HiringFunnel({ period, onPeriodChange }: Props) {
  return (
    <AnalyticsCardShell
      title="Hiring Funnel"
      subtitle="Track your hiring pipeline and conversion rates"
      period={period}
      onPeriodChange={onPeriodChange}
      className="lg:col-span-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 overflow-x-auto pb-2">
        {HIRING_FUNNEL.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-3">
            <div className="flex min-w-[100px] flex-col items-center rounded-xl border border-[#2d2e3e]/80 bg-[#0b0c14]/50 px-4 py-3 text-center">
              <span className="text-lg">{stage.icon}</span>
              <p className="mt-1 text-[11px] font-medium text-[#8b8ca8]">{stage.label}</p>
              <p className="text-xl font-bold text-white">{stage.value}</p>
              <p className="text-[11px] text-violet-300">{stage.rate}</p>
            </div>
            {i < HIRING_FUNNEL.length - 1 && (
              <ChevronRight size={18} className="shrink-0 text-[#5c5d72]" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 border-t border-[#2d2e3e]/60 pt-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3">
          <p className="text-[11px] text-[#8b8ca8]">Overall Conversion Rate</p>
          <p className="mt-1 text-lg font-bold text-white">{FUNNEL_SUMMARY.overallConversion}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3">
          <p className="text-[11px] text-[#8b8ca8]">Average Time to Hire</p>
          <p className="mt-1 text-lg font-bold text-white">{FUNNEL_SUMMARY.avgTimeToHire}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3">
          <p className="text-[11px] text-[#8b8ca8]">Average Time to Interview</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">{FUNNEL_SUMMARY.avgTimeToInterview}</p>
        </div>
      </div>
    </AnalyticsCardShell>
  )
}
