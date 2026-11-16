import { useId, type ReactNode } from 'react'

interface Props { value: number; size?: number; stroke?: number; label: string; children?: ReactNode }

/** Anillo de progreso accesible (role=img con valor textual). */
export function ProgressRing({ value, size = 168, stroke = 12, label, children }: Props) {
  const id = useId()
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(v)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8e7bd8" /><stop offset="1" stopColor="#5a40b8" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--violet-100)" strokeWidth={stroke} />
        <circle
          className="ring-arc" data-ring={v} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ ['--circ' as string]: c }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
