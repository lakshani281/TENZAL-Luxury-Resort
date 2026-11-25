import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toastOrMessage, type = 'success', subtitle = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast =
      typeof toastOrMessage === 'object' && toastOrMessage !== null
        ? {
            id,
            type: toastOrMessage.type || 'info',
            message: toastOrMessage.message || '',
            subtitle: toastOrMessage.subtitle || '',
            duration: toastOrMessage.duration !== undefined ? toastOrMessage.duration : 4000,
          }
        : {
            id,
            type: type || 'info',
            message: toastOrMessage || '',
            subtitle: subtitle || '',
            duration: 4500,
          };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastApi = {
    show: addToast,
    showToast: addToast,
    addToast,
    success: (message, duration, subtitle = '') =>
      addToast({ type: 'success', message, duration, subtitle }),
    error: (message, duration, subtitle = '') =>
      addToast({ type: 'error', message, duration, subtitle }),
    warning: (message, duration, subtitle = '') =>
      addToast({ type: 'warning', message, duration, subtitle }),
    info: (message, duration, subtitle = '') =>
      addToast({ type: 'info', message, duration, subtitle }),
  };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border text-sm transition-all duration-300 animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : t.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : t.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : 'bg-[#14333b] text-gray-100 border-[#1e444e]'
            }`}
          >
            {t.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            {t.type === 'warning' && (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            {t.type === 'info' && (
              <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white leading-snug">{t.message}</p>
              {t.subtitle && (
                <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{t.subtitle}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/60 hover:text-white shrink-0 p-0.5 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      show: () => {},
      showToast: () => {},
      addToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return context;
}

export default ToastProvider;
