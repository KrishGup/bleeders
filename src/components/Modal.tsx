import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  kanji?: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
  mode?: string;
}

/** How many dialogs are open — the page scroll stays locked until the last one closes. */
let openDialogs = 0;

function lockScroll(): () => void {
  openDialogs += 1;
  document.documentElement.classList.add('has-modal');
  return () => {
    openDialogs = Math.max(0, openDialogs - 1);
    if (openDialogs === 0) document.documentElement.classList.remove('has-modal');
  };
}

/** Native <dialog>: focus trapping, Esc-to-close and top-layer stacking for free. */
export function Modal({ open, onClose, title, kanji, size = 'md', children, footer, mode }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return open ? lockScroll() : undefined;
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      data-mode={mode}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open ? (
        <div className="modal__inner">
          <header className="modal__head">
            {kanji ? <span className="kanji modal__kanji">{kanji}</span> : null}
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            <button type="button" className="icon-btn modal__close" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </header>
          <div className="modal__body">{children}</div>
          {footer ? <footer className="modal__foot">{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm__message">{message}</div>
    </Modal>
  );
}
