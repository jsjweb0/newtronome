import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type ButtonVariant = "primary" | "outline" | "ghost" | "cancel" | "link";

type BaseButtonCommonProps = {
    children?: ReactNode;
    className?: string;
    variant?: ButtonVariant;
};

type ButtonProps = BaseButtonCommonProps &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
        as?: "button";
    };

type LinkButtonProps = BaseButtonCommonProps &
    Omit<LinkProps, "children" | "className"> & {
        as: "link";
    };

type BaseButtonProps = ButtonProps | LinkButtonProps;

export function BaseButton(props: BaseButtonProps) {
    const baseStyle =
        "group shrink-0 px-4 py-3 inline-flex items-center justify-center gap-x-2 font-medium border rounded-lg shadow-2xs align-middle text-xs md:text-base transition-all focus:z-10 focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none";

    const variantStyle: Record<ButtonVariant, string> = {
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

    const variant = props.variant ?? "primary";
    const btnClasses = `${baseStyle} ${variantStyle[variant]} ${props.className ?? ""}`;

    if (props.as === "link") {
        const {
            as: _as,
            children,
            className: _className,
            variant: _variant,
            ...linkProps
        } = props;

        return (
            <Link className={btnClasses} {...linkProps}>
                {children}
            </Link>
        );
    }

    const {
        as: _as,
        children,
        className: _className,
        variant: _variant,
        type = "button",
        ...buttonProps
    } = props;

    return (
        <button type={type} className={btnClasses} {...buttonProps}>
            {children}
        </button>
    );
}
