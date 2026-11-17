import { Modal } from './Modal'

interface Props { open: boolean; title: string; text: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onClose: () => void }

export function ConfirmModal({ open, title, text, confirmLabel, busy, onConfirm, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p>{text}</p>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn danger" disabled={busy} onClick={onConfirm}>{busy ? 'Un momento...' : confirmLabel}</button>
      </div>
    </Modal>
  )
}
