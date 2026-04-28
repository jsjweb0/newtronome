import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {Info, CircleCheck, CircleX, TriangleAlert, X} from "lucide-react";

const Toast = forwardRef((_, ref) => {
    const [toasts, setToasts] = useState([]);

    useImperativeHandle(ref, () => ({
        showToast: ({message, duration = 3000, type = 'success'}) => {
            const id = Date.now(); // 유니크 ID

            setToasts(prev => [...prev, {id, message, type}]);

            setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== id));
            }, duration);
        }
    }));

    const iconBaseStyles = 'shrink-0 size-6 stroke-white';
    const typeStyles = {
        success: 'fill-teal-500 dark:fill-none dark:stroke-teal-500',
        warning: 'fill-yellow-500 dark:fill-none dark:stroke-yellow-500',
        error: 'fill-red-500 dark:fill-none dark:stroke-red-500',
        info: 'fill-blue-600 dark:fill-none dark:stroke-blue-600',
    };
    const getIcon = (type) => {
        const iconColor = typeStyles[type] || typeStyles.success;
        const icons = {
            success: <CircleCheck className={`${iconBaseStyles} ${iconColor}`}/>,
            warning: <TriangleAlert className={`${iconBaseStyles} ${iconColor}`}/>,
            error: <CircleX className={`${iconBaseStyles} ${iconColor}`}/>,
            info: <Info className={`${iconBaseStyles} ${iconColor}`}/>,
        };
        return icons[type] || icons.success;
    };

    return (
        <>
            {toasts.length > 0 && (
                <div className="space-y-3 fixed bottom-5 right-5 z-700 w-full max-w-xs group">
                    {toasts.map(toast => (
                        <div key={toast.id}
                             className="bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-neutral-800 dark:border-neutral-700 transition-all duration-500 opacity-100 translate-y-0 [@starting-style]:opacity-0 [@starting-style]:translate-y-5"
                             role="alert"
                             tabIndex={-1}
                             aria-labelledby="toast-title">
                            <button type="button"
                                    className="absolute top-3 end-3 inline-flex shrink-0 justify-center items-center size-5 rounded-lg text-gray-800 opacity-50 hover:opacity-100 focus:outline-hidden focus:opacity-100 dark:text-white"
                                    aria-label="Close"
                                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
                                <span className="sr-only">Close</span>
                                <X className="shrink-0 size-4"/>
                            </button>
                            <div className="flex gap-x-2 p-4">
                                <div className="shrink-0">
                                    {getIcon(toast.type)}
                                </div>
                                <div className="grow me-5">
                                    <p id="toast-title"
                                       className="text-gray-700 text-sm dark:text-white">{toast?.message}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    )
});

export default Toast;