import { useState, type FormEvent } from 'react'
import { Ban, CheckCircle2, Layers, Syringe } from 'lucide-react'
import { post } from '../api/client'
import { crear, mensajesDe, useAccion, useDispensaciones, useInventario, useMedicamentos } from '../api/hooks'
import type { Dispensacion, Un } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { FormError } from '../components/FormError'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { fmtFecha, fmtMoney, nombreMed } from '../lib/format'

function Anular({ d, onDone }: { d: Dispensacion; onDone: () => void }) {
  const [errores, setErrores] = useState<string[]>([])
  const anular = useAccion((motivo: string) => post(`/dispensaciones/${d.id}/anular`, { motivo }), 'Dispensación anulada, stock devuelto', false)
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrores([])
    try { await anular.mutateAsync(String(new FormData(e.currentTarget).get('motivo')).trim()); onDone() } catch (err) { setErrores(mensajesDe(err)) }
  }
  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={enviar}>
      <p>Se devolverá al inventario el stock de {nombreMed(d.medicamento)} x {d.cantidad} (paciente {d.mascota}) en los lotes que se usaron.</p>
      <label className="field">Motivo<textarea className="textarea" name="motivo" required minLength={3} maxLength={255} /></label>
      <FormError errores={errores} />
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onDone}>Cancelar</button>
        <button className="btn danger" disabled={anular.isPending}>{anular.isPending ? 'Anulando...' : 'Anular dispensación'}</button>
      </div>
    </form>
  )
}

export default function Dispensar() {
  const { usuario } = useAuth()
  const puedeAnular = usuario?.rol === 'admin' || usuario?.rol === 'farmaceutico'
  const meds = useMedicamentos()
  const inv = useInventario()
  const [medId, setMedId] = useState('')
  const [mascota, setMascota] = useState('')
  const [errores, setErrores] = useState<string[]>([])
  const [resultado, setResultado] = useState<Dispensacion | null>(null)
  const [anulando, setAnulando] = useState<Dispensacion | null>(null)
  const [formKey, setFormKey] = useState(0)
  const historial = useDispensaciones({ mascota: mascota || undefined })
  const med = meds.data?.find((m) => String(m.id) === medId)
  const disponible = inv.data?.find((i) => String(i.medicamento.id) === medId)?.disponible

  const dispensar = useAccion((b: Record<string, unknown>) => crear('/dispensaciones')(b) as Promise<Un<Dispensacion>>, 'Dispensación registrada', false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setErrores([])
    try {
      const r = await dispensar.mutateAsync({
        medicamentoId: Number(medId), cantidad: Number(f.get('cantidad')), mascota: String(f.get('mascota')).trim(),
        veterinario: String(f.get('veterinario')).trim(), formula: med?.requiereFormula ? String(f.get('formula')).trim() : undefined,
      })
      setResultado(r.data)
      setMedId('')
      setFormKey((k) => k + 1)
    } catch (err) { setErrores(mensajesDe(err)) }
  }

  return (
    <Page deps={[historial.isLoading]}>
      <div className="cols-2 dispensar-top">
        <section className="card" data-reveal aria-labelledby="h-form">
          <div className="card-head"><h2 id="h-form">Nueva dispensación</h2></div>
          <form className="stack" style={{ gap: 14 }} onSubmit={enviar} key={formKey}>
            <div className="form-grid">
              <label className="field full">Medicamento
                <select className="select" required value={medId} onChange={(e) => setMedId(e.target.value)}>
                  <option value="" disabled>Elige un medicamento</option>
                  {meds.data?.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.presentacion})</option>)}
                </select>
                {medId && <span className="hint">{disponible === undefined ? 'Consultando stock...' : `${disponible} unidades disponibles`} {med?.requiereFormula && '· requiere fórmula'}</span>}
              </label>
              <label className="field">Cantidad<input className="input" name="cantidad" type="number" min="1" max={disponible || undefined} step="1" required /></label>
              <label className="field">Paciente (mascota)<input className="input" name="mascota" required maxLength={100} /></label>
              <label className="field full">Veterinario<input className="input" name="veterinario" required maxLength={255} defaultValue={usuario?.rol === 'veterinario' ? usuario.nombre : ''} /></label>
              {med?.requiereFormula && <label className="field full">Fórmula médica<textarea className="textarea" name="formula" required maxLength={100} /></label>}
            </div>
            <FormError errores={errores} />
            <button className="btn primary" style={{ justifyContent: 'center', height: 50 }} disabled={dispensar.isPending || !medId}><Syringe size={18} aria-hidden="true" />{dispensar.isPending ? 'Dispensando...' : 'Dispensar'}</button>
          </form>
        </section>

        <section className="card soft" data-reveal aria-labelledby="h-fefo" aria-live="polite">
          <div className="card-head"><h2 id="h-fefo">Resultado FEFO</h2>{resultado && <span className="pill ok"><CheckCircle2 size={14} aria-hidden="true" />Registrada</span>}</div>
          {!resultado ? (
            <EmptyState title="El primero en vencer sale primero" text="Al dispensar, VetStock descuenta de los lotes con vencimiento más cercano y te muestra cuáles usó." />
          ) : (
            <div className="stack" style={{ gap: 14 }}>
              <div><div className="row-title">{nombreMed(resultado.medicamento)} x {resultado.cantidad}</div><div className="row-sub">Paciente {resultado.mascota} · {resultado.veterinario}</div></div>
              <h3 className="mini-title"><Layers size={15} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Lotes usados</h3>
              <ul className="list">
                {resultado.lotesUsados.map((l) => (
                  <li key={l.loteId} className="list-item slim">
                    <div className="grow"><div className="row-title">Lote {l.numeroLote}</div><div className="row-sub">Vence {fmtFecha(l.fechaVencimiento)}</div></div>
                    <span className="pill info">{l.cantidad} u</span>
                  </li>
                ))}
              </ul>
              <div className="row-title">Total {fmtMoney(resultado.total)}</div>
            </div>
          )}
        </section>
      </div>

      <section className="card" data-reveal aria-labelledby="h-hist">
        <div className="card-head">
          <h2 id="h-hist">Historial</h2>
          <div className="search wide-search" role="search" aria-label="Filtrar historial" style={{ width: 'min(260px, 100%)', height: 40 }}>
            <input type="search" aria-label="Filtrar por paciente" placeholder="Filtrar por paciente" value={mascota} onChange={(e) => setMascota(e.target.value)} />
          </div>
        </div>
        {historial.isLoading ? <SkeletonRows /> : historial.error ? <ErrorState error={historial.error} onRetry={() => historial.refetch()} /> : !historial.data?.length ? (
          <EmptyState title="Sin dispensaciones" text={mascota ? 'No hay resultados para ese paciente.' : 'Aún no se ha dispensado nada.'} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Fecha</th><th>Medicamento</th><th>Paciente</th><th>Lotes</th><th className="right">Total</th><th>Estado</th>{puedeAnular && <th><span className="sr-only">Acciones</span></th>}</tr></thead>
              <tbody>
                {historial.data.map((d) => (
                  <tr key={d.id} className={d.estado === 'ANULADA' ? 'anulada' : undefined}>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>{fmtFecha(d.fecha)}</td>
                    <td><div className="row-title">{nombreMed(d.medicamento)} x {d.cantidad}</div><div className="row-sub">{d.veterinario}</div></td>
                    <td>{d.mascota}</td>
                    <td className="row-sub">{d.lotesUsados.map((l) => `${l.numeroLote} (${l.cantidad})`).join(', ') || '-'}</td>
                    <td className="right num">{fmtMoney(d.total)}</td>
                    <td><span className={`pill ${d.estado === 'ACTIVA' ? 'ok' : 'bad'}`}>{d.estado === 'ACTIVA' ? 'Activa' : 'Anulada'}</span></td>
                    {puedeAnular && <td className="right">{d.estado === 'ACTIVA' && <button type="button" className="btn sm danger" onClick={() => setAnulando(d)}><Ban size={15} aria-hidden="true" />Anular</button>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={!!anulando} onClose={() => setAnulando(null)} title="Anular dispensación">{anulando && <Anular d={anulando} onDone={() => setAnulando(null)} />}</Modal>
    </Page>
  )
}
