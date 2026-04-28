import {useContext} from "react";
import {NotificationContext} from "./notificationContextValue.js";

export const useNotifications = () => useContext(NotificationContext);
