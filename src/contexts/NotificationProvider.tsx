import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { NotificationContext } from './NotificationContext';
import type {
    Notification,
    NotificationContextValue,
} from './NotificationContext';

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification: NotificationContextValue['addNotification'] = useCallback((notification) => {
        const entry: Notification = {
            id: notification.id ?? notification.notificationId ?? Date.now(),
            message: notification.message,
            read: false,
            timestamp: notification.timestamp ?? Date.now(),
            link: notification.link,
            type: notification.type,
        };
        setNotifications(prev => [entry, ...prev]);
    }, []);

    const removeNotification: NotificationContextValue['removeNotification'] = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearNotifications: NotificationContextValue['clearNotifications'] = useCallback(() => {
        setNotifications([]);
    }, []);

    const toggleRead: NotificationContextValue['toggleRead'] = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: !n.read } : n)
        );
    }, []);

    const markRead: NotificationContextValue['markRead'] = useCallback((id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        )
        );
    }, []);

    const markAllRead: NotificationContextValue['markAllRead'] = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const contextValue: NotificationContextValue = {
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        toggleRead,
        markRead,
        markAllRead,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}
