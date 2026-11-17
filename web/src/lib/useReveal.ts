import type { RefObject } from 'react'
import { gsap, NO_MOTION_OK, ScrollTrigger, useGSAP } from './gsap'

/**
 * Entradas con GSAP dentro de `scope`:
 *  - [data-reveal]: aparecen escalonadas al entrar al viewport (ScrollTrigger.batch)
 *  - .quick-item: entrada escalonada de la barra de acciones
 * Todo se limpia con el contexto de useGSAP; con prefers-reduced-motion no se anima nada.
 */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(NO_MOTION_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]')
        if (items.length) {
          gsap.set(items, { opacity: 0, y: 28, scale: 0.98 })
          ScrollTrigger.batch(items, {
            start: 'top 94%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', stagger: 0.09, overwrite: true, clearProps: 'transform,opacity' }),
          })
          // Red de seguridad: el contenido nunca depende de que el ScrollTrigger dispare (pestana en segundo plano, scroll en contenedor, etc.)
          const rescate = gsap.delayedCall(3, () => gsap.to(items, { opacity: 1, y: 0, scale: 1, duration: 0.4, clearProps: 'transform,opacity' }))
          return () => { rescate.kill() }
        }
        const quick = gsap.utils.toArray<HTMLElement>('.quick-item')
        if (quick.length) gsap.from(quick, { y: 16, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.07, delay: 0.25, clearProps: 'transform,opacity' })
      })
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  )
}
