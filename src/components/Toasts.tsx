import { ui, useUI } from '../state/ui';
import { Icon } from './Icon';

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button
          type="button"
          key={toast.id}
          className={`toast toast--${toast.tone}`}
          onClick={() => ui.dismiss(toast.id)}
        >
          {toast.tone === 'achievement' ? (
            <>
              <span className="toast__seal kanji">{toast.kanji}</span>
              <span className="toast__text">
                <span className="toast__eyebrow">Achievement unlocked</span>
                <span className="toast__title">{toast.title}</span>
                <span className="toast__message">{toast.message}</span>
              </span>
            </>
          ) : (
            <>
              <Icon
                name={toast.tone === 'error' ? 'info' : toast.tone === 'success' ? 'check' : 'sparkles'}
                size={18}
              />
              <span className="toast__message">{toast.message}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
