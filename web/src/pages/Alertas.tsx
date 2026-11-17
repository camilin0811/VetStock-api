import { useState } from 'react'
import { AlertTriangle, CalendarClock, CircleX } from 'lucide-react'
import { useAlertas } from '../api/hooks'
import type { TipoAlerta } from '../api/types'
import { Page } from '../components/Page'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { diasLabel, fmtFecha, nombreMed } from '../lib/format'

const TIPOS: { v: TipoAlerta; label: string; tono: string; icon: typeof AlertTriangle }[] = [
  { v: 'STOCK_BAJO', label: 'Stock bajo', tono: 'warn', icon: AlertTriangle },
  { v: 'POR_VENCER', label: 'Por vencer', tono: 'info', icon: CalendarClock },
  { v: 'VENCIDO', label: 'Vencidos', tono: 'bad', icon: CircleX },
]

export default function Alertas() {
  const [tipo, setTipo] = useState<TipoAlerta | ''>('')
  const [dias, setDias] = useState(30)
  const alertas = useAlertas(tipo || undefined, dias)

  return (
    <Page deps={[alertas.isLoading]}>
      <div className="card soft page-head" data-reveal>
        <div className="chips" role="group" aria-label="Filtrar por tipo">
          <button type="button" className="chip" aria-pressed={!tipo} onClick={() => setTipo('')}>Todas</button>
          {TIPOS.map((t) => <button key={t.v} type="button" className="chip" aria-pressed={tipo === t.v} onClick={() => setTipo(t.v)}>{t.label}</button>)}
        </div>
        <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Vencimientos en
          <select className="select" style={{ width: 'auto' }} value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {[15, 30, 60, 90].map((d) => <option key={d} value={d}>{d} días</option>)}
          </select>
        </label>
      </div>
      <section className="card" data-reveal aria-label="Alertas" aria-live="polite">
        {alertas.isLoading ? <SkeletonRows /> : alertas.error ? <ErrorState error={alertas.error} onRetry={() => alertas.refetch()} /> : !alertas.data?.length ? (
          <EmptyState title="Todo en orden" text="No hay alertas con este filtro." />
        ) : (
          <ul className="list">
            {alertas.data.map((a, i) => {
              const t = TIPOS.find((x) => x.v === a.tipo)!
              const Icon = t.icon
              return (
                <li key={`${a.tipo}-${a.loteId ?? i}-${nombreMed(a.medicamento)}`} className="list-item">
                  <span className="list-ico"><Icon size={20} aria-hidden="true" /></span>
                  <div className="grow">
                    <div className="row-title">{nombreMed(a.medicamento)}</div>
                    <div className="row-sub">{a.mensaje}{a.fechaVencimiento && ` · ${fmtFecha(a.fechaVencimiento)}`}</div>
                  </div>
                  <span className={`pill ${t.tono}`}>{a.diasRestantes !== undefined ? diasLabel(a.diasRestantes) : t.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </Page>
  )
}
