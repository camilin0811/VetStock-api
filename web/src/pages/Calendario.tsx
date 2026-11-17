import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLotes } from '../api/hooks'
import type { Lote } from '../api/types'
import { Page } from '../components/Page'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import { diasLabel, diasTono, fmtFecha, isoHoy, nombreMed, parseFecha } from '../lib/format'

const SEMANA = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function Calendario() {
  const hoyKey = isoHoy()
  const [mes, setMes] = useState(() => { const h = parseFecha(hoyKey); return new Date(h.getFullYear(), h.getMonth(), 1) })
  const [sel, setSel] = useState(hoyKey)
  const lotes = useLotes()

  const porDia = useMemo(() => {
    const m = new Map<string, Lote[]>()
    lotes.data?.filter((l) => l.cantidad > 0).forEach((l) => {
      const k = l.fechaVencimiento.slice(0, 10)
      m.set(k, [...(m.get(k) ?? []), l])
    })
    return m
  }, [lotes.data])

  const celdas = useMemo(() => {
    const primero = (mes.getDay() + 6) % 7
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
    return [...Array<null>(primero).fill(null), ...Array.from({ length: total }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))]
  }, [mes])

  const hoy = parseFecha(hoyKey).getTime()
  const delDia = porDia.get(sel) ?? []
  const mover = (n: number) => setMes((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))
  const tituloRaw = mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const titulo = tituloRaw.charAt(0).toUpperCase() + tituloRaw.slice(1)

  return (
    <Page deps={[lotes.isLoading]}>
      <div className="split">
        <section className="card" data-reveal aria-label="Calendario de vencimientos">
          <div className="card-head">
            <h2 aria-live="polite">{titulo}</h2>
            <div className="chips">
              <button type="button" className="btn sm" onClick={() => { const h = parseFecha(hoyKey); setMes(new Date(h.getFullYear(), h.getMonth(), 1)); setSel(hoyKey) }}>Hoy</button>
              <button type="button" className="btn icon" aria-label="Mes anterior" onClick={() => mover(-1)}><ChevronLeft size={18} /></button>
              <button type="button" className="btn icon" aria-label="Mes siguiente" onClick={() => mover(1)}><ChevronRight size={18} /></button>
            </div>
          </div>
          {lotes.isLoading ? <Skeleton h={320} r={20} /> : lotes.error ? <ErrorState error={lotes.error} onRetry={() => lotes.refetch()} /> : (
            <div className="cal" role="group" aria-label={titulo}>
              {SEMANA.map((d) => <div key={d} className="cal-dow" aria-hidden="true">{d}</div>)}
              {celdas.map((d, i) => {
                if (!d) return <div key={`v${i}`} />
                const k = key(d)
                const ls = porDia.get(k) ?? []
                const dias = Math.round((d.getTime() - hoy) / 864e5)
                const tono = ls.length ? diasTono(dias) : null
                return (
                  <button
                    type="button" key={k} className={`cal-day${k === sel ? ' sel' : ''}${k === hoyKey ? ' today' : ''}`} aria-pressed={k === sel}
                    aria-label={`${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}${ls.length ? `, ${ls.length} ${ls.length === 1 ? 'vencimiento' : 'vencimientos'}` : ''}`}
                    onClick={() => setSel(k)}
                  >
                    {d.getDate()}
                    {tono && <span className={`dot ${tono}`} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          )}
          <p className="muted cal-legend"><span className="dot bad" /> hasta 7 días o vencido <span className="dot warn" /> hasta 30 días <span className="dot info" /> más adelante</p>
        </section>

        <aside className="card detail" data-reveal aria-label="Vencimientos del día seleccionado" aria-live="polite">
          <h2 style={{ fontSize: 17, marginBottom: 12 }}>{fmtFecha(sel, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          {!delDia.length ? <EmptyState title="Sin vencimientos" text="Ningun lote con existencias vence este día." /> : (
            <ul className="list">
              {delDia.map((l) => (
                <li key={l.id} className="list-item slim">
                  <div className="grow"><div className="row-title">{nombreMed(l.medicamento) !== '-' ? nombreMed(l.medicamento) : `Medicamento #${l.medicamentoId}`}</div><div className="row-sub">Lote {l.numeroLote} · {l.cantidad} u</div></div>
                  <span className={`pill ${diasTono(Math.round((parseFecha(l.fechaVencimiento).getTime() - hoy) / 864e5))}`}>{diasLabel(Math.round((parseFecha(l.fechaVencimiento).getTime() - hoy) / 864e5))}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </Page>
  )
}
