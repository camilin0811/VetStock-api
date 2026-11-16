import { useState, type FormEvent, type ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { actualizar, borrar, crear, mensajesDe, useAccion } from '../api/hooks'
import { Page } from './Page'
import { Modal } from './Modal'
import { ConfirmModal } from './ConfirmModal'
import { FormError } from './FormError'
import { EmptyState, ErrorState, SkeletonRows } from './States'

export interface Field {
  name: string; label: string; type?: 'text' | 'email' | 'tel' | 'password' | 'textarea' | 'select'
  options?: { value: string; label: string }[]; required?: boolean; full?: boolean; hint?: string; requiredOnCreateOnly?: boolean
}
export interface Column<T> { header: string; cell: (t: T) => ReactNode; right?: boolean }
interface Props<T extends { id: number }> {
  singular: string; base: string; query: UseQueryResult<T[]>; fields: Field[]; columns: Column<T>[]
  canWrite: boolean; create?: (b: Record<string, unknown>) => Promise<unknown>; emptyText: string; canDelete?: (t: T) => boolean; deleteText?: (t: T) => string; nameOf: (t: T) => string
}

export function CrudPage<T extends { id: number }>({ singular, base, query, fields, columns, canWrite, create, emptyText, canDelete, deleteText, nameOf }: Props<T>) {
  const [form, setForm] = useState<{ item?: T } | null>(null)
  const [borrando, setBorrando] = useState<T | null>(null)
  const [errores, setErrores] = useState<string[]>([])
  const editing = form?.item
  const guardar = useAccion((b: Record<string, unknown>) => (editing ? actualizar(base)({ id: editing.id, ...b }) : (create ?? crear(base))(b)), editing ? `${singular} actualizado` : `${singular} creado`, false)
  const eliminar = useAccion(borrar(base), `${singular} eliminado`)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {}
    for (const fl of fields) {
      const v = String(f.get(fl.name) ?? '').trim()
      if (v !== '' || (fl.required && !fl.requiredOnCreateOnly)) body[fl.name] = v
    }
    setErrores([])
    try { await guardar.mutateAsync(body); setForm(null) } catch (err) { setErrores(mensajesDe(err)) }
  }
  const abrir = (item?: T) => { setErrores([]); setForm({ item }) }

  return (
    <Page deps={[query.isLoading]}>
      {canWrite && <div className="page-head" data-reveal><span className="grow" /><button type="button" className="btn primary" onClick={() => abrir()}><Plus size={18} aria-hidden="true" />Nuevo {singular.toLowerCase()}</button></div>}
      <section className="card" data-reveal>
        {query.isLoading ? <SkeletonRows /> : query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : !query.data?.length ? (
          <EmptyState title={`Aún no hay ${singular.toLowerCase()}s`} text={emptyText} action={canWrite ? <button type="button" className="btn primary" onClick={() => abrir()}>Crear {singular.toLowerCase()}</button> : undefined} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr>{columns.map((c) => <th key={c.header} className={c.right ? 'right' : ''}>{c.header}</th>)}{canWrite && <th><span className="sr-only">Acciones</span></th>}</tr></thead>
              <tbody>
                {query.data.map((t) => (
                  <tr key={t.id}>
                    {columns.map((c) => <td key={c.header} className={c.right ? 'right' : ''}>{c.cell(t)}</td>)}
                    {canWrite && (
                      <td className="right" style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn icon" aria-label={`Editar ${nameOf(t)}`} onClick={() => abrir(t)}><Pencil size={16} /></button>{' '}
                        {(!canDelete || canDelete(t)) && <button type="button" className="btn icon danger" aria-label={`Eliminar ${nameOf(t)}`} onClick={() => setBorrando(t)}><Trash2 size={16} /></button>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={form !== null} onClose={() => setForm(null)} title={editing ? `Editar ${singular.toLowerCase()}` : `Nuevo ${singular.toLowerCase()}`}>
        <form className="stack" style={{ gap: 14 }} onSubmit={enviar}>
          <div className="form-grid">
            {fields.map((fl) => {
              const val = editing ? (editing as Record<string, unknown>)[fl.name] : undefined
              const req = fl.required && !(fl.requiredOnCreateOnly && editing)
              return (
                <label key={fl.name} className={`field${fl.full ? ' full' : ''}`}>{fl.label}
                  {fl.type === 'textarea' ? <textarea className="textarea" name={fl.name} required={req} defaultValue={(val as string) ?? ''} />
                    : fl.type === 'select' ? <select className="select" name={fl.name} required={req} defaultValue={(val as string) ?? fl.options?.[0]?.value}>{fl.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                    : <input className="input" name={fl.name} type={fl.type ?? 'text'} required={req} autoComplete={fl.type === 'password' ? 'new-password' : 'off'} defaultValue={fl.type === 'password' ? '' : ((val as string) ?? '')} />}
                  {fl.hint && <span className="hint">{editing && fl.type === 'password' ? 'Deja vacio para conservar la actual.' : fl.hint}</span>}
                </label>
              )
            })}
          </div>
          <FormError errores={errores} />
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn primary" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
      <ConfirmModal open={!!borrando} title={`Eliminar ${singular.toLowerCase()}`} text={borrando ? (deleteText?.(borrando) ?? `Se eliminará ${nameOf(borrando)}.`) : ''} confirmLabel="Eliminar" busy={eliminar.isPending}
        onClose={() => setBorrando(null)} onConfirm={() => borrando && eliminar.mutate(borrando.id, { onSettled: () => setBorrando(null) })} />
    </Page>
  )
}
