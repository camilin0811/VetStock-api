import { useState } from 'react'
import { useMedicamentos, useMovimientos } from '../api/hooks'
import type { TipoMovimiento } from '../api/types'
import { Page } from '../components/Page'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { fmtFechaHora, nombreMed } from '../lib/format'

const TIPOS: { v: TipoMovimiento; label: string; tono: string }[] = [
  { v: 'ENTRADA', label: 'Entrada', tono: 'ok' }, { v: 'SALIDA', label: 'Salida', tono: 'info' },
  { v: 'AJUSTE', label: 'Ajuste', tono: 'warn' }, { v: 'ANULACION', label: 'Anulación', tono: 'bad' },
]

export default function Movimientos() {
  const [tipo, setTipo] = useState('')
  const [medId, setMedId] = useState('')
  const meds = useMedicamentos()
  const movs = useMovimientos({ tipo: tipo || undefined, medicamentoId: medId ? Number(medId) : undefined })

  return (
    <Page deps={[movs.isLoading]}>
      <div className="card soft page-head" data-reveal>
        <div className="chips" role="group" aria-label="Filtrar por tipo">
          <button type="button" className="chip" aria-pressed={!tipo} onClick={() => setTipo('')}>Todos</button>
          {TIPOS.map((t) => <button key={t.v} type="button" className="chip" aria-pressed={tipo === t.v} onClick={() => setTipo(t.v)}>{t.label}</button>)}
        </div>
        <label className="field" style={{ minWidth: 220 }}>
          <span className="sr-only">Medicamento</span>
          <select className="select" aria-label="Filtrar por medicamento" value={medId} onChange={(e) => setMedId(e.target.value)}>
            <option value="">Todos los medicamentos</option>
            {meds.data?.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </label>
      </div>
      <section className="card" data-reveal aria-label="Kardex">
        {movs.isLoading ? <SkeletonRows /> : movs.error ? <ErrorState error={movs.error} onRetry={() => movs.refetch()} /> : !movs.data?.length ? (
          <EmptyState title="Sin movimientos" text="Las entradas, salidas y ajustes aparecerán aquí." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Medicamento</th><th>Lote</th><th className="right">Cantidad</th><th>Detalle</th><th>Usuario</th></tr></thead>
              <tbody>
                {movs.data.map((m) => {
                  const t = TIPOS.find((x) => x.v === m.tipo)
                  return (
                    <tr key={m.id}>
                      <td className="num" style={{ whiteSpace: 'nowrap' }}>{fmtFechaHora(m.fecha)}</td>
                      <td><span className={`pill ${t?.tono ?? ''}`}>{t?.label ?? m.tipo}</span></td>
                      <td className="row-title">{nombreMed(m.medicamento)}</td>
                      <td>{m.numeroLote}</td>
                      <td className="right"><strong>{m.tipo === 'ENTRADA' || m.tipo === 'ANULACION' ? '+' : '-'}{m.cantidad}</strong></td>
                      <td className="muted">{m.detalle}</td>
                      <td>{m.usuario?.nombre ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Page>
  )
}
