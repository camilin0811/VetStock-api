import { useState } from 'react'
import { useReporteConsumo, useReporteProveedores, useReporteStock, useReporteVencimientos } from '../api/hooks'
import { HBars } from '../components/HBars'
import { Page } from '../components/Page'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { CountUp } from '../components/CountUp'
import { fmtFecha, fmtMoney, fmtNum, nombreMed } from '../lib/format'

function Bloque({ titulo, total, children, q }: { titulo: string; total?: React.ReactNode; children: React.ReactNode; q: { isLoading: boolean; error: unknown; refetch: () => unknown } }) {
  return (
    <section className="card" data-reveal aria-label={titulo}>
      <div className="card-head"><h2>{titulo}</h2>{total}</div>
      {q.isLoading ? <SkeletonRows rows={4} h={30} /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : children}
    </section>
  )
}

export default function Reportes() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const consumo = useReporteConsumo(desde || undefined, hasta || undefined)
  const venc = useReporteVencimientos()
  const stock = useReporteStock()
  const prov = useReporteProveedores(desde || undefined, hasta || undefined)

  return (
    <Page deps={[consumo.isLoading, venc.isLoading, stock.isLoading, prov.isLoading]}>
      <div className="card soft page-head" data-reveal>
        <p className="muted grow">Rango para consumo y proveedores (por defecto, últimos 30 días).</p>
        <label className="field">Desde<input className="input" type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} /></label>
        <label className="field">Hasta<input className="input" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} /></label>
      </div>

      <div className="cols-2 reportes-grid">
        <Bloque titulo="Consumo por medicamento" q={consumo} total={consumo.data && <span className="pill"><CountUp value={consumo.data.totalUnidades} /> u</span>}>
          {!consumo.data?.detalle.length ? <EmptyState title="Sin consumo" text="No hubo dispensaciones en este rango." /> : (
            <>
              <HBars items={consumo.data.detalle.slice(0, 8).map((d) => ({ label: nombreMed(d.medicamento), value: d.unidades, display: `${fmtNum(d.unidades)} u` }))} />
              <p className="muted rep-foot">Ventas del período: <strong>{fmtMoney(consumo.data.totalVentas)}</strong> · {fmtFecha(consumo.data.desde)} a {fmtFecha(consumo.data.hasta)}</p>
            </>
          )}
        </Bloque>

        <Bloque titulo="Stock valorizado" q={stock} total={stock.data && <span className="pill ok">{fmtMoney(stock.data.valorTotal)}</span>}>
          {!stock.data?.items.length ? <EmptyState title="Sin existencias" /> : (
            <HBars tone="var(--info-dot)" items={[...stock.data.items].sort((a, b) => b.valor - a.valor).slice(0, 8).map((i) => ({ label: i.medicamento.nombre, value: i.valor, display: fmtMoney(i.valor) }))} />
          )}
        </Bloque>

        <Bloque titulo="Vencimientos" q={venc} total={venc.data && <span className={`pill ${venc.data.totalPerdida ? 'bad' : 'ok'}`}>Pérdida {fmtMoney(venc.data.totalPerdida)}</span>}>
          {!venc.data?.lotes.length ? <EmptyState title="Sin lotes vencidos" text="No hay pérdidas por vencimiento." /> : (
            <ul className="list">
              {venc.data.lotes.map(({ lote, medicamento, perdida }) => (
                <li key={lote.id} className="list-item slim">
                  <div className="grow"><div className="row-title">{medicamento.nombre}</div><div className="row-sub">Lote {lote.numeroLote} · {lote.cantidad} u · venció {fmtFecha(lote.fechaVencimiento)}</div></div>
                  <span className="pill bad">{fmtMoney(perdida)}</span>
                </li>
              ))}
            </ul>
          )}
        </Bloque>

        <Bloque titulo="Proveedores" q={prov}>
          {!prov.data?.length ? <EmptyState title="Sin entregas" text="No hay lotes recibidos en este rango." /> : (
            <>
              <HBars tone="var(--warn-dot)" items={prov.data.map((p) => ({ label: p.proveedor.nombre, value: p.unidades, display: `${fmtNum(p.unidades)} u` }))} />
              <div className="table-wrap" style={{ marginTop: 10 }}>
                <table className="table">
                  <thead><tr><th>Proveedor</th><th className="right">Lotes</th><th className="right">Valor</th></tr></thead>
                  <tbody>{prov.data.map((p) => <tr key={p.proveedor.id}><td>{p.proveedor.nombre}</td><td className="right">{p.lotes}</td><td className="right">{fmtMoney(p.valor)}</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}
        </Bloque>
      </div>
    </Page>
  )
}
