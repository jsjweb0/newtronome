import { useState, useEffect } from "react";
import type { ReactNode } from 'react';
import type {
    DarkModeContextValue,
} from './DarkModeContext';
import { DarkModeContext } from "./DarkModeContext";

interface DarkModeContextProps {
    children: ReactNode
}

const THEME_STORAGE_KEY = 'theme';

const getInitialDarkMode = () => {
    try {
        return window.localStorage.getItem(THEME_STORAGE_KEY) !== 'light';
    } catch {
        return true;
    }
};

export function DarkModeProvider({
    children
}: DarkModeContextProps) {
    const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

    useEffect(() => {
        const root = document.documentElement;

        root.classList.toggle('dark', isDarkMode);

        try {
            window.localStorage.setItem(
                THEME_STORAGE_KEY,
                isDarkMode ? 'dark' : 'light'
            );
        } catch {
            // 저장할 수 없어도 현재 세션의 테마는 계속 적용한다.
        }
    }, [isDarkMode]);

    const toggle: DarkModeContextValue['toggle'] = () => {
        setIsDarkMode((previousMode) => !previousMode);
    };

    const contextValue: DarkModeContextValue = {
        isDarkMode,
        toggle,
    };

    return (
        <DarkModeContext.Provider value={contextValue}>
            {children}
        </DarkModeContext.Provider>
    );
}
