import {useContext} from "react";
import {DarkModeContext} from "./darkModeContextValue.js";

export function useDarkMode() {
    return useContext(DarkModeContext);
}
