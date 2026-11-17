import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Kind = 'success' | 'error' | 'info'
interface ToastItem { id: number; kind: Kind; messages: string[] }
interface ToastApi { success: (m: string) => void; error: (m: string | string[]) => void; info: (m: string) => void }

const Ctx = createContext<ToastApi>({ success() {}, error() {}, info() {} })
let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const push = useCallback((kind: Kind, m: string | string[]) => {
    const id = ++seq
    setItems((l) => [...l.slice(-3), { id, kind, messages: Array.isArray(m) ? m : [m] }])
    // Los errores permanecen hasta que se cierran (2.2.1); los avisos informativos se retiran solos
    if (kind !== 'error') setTimeout(() => dismiss(id), 6000)
  }, [dismiss])
  const api = useMemo<ToastApi>(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push])

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite" aria-relevant="additions">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            <div>
              {t.messages.length > 1 ? (
                <><strong>Revisa los datos</strong><ul>{t.messages.map((m) => <li key={m}>{m}</li>)}</ul></>
              ) : (
                t.messages[0]
              )}
            </div>
            <button type="button" aria-label="Cerrar aviso" onClick={() => dismiss(t.id)}><X size={16} aria-hidden="true" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
