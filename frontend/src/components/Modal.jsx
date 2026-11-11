import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Dimmed, focus-holding dialog. Esc or a click on the scrim closes it.
export function Modal({ title, onClose, children, size = 'sm', labelledBy }) {
  const ref = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    // Focus the main action if there is one, otherwise the first control.
    const el = ref.current;
    (el?.querySelector('.modal__actions .btn:last-child') || el?.querySelector('button, input, [tabindex]'))?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy || 'modal-title'}>
        <header className="modal__head">
          <h2 id={labelledBy || 'modal-title'}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, danger = true, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="modal__body">{body}</p>
      <footer className="modal__actions">
        <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button
          className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
          onClick={() => { onConfirm(); onCancel(); }}
        >
          {confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}
