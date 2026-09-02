import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './contexts/ToastProvider';
import { AuthProvider } from './contexts/AuthProvider';
import { DarkModeProvider } from './contexts/DarkModeProvider';
import { NotificationProvider } from './contexts/NotificationProvider';

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('#root 요소를 찾을 수 없습니다.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
