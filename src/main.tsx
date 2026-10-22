import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './contexts/ToastProvider';
import { AuthProvider } from './contexts/AuthProvider';
import { DarkModeProvider } from './contexts/DarkModeProvider';
import { NotificationProvider } from './contexts/NotificationProvider';

const PRELOAD_RELOAD_KEY = 'newtronome:preload-reloaded';

if (import.meta.env.PROD) {
  window.addEventListener('vite:preloadError', () => {
    try {
      const hasReloaded =
        window.sessionStorage.getItem(PRELOAD_RELOAD_KEY) === 'true';

      if (hasReloaded) {
        return;
      }

      window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, 'true');
    } catch {
      // 반복 방지 기록을 저장할 수 없으면 자동 복구를 생략합니다.
      return;
    }

    window.location.reload();
  });
}

const queryClient = new QueryClient();

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('#root 요소를 찾을 수 없습니다.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <BrowserRouter basename={routerBasename}>
          <NotificationProvider>
            <ToastProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ToastProvider>
          </NotificationProvider>
        </BrowserRouter>
      </DarkModeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
