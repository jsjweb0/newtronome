import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import Toast from '../components/ui/Toast';
import { ToastContext } from './ToastContext';
import type {
    ToastContextValue,
    ToastOptions,
} from './ToastContext';

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({
    children,
}: ToastProviderProps) {
    const toastRef =
        useRef<ToastContextValue | null>(null);

    const showToast: ToastContextValue['showToast'] =
        useCallback((options: ToastOptions) => {
            toastRef.current?.showToast(options);
        }, []);

    const contextValue: ToastContextValue = {
        showToast,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <Toast ref={toastRef} />
        </ToastContext.Provider>
    );
}