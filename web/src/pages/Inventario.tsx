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
import { fmtFecha, isoHoy, isoManana, nombreMed, parseFecha } from '../lib/format'
import { ESTADO_STOCK, EtiquetaStock, EtiquetaVencimiento } from '../components/Etiqueta'

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
        <label className="field">Número de lote<input className="input" name="numeroLote" required maxLength={100} /></label>
        <label className="field">Cantidad<input className="input" name="cantidad" type="number" min="1" step="1" required /></label>
        <label className="field full">Fecha de vencimiento<input className="input" name="fechaVencimiento" type="date" min={isoManana()} required /></label>
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
            <option value="PERDIDA">Pérdida</option><option value="DANO">Daño</option><option value="VENCIDO">Vencido</option><option value="OTRO">Otro</option>
          </select>
        </label>
        <label className="field full">Observación<textarea className="textarea" name="observacion" maxLength={240} /></label>
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
        <div className="chips chips-scroll" role="group" aria-label="Vista">
          <button type="button" className="chip" aria-pressed={vista === 'stock'} onClick={() => setVista('stock')}>Existencias</button>
          <button type="button" className="chip" aria-pressed={vista === 'lotes'} onClick={() => setVista('lotes')}>Lotes</button>
        </div>
        {escribe && <button type="button" className="btn primary" onClick={() => setParams({ nuevo: 'lote' }, { replace: true })}><PackagePlus size={18} aria-hidden="true" />Registrar lote</button>}
      </div>

      {vista === 'stock' ? (
        <section className="card" data-reveal aria-label="Existencias">
          <div className="chips chips-scroll" role="group" aria-label="Filtrar por estado" style={{ marginBottom: 14 }}>
            <button type="button" className="chip" aria-pressed={!estado} onClick={() => setEstado('')}>Todos</button>
            {(Object.keys(ESTADO_STOCK) as EstadoStock[]).map((k) => <button key={k} type="button" className="chip" aria-pressed={estado === k} onClick={() => setEstado(k)}>{ESTADO_STOCK[k].label}</button>)}
          </div>
          {inv.isLoading ? <SkeletonRows /> : inv.error ? <ErrorState error={inv.error} onRetry={() => inv.refetch()} /> : !items?.length ? (
            <EmptyState title="Sin resultados" text="No hay productos con ese estado." />
          ) : (
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabla de datos, desplazable">
              <table className="table cards">
                <caption className="sr-only">Existencias por medicamento</caption>
                <thead><tr><th scope="col">Medicamento</th><th scope="col" className="right">Disponible</th><th scope="col" className="right">Mínimo</th><th scope="col" className="right">Vencido</th><th scope="col">Estado</th></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.medicamento.id}>
                      <td className="cell-title"><div className="row-title">{i.medicamento.nombre}</div><div className="row-sub">{i.medicamento.presentacion}</div></td>
                      <td data-label="Disponible" className="right"><strong>{i.disponible}</strong></td>
                      <td data-label="Mínimo" className="right">{i.medicamento.stockMinimo}</td>
                      <td data-label="Vencido" className="right">{i.vencido}</td>
                      <td data-label="Estado"><EtiquetaStock estado={i.estado} /></td>
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
            <EmptyState title="Aún no hay lotes" text="Registra el primer lote para ver el inventario." />
          ) : (
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabla de datos, desplazable">
              <table className="table cards">
                <caption className="sr-only">Lotes registrados</caption>
                <thead><tr><th scope="col">Lote</th><th scope="col">Medicamento</th><th scope="col">Proveedor</th><th scope="col" className="right">Cantidad</th><th scope="col">Vence</th>{escribe && <th scope="col"><span className="sr-only">Acciones</span></th>}</tr></thead>
                <tbody>
                  {lotes.data.map((l) => {
                    const d = Math.round((parseFecha(l.fechaVencimiento).getTime() - hoy) / 864e5)
                    return (
                      <tr key={l.id}>
                        <td className="cell-title"><strong>{l.numeroLote}</strong></td>
                        <td data-label="Medicamento">{nombreMed(l.medicamento) !== '-' ? nombreMed(l.medicamento) : `#${l.medicamentoId}`}</td>
                        <td data-label="Proveedor">{l.proveedor?.nombre ?? `#${l.proveedorId}`}</td>
                        <td data-label="Cantidad" className="right">{l.cantidad} <span className="muted">/ {l.cantidadInicial}</span></td>
                        <td data-label="Vence"><span className="row-sub" style={{ display: 'block', marginBottom: 4 }}>{fmtFecha(l.fechaVencimiento)}</span><EtiquetaVencimiento dias={d} /></td>
                        {escribe && <td className="right cell-actions"><button type="button" className="btn sm" disabled={l.cantidad === 0} onClick={() => setAjuste(l)}><MinusCircle size={15} aria-hidden="true" />Ajuste</button></td>}
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
