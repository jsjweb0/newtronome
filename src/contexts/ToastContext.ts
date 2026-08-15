import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  duration?: number;
  type?: ToastType;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast는 <ToastProvider> 안에서 사용해야 합니다.');
  }

  return context;
}
