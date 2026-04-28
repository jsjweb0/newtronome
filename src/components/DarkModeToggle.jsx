import {useDarkMode} from "../contexts/DarkModeContext.jsx";
import {SunMedium, Moon} from "lucide-react";
import Tooltip from "./ui/Tooltip.jsx";
import clsx from "clsx";

function DarkModeToggle({
                            tooltipEnabled = true,
                            className = "",
                            showText = false,
                            srTextLight = "Light Mode",
                            srTextDark = "Dark Mode"
}) {
    const {isDarkMode, toggle} = useDarkMode();
    const srText = isDarkMode ? srTextLight : srTextDark;

    const button = (
        <button type="button"
                className={clsx(
                    "flex justify-center items-center rounded-full focus:outline-hidden focus:bg-primary/6 disabled:opacity-50 disabled:pointer-events-none dark:border-none",
                    "dark:text-textBase hover:text-primary hover:bg-primary/6",
                    showText ? "gap-x-2 px-3 py-3" : "size-11",
                    className
                )}
                onClick={toggle}
                aria-label={srText}
        >
            {isDarkMode
                ? <SunMedium className="shrink-0 size-5 lg:size-6"/>
                : <Moon className="shrink-0 size-5 lg:size-6"/>
            }
            {showText && <span>{srText}</span>}
        </button>
    );

    return tooltipEnabled
        ? <Tooltip content={srText} position="right">{button}</Tooltip>
        : button;
}

export default DarkModeToggle;