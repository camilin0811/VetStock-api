import { lazy, Suspense } from 'react'
import { CanvasBoundary } from './three/CanvasBoundary'
import { useGate } from './three/useGate'

const LoginCanvas = lazy(() => import('./three/LoginCanvas'))
const estatica = <div className="capsule-static" />

export function LoginAccent() {
  const { ref, visible, reduced } = useGate<HTMLDivElement>()
  return (
    <div className="login-canvas" ref={ref}>
      {reduced ? estatica : (
        <CanvasBoundary fallback={estatica}>
          <Suspense fallback={estatica}><LoginCanvas active={visible} /></Suspense>
        </CanvasBoundary>
      )}
    </div>
  )
}
