import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import clsx from "clsx";

type FormInputProps = ComponentPropsWithRef<"input"> & {
    label?: string;
    error?: string;
    /** 입력칸 왼쪽에 보이는 장식용 아이콘 */
    icon?: ReactNode;
    /** 입력칸 아래 도움말 */
    hint?: string;
    /** 라벨 오른쪽에 붙는 보조 정보 */
    labelAside?: ReactNode;
};

export default function FormInput({
    label,
    id,
    required,
    error,
    icon,
    hint,
    labelAside,
    className = "",
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
}: FormInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = [ariaDescribedBy, hint ? hintId : undefined, error ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
        <div className="flex flex-col gap-2">
            {(label || labelAside) && (
                <div className="flex items-baseline justify-between gap-2">
                    {label && (
                        <label htmlFor={inputId} className="text-sm font-bold text-textBase">
                            {label}
                            {required && <span aria-hidden="true" className="ml-1 text-primary">*</span>}
                        </label>
                    )}
                    {labelAside}
                </div>
            )}
            <div
                className={clsx(
                    "flex items-center gap-2 min-h-13 pr-1.5 rounded-xl border bg-field transition-colors focus-within:border-primary",
                    icon ? "pl-3.5" : "pl-4",
                    error ? "border-danger" : "border-textThr",
                    props.readOnly && "opacity-80"
                )}
            >
                {icon && (
                    <span aria-hidden="true" className="shrink-0 flex text-textSub/70 [&_svg]:size-4.5">
                        {icon}
                    </span>
                )}
                <input
                    {...props}
                    id={inputId}
                    required={required}
                    aria-invalid={error ? true : ariaInvalid}
                    aria-describedby={describedBy}
                    className={clsx(
                        "flex-1 min-w-0 min-h-11 p-0 border-0 bg-transparent text-[15px] text-textBase placeholder:text-textSub/70 focus:ring-0 disabled:opacity-50",
                        className
                    )}
                />
            </div>
            {hint && (
                <p id={hintId} className="text-xs text-textSub">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className="flex items-center gap-1 text-xs text-danger">
                    <CircleAlert className="shrink-0 size-3.5" aria-hidden="true" />
                    {error}
                </p>
            )}
        </div>
    );
}
