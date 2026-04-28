import { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
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

    const toggle = () => setIsDarkMode(prev => !prev);

    return (
        <DarkModeContext.Provider value={{ isDarkMode, toggle }}>
            {children}
        </DarkModeContext.Provider>
    );
}

export function useDarkMode() {
    return useContext(DarkModeContext);
}
