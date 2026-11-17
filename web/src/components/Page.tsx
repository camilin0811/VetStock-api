import { useRef, type ReactNode } from 'react'
import { useReveal } from '../lib/useReveal'

/** Contenedor de pagina: entrada escalonada de los elementos [data-reveal] (GSAP). */
export function Page({ children, deps = [] }: { children: ReactNode; deps?: unknown[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref, deps)
  return <div className="stack page" ref={ref}>{children}</div>
}
