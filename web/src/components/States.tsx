import { AlertCircle, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function Skeleton({ h = 16, w = '100%', r }: { h?: number; w?: string | number; r?: number }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />
}

export function SkeletonRows({ rows = 5, h = 52 }: { rows?: number; h?: number }) {
  return (
    <div className="stack" style={{ gap: 10 }} role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={h} r={16} />)}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="state">
      <Inbox size={36} aria-hidden="true" />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : 'No pudimos cargar los datos.'
  return (
    <div className="state error" role="alert">
      <AlertCircle size={36} aria-hidden="true" />
      <h3>Algo salio mal</h3>
      <p>{msg}</p>
      {onRetry && <button type="button" className="btn" onClick={onRetry}>Reintentar</button>}
    </div>
  )
}
