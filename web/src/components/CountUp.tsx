import { fmtNum } from '../lib/format'

interface Props { value: number; format?: (n: number) => string }
/** Muestra un numero; la animacion de conteo se agrega con GSAP (data-count). */
export function CountUp({ value, format = fmtNum }: Props) {
  return <span className="num" data-count={value}>{format(value)}</span>
}
