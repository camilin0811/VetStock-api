import { useRef } from 'react'
import { fmtNum } from '../lib/format'
import { gsap, NO_MOTION_OK, ScrollTrigger, useGSAP } from '../lib/gsap'

interface Props { value: number; format?: (n: number) => string }

/** Conteo animado al entrar en pantalla; con movimiento reducido muestra el valor final. */
export function CountUp({ value, format = fmtNum }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(NO_MOTION_OK, () => {
        const o = { v: 0 }
        el.textContent = format(0)
        const tween = gsap.to(o, {
          v: value, duration: 1.2, ease: 'power3.out', paused: true,
          onUpdate: () => { el.textContent = format(Math.round(o.v)) },
          onComplete: () => { el.textContent = format(value) },
        })
        ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: () => tween.play() })
      })
      return () => { el.textContent = format(value) }
    },
    { scope: ref, dependencies: [value], revertOnUpdate: true },
  )
  return <span className="num" ref={ref}>{format(value)}</span>
}
