import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastAction {
  label: string;
  /** 버튼을 누르면 이동할 앱 내부 경로 */
  to: string;
}

export interface ToastOptions {
  message: string;
  /** 생략하면 종류별 기본값(성공·안내 3초, 주의 4초, 오류 5초) */
  duration?: number;
  type?: ToastType;
  action?: ToastAction;
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
