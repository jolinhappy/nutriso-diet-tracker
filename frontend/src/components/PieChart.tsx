interface Segment {
  value: number
  color: string
  label: string
}

interface PieChartProps {
  segments: Segment[]
  size?: number
}

function coords(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function slicePath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
  const o1 = coords(cx, cy, outerR, startDeg)
  const o2 = coords(cx, cy, outerR, endDeg)
  const i1 = coords(cx, cy, innerR, startDeg)
  const i2 = coords(cx, cy, innerR, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ')
}

export default function PieChart({ segments, size = 160 }: PieChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <div className="text-gray-400 text-sm text-center py-8">尚無資料</div>

  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.42
  const innerR = size * 0.24

  let angle = 0
  const paths = segments.map((seg) => {
    const sweep = (seg.value / total) * 360
    const path = slicePath(cx, cy, outerR, innerR, angle, angle + sweep)
    angle += sweep
    return { path, color: seg.color, label: seg.label, pct: Math.round((seg.value / total) * 100) }
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} />
        ))}
      </svg>
      <div className="flex gap-4">
        {paths.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: s.color }} />
            {s.label} {s.pct}%
          </div>
        ))}
      </div>
    </div>
  )
}
