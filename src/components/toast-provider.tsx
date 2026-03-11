'use client';

import { createContext, useCallback, useContext, useState, useRef, type ReactNode } from 'react';
import { Toast, type ToastVariant as BdsToastVariant } from '@bds/components/ui/Toast/Toast';
type ToastVariant = 'neutral' | 'success' | 'error';

interface ToastItem {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (title: ReactNode, description?: ReactNode) => void;
  toastSuccess: (title: ReactNode, description?: ReactNode) => void;
  toastError: (title: ReactNode, description?: ReactNode) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

const containerStyles: React.CSSProperties = {
  position: 'fixed',
  bottom: 32,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--gap-sm)',
  pointerEvents: 'none',
};

const toastWrapperStyles: React.CSSProperties = {
  pointerEvents: 'auto',
  animation: 'toast-slide-up 0.25s ease-out',
};

/** Map provider variants to BDS Toast variants */
const bdsVariantMap: Record<ToastVariant, BdsToastVariant> = {
  neutral: 'default',
  success: 'success',
  error: 'error',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((title: ReactNode, description: ReactNode | undefined, variant: ToastVariant) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, title, description, variant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const toast = useCallback((title: ReactNode, description?: ReactNode) => {
    addToast(title, description, 'neutral');
  }, [addToast]);

  const toastSuccess = useCallback((title: ReactNode, description?: ReactNode) => {
    addToast(title, description, 'success');
  }, [addToast]);

  const toastError = useCallback((title: ReactNode, description?: ReactNode) => {
    addToast(title, description, 'error');
  }, [addToast]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toastSuccess, toastError }}>
      {children}
      {toasts.length > 0 && (
        <div style={containerStyles}>
          {toasts.map((t) => (
            <div key={t.id} style={toastWrapperStyles}>
              <Toast
                title={t.title}
                description={t.description}
                variant={bdsVariantMap[t.variant]}
                onDismiss={() => dismiss(t.id)}
              />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
