interface Item { label: string; value: number; display: string }

/** Barras horizontales en SVG con el valor siempre visible como texto. */
export function HBars({ items, tone = 'var(--violet-600)' }: { items: Item[]; tone?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="hbars">
      {items.map((i) => (
        <li key={i.label}>
          <span className="hb-label" title={i.label}>{i.label}</span>
          <svg className="hb-bar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
            <rect width="100" height="10" rx="5" fill="var(--violet-100)" />
            <rect className="hb-fill" width={Math.max(2, (i.value / max) * 100)} height="10" rx="5" fill={tone} />
          </svg>
          <span className="hb-val num">{i.display}</span>
        </li>
      ))}
    </ul>
  )
}
