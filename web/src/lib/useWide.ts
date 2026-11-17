import { useSyncExternalStore } from 'react'

/** true si el viewport es >= query (p. ej. '(min-width: 1100px)'). */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
