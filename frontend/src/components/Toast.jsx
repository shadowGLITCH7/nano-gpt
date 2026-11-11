import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, CircleAlert } from 'lucide-react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const show = useCallback((text, kind = 'ok') => {
    const id = ++nextId.current;
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            {t.kind === 'error' ? <CircleAlert size={16} /> : <Check size={16} />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
