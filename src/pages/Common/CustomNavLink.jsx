import { NavLink } from "react-router-dom";

export default function CustomNavLink({ to, children }) {
    const baseClasses = "p-2 flex items-center text-sm text-gray-800 hover:bg-gray-100 rounded-lg focus:outline-hidden focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700";
    const activeClasses = "bg-gray-100 dark:bg-neutral-700 dark:text-neutral-200";
    return (
        <NavLink to={to} className={({ isActive }) =>
            isActive ? `${baseClasses} ${activeClasses}` : baseClasses
        }
                 aria-current={({ isActive }) => isActive ? "page" : undefined}>
            {children}
        </NavLink>
    )
}