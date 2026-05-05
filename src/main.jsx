import React from 'react'
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from "react-router-dom";
import App from './App.jsx'
import {ToastProvider} from "./contexts/ToastContext.jsx";
import {AuthProvider} from "./contexts/AuthContext.jsx";
import {AudioPlayerProvider} from "./contexts/AudioPlayerContext.jsx";
import {DarkModeProvider} from "./contexts/DarkModeContext.jsx";
import {NotificationProvider} from "./contexts/NotificationContext.jsx";

const routerBasename = import.meta.env.BASE_URL === '/'
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <DarkModeProvider>
            <BrowserRouter basename={routerBasename}>
                <NotificationProvider>
                    <ToastProvider>
                        <AudioPlayerProvider>
                            <AuthProvider>
                                <App/>
                            </AuthProvider>
                        </AudioPlayerProvider>
                    </ToastProvider>
                </NotificationProvider>
            </BrowserRouter>
        </DarkModeProvider>
    </React.StrictMode>,
)
