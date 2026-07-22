import { createContext } from 'react';

/**
 * @typedef {'success' | 'warning' | 'error' | 'info'} ToastType
 */

/**
 * @typedef {{
 *   message: string;
 *   duration?: number;
 *   type?: ToastType;
 * }} ToastOptions
 */

/**
 * @type {{
 *   showToast: (options: ToastOptions) => void;
 * }}
 */
const defaultToastContextValue = {
  showToast: () => {},
};

export const ToastContext = createContext(defaultToastContextValue);
