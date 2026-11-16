const nf = new Intl.NumberFormat('es-CO')
const mf = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const fmtNum = (n: number) => nf.format(n)
export const fmtMoney = (n: number) => mf.format(n)

/** Fecha 'YYYY-MM-DD' (o ISO) sin corrimiento por zona horaria. */
export function parseFecha(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const fmtFecha = (s: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  parseFecha(s).toLocaleDateString('es-CO', o)
export const fmtFechaHora = (s: string) =>
  new Date(s).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function diasLabel(d: number) {
  if (d < 0) return `Vencido hace ${-d} d`
  if (d === 0) return 'Vence hoy'
  return `En ${d} días`
}
export const diasTono = (d: number): 'bad' | 'warn' | 'info' => (d <= 7 ? 'bad' : d <= 30 ? 'warn' : 'info')
export const isoHoy = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}
export const nombreMed = (m: unknown) =>
  typeof m === 'string' ? m : m && typeof m === 'object' && 'nombre' in m ? String((m as { nombre: string }).nombre) : '-'
export const plural = (n: number, uno: string, varios = uno + 's') => (n === 1 ? uno : varios)
