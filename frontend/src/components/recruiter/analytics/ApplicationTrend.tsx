import { useMemo, useState } from 'react'
import { APPLICATION_TREND_30D, APPLICATION_TREND_7D } from '../../../data/recruiterAnalyticsData'
import { AnalyticsCardShell } from './AnalyticsCard'

type Range = '7d' | '30d'

export function ApplicationTrend() {
  const [range, setRange] = useState<Range>('7d')
  const data = range === '7d' ? APPLICATION_TREND_7D : APPLICATION_TREND_30D

  const chart = useMemo(() => {
    const w = 320
    const h = 120
    const padX = 8
    const padY = 12
    const max = Math.max(...data.map((d) => d.value), 1)
    const step = (w - padX * 2) / Math.max(data.length - 1, 1)

    const points = data.map((d, i) => {
      const x = padX + i * step
      const y = h - padY - (d.value / max) * (h - padY * 2)
      return `${x},${y}`
    })

    const area = `${padX},${h - padY} ${points.join(' ')} ${padX + (data.length - 1) * step},${h - padY}`

    return { w, h, points: points.join(' '), area, max }
  }, [data])

  return (
    <AnalyticsCardShell
      title="Applications Trend"
      subtitle="Track application volume over time"
      action={
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-2 py-1 text-[11px] text-[#8b8ca8]"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      }
    >
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chart.w} ${chart.h}`} className="h-32 w-full min-w-[280px]">
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 12 + (i / 4) * (chart.h - 24)
            return (
              <line key={i} x1="8" y1={y} x2={chart.w - 8} y2={y} stroke="#2d2e3e" strokeWidth="1" />
            )
          })}
          <polygon points={chart.area} fill="url(#trendGrad)" />
          <polyline
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={chart.points}
          />
          {data.map((d, i) => {
            const step = (chart.w - 16) / Math.max(data.length - 1, 1)
            const x = 8 + i * step
            const y = chart.h - 12 - (d.value / chart.max) * (chart.h - 24)
            return <circle key={d.date} cx={x} cy={y} r="3.5" fill="#a855f7" />
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[#5c5d72]">
        {data.map((d) => (
          <span key={d.date}>{d.date}</span>
        ))}
      </div>
    </AnalyticsCardShell>
  )
}
