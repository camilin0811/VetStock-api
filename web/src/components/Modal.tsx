import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props { open: boolean; onClose: () => void; title: string; children: ReactNode }

/** Dialogo nativo: trampa de foco, Esc y backdrop gratis. */
export function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      {open && (
        <div className="modal-inner">
          <div className="modal-head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="btn icon" aria-label="Cerrar" onClick={onClose}><X size={18} aria-hidden="true" /></button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
