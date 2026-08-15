import { createContext, useContext } from 'react';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  timestamp: number;
  link?: string;
  type?: NotificationType;
}

export interface NotificationInput {
  id?: number;
  notificationId?: number;
  message: string;
  timestamp?: number;
  link?: string;
  type?: NotificationType;
}

export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: NotificationInput) => void;
  removeNotification: (id: number) => void;
  clearNotifications: () => void;
  toggleRead: (id: number) => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications는 <NotificationProvider> 안에서 사용해야 합니다.');
  }

  return context;
}
