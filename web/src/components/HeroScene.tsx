import { lazy, Suspense } from 'react'
import { HeroVisual } from './HeroVisual'
import { CanvasBoundary } from './three/CanvasBoundary'
import { useGate } from './three/useGate'

const HeroCanvas = lazy(() => import('./three/HeroCanvas'))

/** Hero 3D bajo demanda: fallback SVG mientras carga, sin WebGL o con movimiento reducido. */
export function HeroScene() {
  const { ref, visible, reduced } = useGate<HTMLDivElement>()
  const fallback = <HeroVisual />
  return (
    <div className="hero-visual" ref={ref} aria-hidden="true">
      {reduced ? fallback : (
        <CanvasBoundary fallback={fallback}>
          <Suspense fallback={fallback}><HeroCanvas active={visible} /></Suspense>
        </CanvasBoundary>
      )}
    </div>
  )
}
