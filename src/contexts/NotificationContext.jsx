import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext({
    notifications: [],
    addNotification: () => {},
    removeNotification: () => {},
    clearNotifications: () => {},
    toggleRead: () => {},
    markAllRead: () => {},
});

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((notification) => {
        const entry = {
            id: notification.id ?? Date.now(),
            message: notification.message,
            read: false,
            timestamp: notification.timestamp ?? Date.now(),
            link: notification.link,
            type: notification.type,
        };
        setNotifications(prev => [entry, ...prev]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const toggleRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: !n.read } : n)
        );
    }, []);

    const markRead = useCallback((id) => {
        setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            )
        );
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            removeNotification,
            clearNotifications,
            toggleRead,
            markRead,
            markAllRead,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => useContext(NotificationContext);
