import { createContext, useContext, useCallback, useRef } from "react";
import Toast from "../components/ui/Toast.jsx";

const ToastContext = createContext({ showToast: () => {} });

export function ToastProvider({ children }) {
    const toastRef = useRef(null);

    const showToast = useCallback((options) => {
        toastRef.current?.showToast(options);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast ref={toastRef} />
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);