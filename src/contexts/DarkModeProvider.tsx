import { useState, useEffect } from "react";
import type { ReactNode } from 'react';
import type {
    DarkModeContextValue,
} from './DarkModeContext';
import { DarkModeContext } from "./DarkModeContext";

interface DarkModeContextProps {
    children: ReactNode
}

export function DarkModeProvider({
    children
}: DarkModeContextProps) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("theme") !== "light";
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("theme", "light");
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
