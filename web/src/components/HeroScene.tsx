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
    <div className="hero-visual" ref={ref} role="img" aria-label="Ilustración decorativa: un frasco de medicamento con cápsulas girando a su alrededor">
      {reduced ? fallback : (
        <CanvasBoundary fallback={fallback}>
          <Suspense fallback={fallback}><HeroCanvas active={visible} /></Suspense>
        </CanvasBoundary>
      )}
    </div>
  )
}
