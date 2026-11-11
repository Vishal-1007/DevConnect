export function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0
  const R = 52
  const cx = 60
  const cy = 60
  const strokeW = 14
  const circumference = 2 * Math.PI * R
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      {segments.map((seg) => {
        const dash = (seg.value / total) * circumference
        const el = (
          <circle
            key={seg.label}
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeW}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset * circumference + circumference * 0.25}
          />
        )
        offset += seg.value / total
        return el
      })}
      <circle cx={cx} cy={cy} r={R - strokeW / 2 - 2} fill="#161722" />
    </svg>
  )
}

export function BarChartSimple({
  values,
  color = '#818cf8',
  height = 80,
}: {
  values: number[]
  color?: string
  height?: number
}) {
  const max = Math.max(...values, 1)
  const w = 100
  const h = height
  const gap = 4
  const barW = (w - gap * (values.length - 1)) / values.length
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 8))
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - bh}
            width={barW}
            height={bh}
            rx={2}
            fill={color}
            opacity={0.85}
          />
        )
      })}
    </svg>
  )
}

export function LineChartSimple({
  series,
  colors,
  labels,
}: {
  series: number[][]
  colors: string[]
  labels?: string[]
}) {
  const max = Math.max(...series.flat(), 1)
  const w = 400
  const h = 100
  const len = series[0]?.length ?? 1
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        {colors.map((c, ci) => (
          <linearGradient key={ci} id={`g${ci}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.2" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {series.map((vals, si) => {
        const pts = vals.map(
          (v, i) => `${(i / Math.max(len - 1, 1)) * w},${h - 8 - (v / max) * (h - 16)}`
        )
        const area = [...pts, `${w},${h}`, `0,${h}`].join(' ')
        return (
          <g key={si}>
            <polygon points={area} fill={`url(#g${si})`} />
            <polyline
              points={pts.join(' ')}
              stroke={colors[si]}
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        )
      })}
      {labels?.map((l, i) => (
        <text
          key={i}
          x={(i / Math.max(labels.length - 1, 1)) * w}
          y={h - 1}
          fill="#5c5d72"
          fontSize="8"
          textAnchor="middle"
        >
          {l}
        </text>
      ))}
    </svg>
  )
}
