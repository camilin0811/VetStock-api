import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Pill as PillIcon, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { actualizar, borrar, crear, mensajesDe, useAccion, useCategorias, useInventario, useLotes, useMedicamentos } from '../api/hooks'
import { ESPECIES, type Medicamento } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { puedeEscribirCatalogo } from '../components/nav'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { FormError } from '../components/FormError'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { diasLabel, diasTono, fmtFecha, fmtMoney, parseFecha, isoHoy, plural } from '../lib/format'
import { useMedia } from '../lib/useWide'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function MedForm({ med, onDone }: { med?: Medicamento; onDone: () => void }) {
  const cats = useCategorias()
  const [sel, setSel] = useState<number[]>(med?.categorias.map((c) => c.id) ?? [])
  const [errores, setErrores] = useState<string[]>([])
  const guardar = useAccion(
    (b: Record<string, unknown>) => (med ? actualizar('/medicamentos')({ id: med.id, ...b }) : crear('/medicamentos')(b)),
    med ? 'Medicamento actualizado' : 'Medicamento creado', false,
  )
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setErrores([])
    try {
      await guardar.mutateAsync({
        nombre: String(f.get('nombre')).trim(), presentacion: String(f.get('presentacion')).trim(), especie: String(f.get('especie')),
        precio: Number(f.get('precio')), stockMinimo: Number(f.get('stockMinimo')), requiereFormula: f.get('requiereFormula') === 'on', categoriaIds: sel,
      })
      onDone()
    } catch (err) { setErrores(mensajesDe(err)) }
  }
  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={enviar}>
      <div className="form-grid">
        <label className="field full">Nombre<input className="input" name="nombre" required defaultValue={med?.nombre} /></label>
        <label className="field">Presentacion<input className="input" name="presentacion" required defaultValue={med?.presentacion} placeholder="Caja x20" /></label>
        <label className="field">Especie
          <select className="select" name="especie" defaultValue={med?.especie ?? 'general'}>{ESPECIES.map((e) => <option key={e} value={e}>{cap(e)}</option>)}</select>
        </label>
        <label className="field">Precio<input className="input" name="precio" type="number" min="0" step="0.01" required defaultValue={med?.precio} /></label>
        <label className="field">Stock minimo<input className="input" name="stockMinimo" type="number" min="0" step="1" required defaultValue={med?.stockMinimo ?? 0} /></label>
        <label className="check full"><input type="checkbox" name="requiereFormula" defaultChecked={med?.requiereFormula} />Requiere formula medica</label>
        <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ padding: 0, marginBottom: 6 }}>Categorias</legend>
          <div className="chips">
            {cats.data?.map((c) => (
              <button type="button" key={c.id} className="chip" aria-pressed={sel.includes(c.id)} onClick={() => setSel((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))}>{c.nombre}</button>
            ))}
            {cats.isLoading && <span className="muted">Cargando...</span>}
            {cats.data?.length === 0 && <span className="muted">Aun no hay categorias.</span>}
          </div>
        </fieldset>
      </div>
      <FormError errores={errores} />
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onDone}>Cancelar</button>
        <button className="btn primary" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando...' : med ? 'Guardar cambios' : 'Crear medicamento'}</button>
      </div>
    </form>
  )
}

function Detalle({ med, escribe, onEdit, onDelete }: { med: Medicamento; escribe: boolean; onEdit: () => void; onDelete: () => void }) {
  const lotes = useLotes(med.id)
  const inv = useInventario()
  const item = inv.data?.find((i) => i.medicamento.id === med.id)
  const hoy = isoHoy()
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="detail-head">
        <span className="list-ico big"><PillIcon size={26} aria-hidden="true" /></span>
        <div>
          <h2>{med.nombre}</h2>
          <p className="muted">{med.presentacion} · {cap(med.especie)}</p>
        </div>
      </div>
      <div className="chips">
        {item && <span className={`pill ${item.estado === 'OK' ? 'ok' : item.estado === 'STOCK_BAJO' ? 'warn' : 'bad'}`}>{item.estado === 'OK' ? 'Stock OK' : item.estado === 'STOCK_BAJO' ? 'Stock bajo' : 'Sin stock'}</span>}
        {med.requiereFormula && <span className="pill info"><ShieldCheck size={14} aria-hidden="true" />Requiere formula</span>}
        {med.categorias.map((c) => <span key={c.id} className="pill">{c.nombre}</span>)}
      </div>
      <dl className="facts">
        <div><dt>Precio</dt><dd>{fmtMoney(med.precio)}</dd></div>
        <div><dt>Stock minimo</dt><dd>{med.stockMinimo}</dd></div>
        <div><dt>Disponible</dt><dd>{item ? item.disponible : '-'}</dd></div>
        <div><dt>Vencido</dt><dd>{item ? item.vencido : '-'}</dd></div>
      </dl>
      <div>
        <h3 className="mini-title">Lotes</h3>
        {lotes.isLoading ? <SkeletonRows rows={2} h={44} /> : !lotes.data?.length ? <p className="muted">Sin lotes registrados.</p> : (
          <ul className="list">
            {lotes.data.map((l) => {
              const d = Math.round((parseFecha(l.fechaVencimiento).getTime() - parseFecha(hoy).getTime()) / 864e5)
              return (
                <li key={l.id} className="list-item slim">
                  <div className="grow"><div className="row-title">{l.numeroLote}</div><div className="row-sub">{l.cantidad} u · vence {fmtFecha(l.fechaVencimiento)}</div></div>
                  <span className={`pill ${diasTono(d)}`}>{diasLabel(d)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {escribe && (
        <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn" onClick={onEdit}><Pencil size={16} aria-hidden="true" />Editar</button>
          <button type="button" className="btn danger" onClick={onDelete}><Trash2 size={16} aria-hidden="true" />Eliminar</button>
        </div>
      )}
    </div>
  )
}

export default function Medicamentos() {
  const { usuario } = useAuth()
  const escribe = puedeEscribirCatalogo(usuario?.rol)
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const especie = params.get('especie') ?? ''
  const cat = params.get('cat') ? Number(params.get('cat')) : undefined
  const filtros = useMemo(() => ({ q: q || undefined, especie: especie || undefined, categoriaId: cat }), [q, especie, cat])
  const meds = useMedicamentos(filtros)
  const cats = useCategorias()
  const wide = useMedia('(min-width: 1100px)')
  const [selId, setSelId] = useState<number | null>(null)
  const [form, setForm] = useState<'nuevo' | 'editar' | null>(null)
  const [borrando, setBorrando] = useState(false)
  const detalleRef = useRef<HTMLElement>(null)

  const sel = meds.data?.find((m) => m.id === selId) ?? (wide ? meds.data?.[0] : undefined)
  const eliminar = useAccion(borrar('/medicamentos'), 'Medicamento eliminado')

  const setFiltro = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v); else n.delete(k)
    setParams(n, { replace: true })
  }
  const hayFiltros = !!(q || especie || cat)

  return (
    <Page deps={[meds.isLoading]}>
      <div className="page-head" data-reveal>
        <div className="grow">
          <div className="search wide-search" role="search">
            <input type="search" aria-label="Filtrar por nombre" placeholder="Filtrar por nombre" defaultValue={q} onChange={(e) => setFiltro('q', e.target.value)} />
          </div>
        </div>
        {escribe && <button type="button" className="btn primary" onClick={() => setForm('nuevo')}><Plus size={18} aria-hidden="true" />Nuevo medicamento</button>}
      </div>

      <div className="card soft stack" style={{ gap: 12 }} data-reveal>
        <div className="chips" role="group" aria-label="Filtrar por especie">
          <button type="button" className="chip" aria-pressed={!especie} onClick={() => setFiltro('especie', '')}>Todas las especies</button>
          {ESPECIES.map((e) => <button key={e} type="button" className="chip" aria-pressed={especie === e} onClick={() => setFiltro('especie', e)}>{cap(e)}</button>)}
        </div>
        {!!cats.data?.length && (
          <div className="chips" role="group" aria-label="Filtrar por categoria">
            <button type="button" className="chip" aria-pressed={!cat} onClick={() => setFiltro('cat', '')}>Todas las categorias</button>
            {cats.data.map((c) => <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setFiltro('cat', String(c.id))}>{c.nombre}</button>)}
          </div>
        )}
      </div>

      <div className="split">
        <section className="card" data-reveal aria-label="Lista de medicamentos">
          {meds.isLoading ? <SkeletonRows /> : meds.error ? <ErrorState error={meds.error} onRetry={() => meds.refetch()} /> : !meds.data?.length ? (
            <EmptyState title={hayFiltros ? 'Sin resultados' : 'Aun no hay medicamentos'} text={hayFiltros ? 'Prueba con otros filtros.' : 'Crea el primero para empezar a controlar su stock.'}
              action={hayFiltros ? <button type="button" className="btn" onClick={() => setParams({}, { replace: true })}>Limpiar filtros</button> : escribe ? <button type="button" className="btn primary" onClick={() => setForm('nuevo')}>Nuevo medicamento</button> : undefined} />
          ) : (
            <>
              <p className="muted" style={{ marginBottom: 10 }}>{meds.data.length} {plural(meds.data.length, 'medicamento')}</p>
              <ul className="list">
                {meds.data.map((m) => (
                  <li key={m.id}>
                    <button type="button" className={`row-btn${sel?.id === m.id ? ' on' : ''}`} aria-pressed={sel?.id === m.id} onClick={() => { setSelId(m.id); if (!wide) setTimeout(() => detalleRef.current?.focus(), 0) }}>
                      <span className="list-ico"><PillIcon size={20} aria-hidden="true" /></span>
                      <span className="grow"><span className="row-title">{m.nombre}</span><span className="row-sub" style={{ display: 'block' }}>{m.presentacion} · {cap(m.especie)}</span></span>
                      <span className="chips" style={{ justifyContent: 'flex-end' }}>{m.categorias.slice(0, 2).map((c) => <span key={c.id} className="pill">{c.nombre}</span>)}</span>
                      <span className="num row-price">{fmtMoney(m.precio)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {wide && (
          <aside className="card detail" data-reveal aria-label="Detalle del medicamento">
            {sel ? <Detalle med={sel} escribe={escribe} onEdit={() => setForm('editar')} onDelete={() => setBorrando(true)} /> : <EmptyState title="Elige un medicamento" text="Veras su stock, lotes y categorias aqui." />}
          </aside>
        )}
      </div>

      {!wide && (
        <Modal open={!!selId && !!sel && !form && !borrando} onClose={() => setSelId(null)} title="Detalle">
          {sel && <Detalle med={sel} escribe={escribe} onEdit={() => setForm('editar')} onDelete={() => setBorrando(true)} />}
        </Modal>
      )}
      <Modal open={form !== null} onClose={() => setForm(null)} title={form === 'editar' ? 'Editar medicamento' : 'Nuevo medicamento'}>
        <MedForm med={form === 'editar' ? sel : undefined} onDone={() => setForm(null)} />
      </Modal>
      <ConfirmModal open={borrando} title="Eliminar medicamento" text={`Se eliminara ${sel?.nombre ?? ''}. Si tiene lotes no podras hacerlo.`} confirmLabel="Eliminar" busy={eliminar.isPending}
        onClose={() => setBorrando(false)} onConfirm={() => sel && eliminar.mutate(sel.id, { onSuccess: () => { setBorrando(false); setSelId(null) }, onError: () => setBorrando(false) })} />
    </Page>
  )
}
