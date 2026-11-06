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
        "group shrink-0 min-h-11 px-5 inline-flex items-center justify-center gap-x-2 rounded-full border text-sm font-bold align-middle transition-colors focus:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none";

    const variantStyle: Record<ButtonVariant, string> = {
        primary:
            "border-transparent bg-primary text-onPrimary hover:brightness-105 focus-visible:brightness-105",
        outline:
            "border-textThr text-textBase hover:bg-field focus-visible:bg-field",
        ghost:
            "border-transparent text-textBase hover:bg-field focus-visible:bg-field",
        cancel:
            "border-textThr bg-transparent text-textBase hover:bg-field focus-visible:bg-field",
        link:
            "border-transparent text-primary hover:underline focus-visible:underline",
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
