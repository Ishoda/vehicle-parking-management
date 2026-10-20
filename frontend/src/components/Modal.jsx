import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title,
  children,
  onClose,
  busy = false,
  small = false,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    dialog.showModal()

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  function handleCancel(event) {
    event.preventDefault()
    if (!busy) onClose()
  }

  function handleBackdrop(event) {
    if (event.target === event.currentTarget && !busy) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={`app-modal ${small ? 'app-modal-small' : ''}`}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleBackdrop}
    >
      <div className="modal-surface">
        <header className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close dialog"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="modal-body">{children}</div>
      </div>
    </dialog>
  )
}