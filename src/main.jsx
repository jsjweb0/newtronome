import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ToastProvider } from './contexts/ToastProvider';
import { AuthProvider } from './contexts/AuthProvider';
import { DarkModeProvider } from './contexts/DarkModeProvider';
import { NotificationProvider } from './contexts/NotificationProvider';

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')).render(
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
