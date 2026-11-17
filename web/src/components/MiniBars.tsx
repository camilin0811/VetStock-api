import { parseFecha } from '../lib/format'

/** Barras de consumo diario (SVG). Cada barra lleva su valor como texto accesible. */
export function MiniBars({ data }: { data: { fecha: string; unidades: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.unidades))
  const W = 280, H = 120, gap = 10
  const bw = (W - gap * (data.length - 1)) / data.length
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="minibars" role="img" aria-label={`Consumo de los últimos ${data.length} días: ${data.map((d) => d.unidades).join(', ')} unidades`}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.unidades / max) * (H - 18))
        const x = i * (bw + gap)
        const ultimo = i === data.length - 1
        return (
          <g key={d.fecha}>
            <rect className="bar" x={x} y={H - h} width={bw} height={h} rx={Math.min(8, bw / 2)} fill={ultimo ? 'var(--violet-600)' : 'var(--viz-soft)'} />
            <text x={x + bw / 2} y={H - h - 5} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink)">{d.unidades}</text>
            <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="10.5" fill="var(--muted)">
              {parseFecha(d.fecha).toLocaleDateString('es-CO', { weekday: 'short' }).slice(0, 3)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
