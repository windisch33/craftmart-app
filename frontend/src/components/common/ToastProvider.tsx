import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

type Toast = {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number; // ms
};

type ToastContextType = {
  showToast: (message: string, options?: { type?: Toast['type']; duration?: number }) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, options?: { type?: Toast['type']; duration?: number }) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = {
      id,
      message,
      type: options?.type || 'info',
      duration: options?.duration ?? 3500,
    };
    setToasts(prev => [...prev, toast]);
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  useEffect(() => {
    // Trim to prevent unbounded growth in unlikely cases
    if (toasts.length > 8) setToasts(prev => prev.slice(-8));
  }, [toasts.length]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container (ARIA live region) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              minWidth: 240,
              maxWidth: 360,
              padding: '10px 12px',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              color: t.type === 'error' ? '#7f1d1d' : t.type === 'success' ? '#065f46' : '#1f2937',
              background: t.type === 'error' ? '#fee2e2' : t.type === 'success' ? '#d1fae5' : '#f3f4f6',
              border: `1px solid ${t.type === 'error' ? '#fecaca' : t.type === 'success' ? '#a7f3d0' : '#e5e7eb'}`,
              cursor: 'pointer',
              fontSize: 14,
            }}
            title="Click to dismiss"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
