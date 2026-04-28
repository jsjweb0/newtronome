import {useContext} from "react";
import {ToastContext} from "./toastContextValue.js";

export const useToast = () => useContext(ToastContext);
