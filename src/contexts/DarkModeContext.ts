import { createContext, useContext } from 'react';

export interface DarkModeContextValue {
  isDarkMode: boolean;
  toggle: () => void;
}

export const DarkModeContext = createContext<DarkModeContextValue | undefined>(undefined);

export function useDarkMode() {
  const context = useContext(DarkModeContext);

  if (!context) {
    throw new Error('useDarkMode는 <DarkModeProvider> 안에서 사용해야 합니다.');
  }

  return context;
}
