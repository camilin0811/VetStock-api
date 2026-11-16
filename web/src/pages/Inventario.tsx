import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MinusCircle, PackagePlus } from 'lucide-react'
import { crear, mensajesDe, useAccion, useInventario, useLotes, useMedicamentos, useProveedores } from '../api/hooks'
import { post } from '../api/client'
import type { EstadoStock, Lote } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { puedeEscribirCatalogo } from '../components/nav'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { FormError } from '../components/FormError'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { diasLabel, diasTono, fmtFecha, isoHoy, nombreMed, parseFecha } from '../lib/format'

const ESTADO: Record<EstadoStock, { label: string; tono: string }> = {
  OK: { label: 'OK', tono: 'ok' }, STOCK_BAJO: { label: 'Stock bajo', tono: 'warn' }, SIN_STOCK: { label: 'Sin stock', tono: 'bad' },
}

function LoteForm({ onDone }: { onDone: () => void }) {
  const meds = useMedicamentos()
  const provs = useProveedores()
  const [errores, setErrores] = useState<string[]>([])
  const guardar = useAccion(crear('/lotes'), 'Lote registrado', false)
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setErrores([])
    try {
      await guardar.mutateAsync({
        medicamentoId: Number(f.get('medicamentoId')), proveedorId: Number(f.get('proveedorId')), numeroLote: String(f.get('numeroLote')).trim(),
        cantidad: Number(f.get('cantidad')), fechaVencimiento: String(f.get('fechaVencimiento')),
      })
      onDone()
    } catch (err) { setErrores(mensajesDe(err)) }
  }
  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={enviar}>
      <div className="form-grid">
        <label className="field full">Medicamento
          <select className="select" name="medicamentoId" required defaultValue="">
            <option value="" disabled>Elige un medicamento</option>
            {meds.data?.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.presentacion})</option>)}
          </select>
        </label>
        <label className="field full">Proveedor
          <select className="select" name="proveedorId" required defaultValue="">
            <option value="" disabled>Elige un proveedor</option>
            {provs.data?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </label>
        <label className="field">Numero de lote<input className="input" name="numeroLote" required /></label>
        <label className="field">Cantidad<input className="input" name="cantidad" type="number" min="1" step="1" required /></label>
        <label className="field full">Fecha de vencimiento<input className="input" name="fechaVencimiento" type="date" min={isoHoy()} required /></label>
      </div>
      <FormError errores={errores} />
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onDone}>Cancelar</button>
        <button className="btn primary" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando...' : 'Registrar lote'}</button>
      </div>
    </form>
  )
}

function AjusteForm({ lote, onDone }: { lote: Lote; onDone: () => void }) {
  const [errores, setErrores] = useState<string[]>([])
  const guardar = useAccion((b: Record<string, unknown>) => post(`/lotes/${lote.id}/ajustes`, b), 'Ajuste registrado', false)
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setErrores([])
    try {
      await guardar.mutateAsync({ cantidad: Number(f.get('cantidad')), motivo: String(f.get('motivo')), observacion: String(f.get('observacion') || '') || undefined })
      onDone()
    } catch (err) { setErrores(mensajesDe(err)) }
  }
  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={enviar}>
      <p className="muted">Lote {lote.numeroLote} · {nombreMed(lote.medicamento)} · {lote.cantidad} unidades disponibles. El ajuste descuenta unidades y queda en el kardex.</p>
      <div className="form-grid">
        <label className="field">Unidades a descontar<input className="input" name="cantidad" type="number" min="1" max={lote.cantidad} step="1" required /></label>
        <label className="field">Motivo
          <select className="select" name="motivo" defaultValue="PERDIDA">
            <option value="PERDIDA">Perdida</option><option value="DANO">Dano</option><option value="VENCIDO">Vencido</option><option value="OTRO">Otro</option>
          </select>
        </label>
        <label className="field full">Observacion<textarea className="textarea" name="observacion" /></label>
      </div>
      <FormError errores={errores} />
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onDone}>Cancelar</button>
        <button className="btn primary" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando...' : 'Registrar ajuste'}</button>
      </div>
    </form>
  )
}

export default function Inventario() {
  const { usuario } = useAuth()
  const escribe = puedeEscribirCatalogo(usuario?.rol)
  const [params, setParams] = useSearchParams()
  const [vista, setVista] = useState<'stock' | 'lotes'>(params.get('nuevo') ? 'lotes' : 'stock')
  const [estado, setEstado] = useState<EstadoStock | ''>('')
  const nuevo = params.get('nuevo') === 'lote'
  const [ajuste, setAjuste] = useState<Lote | null>(null)
  const inv = useInventario()
  const lotes = useLotes()
  const cerrarNuevo = () => { const n = new URLSearchParams(params); n.delete('nuevo'); setParams(n, { replace: true }) }
  const items = inv.data?.filter((i) => !estado || i.estado === estado)
  const hoy = parseFecha(isoHoy()).getTime()

  return (
    <Page deps={[inv.isLoading, lotes.isLoading, vista]}>
      <div className="page-head" data-reveal>
        <div className="chips" role="group" aria-label="Vista">
          <button type="button" className="chip" aria-pressed={vista === 'stock'} onClick={() => setVista('stock')}>Existencias</button>
          <button type="button" className="chip" aria-pressed={vista === 'lotes'} onClick={() => setVista('lotes')}>Lotes</button>
        </div>
        {escribe && <button type="button" className="btn primary" onClick={() => setParams({ nuevo: 'lote' }, { replace: true })}><PackagePlus size={18} aria-hidden="true" />Registrar lote</button>}
      </div>

      {vista === 'stock' ? (
        <section className="card" data-reveal aria-label="Existencias">
          <div className="chips" role="group" aria-label="Filtrar por estado" style={{ marginBottom: 14 }}>
            <button type="button" className="chip" aria-pressed={!estado} onClick={() => setEstado('')}>Todos</button>
            {(Object.keys(ESTADO) as EstadoStock[]).map((k) => <button key={k} type="button" className="chip" aria-pressed={estado === k} onClick={() => setEstado(k)}>{ESTADO[k].label}</button>)}
          </div>
          {inv.isLoading ? <SkeletonRows /> : inv.error ? <ErrorState error={inv.error} onRetry={() => inv.refetch()} /> : !items?.length ? (
            <EmptyState title="Sin resultados" text="No hay productos con ese estado." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Medicamento</th><th className="right">Disponible</th><th className="right">Minimo</th><th className="right">Vencido</th><th>Estado</th></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.medicamento.id}>
                      <td><div className="row-title">{i.medicamento.nombre}</div><div className="row-sub">{i.medicamento.presentacion}</div></td>
                      <td className="right"><strong>{i.disponible}</strong></td>
                      <td className="right">{i.medicamento.stockMinimo}</td>
                      <td className="right">{i.vencido}</td>
                      <td><span className={`pill ${ESTADO[i.estado].tono}`}>{ESTADO[i.estado].label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="card" data-reveal aria-label="Lotes">
          {lotes.isLoading ? <SkeletonRows /> : lotes.error ? <ErrorState error={lotes.error} onRetry={() => lotes.refetch()} /> : !lotes.data?.length ? (
            <EmptyState title="Aun no hay lotes" text="Registra el primer lote para ver el inventario." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Lote</th><th>Medicamento</th><th>Proveedor</th><th className="right">Cantidad</th><th>Vence</th>{escribe && <th><span className="sr-only">Acciones</span></th>}</tr></thead>
                <tbody>
                  {lotes.data.map((l) => {
                    const d = Math.round((parseFecha(l.fechaVencimiento).getTime() - hoy) / 864e5)
                    return (
                      <tr key={l.id}>
                        <td><strong>{l.numeroLote}</strong></td>
                        <td>{nombreMed(l.medicamento) !== '-' ? nombreMed(l.medicamento) : `#${l.medicamentoId}`}</td>
                        <td>{l.proveedor?.nombre ?? `#${l.proveedorId}`}</td>
                        <td className="right">{l.cantidad} <span className="muted">/ {l.cantidadInicial}</span></td>
                        <td><span className="row-sub" style={{ display: 'block' }}>{fmtFecha(l.fechaVencimiento)}</span><span className={`pill ${diasTono(d)}`}>{diasLabel(d)}</span></td>
                        {escribe && <td className="right"><button type="button" className="btn sm" disabled={l.cantidad === 0} onClick={() => setAjuste(l)}><MinusCircle size={15} aria-hidden="true" />Ajuste</button></td>}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <Modal open={nuevo} onClose={cerrarNuevo} title="Registrar lote"><LoteForm onDone={cerrarNuevo} /></Modal>
      <Modal open={!!ajuste} onClose={() => setAjuste(null)} title="Ajuste de lote">{ajuste && <AjusteForm lote={ajuste} onDone={() => setAjuste(null)} />}</Modal>
    </Page>
  )
}
