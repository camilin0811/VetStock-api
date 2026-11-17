import type { ReactNode } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, CircleX, Info, type LucideIcon } from 'lucide-react'
import type { EstadoStock } from '../api/types'
import { diasLabel, diasTono } from '../lib/format'

export type Tono = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'

/** Icono por tono: el estado nunca depende solo del color. */
const ICONO: Record<Tono, LucideIcon | null> = { ok: CheckCircle2, warn: AlertTriangle, bad: CircleX, info: Info, neutral: null }

interface Props { tono?: Tono; icon?: LucideIcon | false; children: ReactNode }

/** Etiqueta de estado unica: pastilla con icono + texto, tonos AA. */
export function Etiqueta({ tono = 'neutral', icon, children }: Props) {
  const Icon = icon === false ? null : icon ?? ICONO[tono]
  return (
    <span className={`pill ${tono}`}>
      {Icon && <Icon size={14} strokeWidth={2.25} aria-hidden="true" />}
      {children}
    </span>
  )
}

export const ESTADO_STOCK: Record<EstadoStock, { label: string; corto: string; tono: Tono }> = {
  OK: { label: 'Stock OK', corto: 'OK', tono: 'ok' },
  STOCK_BAJO: { label: 'Stock bajo', corto: 'Bajo', tono: 'warn' },
  SIN_STOCK: { label: 'Agotado', corto: 'Agotado', tono: 'bad' },
}

export function EtiquetaStock({ estado, corto }: { estado: EstadoStock; corto?: boolean }) {
  const e = ESTADO_STOCK[estado]
  return <Etiqueta tono={e.tono}>{corto ? e.corto : e.label}</Etiqueta>
}

export function EtiquetaVencimiento({ dias }: { dias: number }) {
  return <Etiqueta tono={diasTono(dias)} icon={dias < 0 ? CircleX : CalendarClock}>{diasLabel(dias)}</Etiqueta>
}

export function EtiquetaDispensacion({ estado }: { estado: string }) {
  return estado === 'ACTIVA' ? <Etiqueta tono="ok">Activa</Etiqueta> : <Etiqueta tono="bad" icon={CircleX}>Anulada</Etiqueta>
}
