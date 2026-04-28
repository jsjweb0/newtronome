import {Link} from "react-router-dom";

export function BaseButton({
                               children,
                               to,
                               type = "button",
                               as = "button", // 'button' 또는 'link'
                               onClick,
                               variant = "primary", // 'primary' | 'ghost' | 'cancel'
                               className = "",
                               disabled = false,
                               ...reset
                           }) {
    const baseStyle =
        "group shrink-0 px-4 py-3 inline-flex items-center justify-center gap-x-2 font-medium border rounded-lg shadow-2xs align-middle text-xs md:text-base transition-all focus:z-10 focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none";

    const variantStyle = {
        primary:
            "border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700",
        outline:
            "border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600 focus:border-blue-600 focus:text-blue-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-blue-500 dark:hover:border-blue-600 dark:focus:text-blue-500 dark:focus:border-blue-600 ",
        ghost:
            "border-transparent text-gray-800 hover:bg-gray-100 focus:bg-gray-100 dark:text-white dark:hover:bg-white/10 dark:focus:bg-white/10 ",
        cancel:
            "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 hover:bg-gray-50 focus:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:text-neutral-100 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 ",
        link:
            "border-transparent text-blue-600 hover:text-blue-800 focus:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400 ",
    };

    const btnClasses = `${baseStyle} ${variantStyle[variant] || ""} ${className}`;

    if (as === "link") {
        return (
            <Link to={to} className={btnClasses}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} className={btnClasses} onClick={onClick} disabled={disabled} {...reset}>
            {children}
        </button>
    );
}
