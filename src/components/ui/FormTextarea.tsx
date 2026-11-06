import { useId, type ComponentPropsWithRef } from "react";
import { CircleAlert } from "lucide-react";
import clsx from "clsx";

type FormTextareaProps = Omit<ComponentPropsWithRef<"textarea">, "name"> & {
    label?: string;
    name: string;
    error?: string;
};

export default function FormTextarea({
    label,
    name,
    id,
    required,
    error,
    className = '',
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
}: FormTextareaProps) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const describedBy = [ariaDescribedBy, error ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label htmlFor={textareaId} className="text-sm font-bold text-textBase">
                    {label}
                    {required && <span aria-hidden="true" className="ml-1 text-primary">*</span>}
                </label>
            )}
            <textarea
                {...props}
                id={textareaId}
                name={name}
                required={required}
                aria-invalid={error ? true : ariaInvalid}
                aria-describedby={describedBy}
                className={clsx(
                    "block w-full min-h-75 px-4 py-3.5 rounded-xl border bg-field text-[15px] leading-[1.75] text-textBase placeholder:text-textSub/70 resize-y focus:border-primary focus:ring-0 disabled:opacity-50",
                    error ? "border-danger" : "border-textThr",
                    className
                )}
            />
            {error && (
                <p id={errorId} className="flex items-center gap-1 text-xs text-danger">
                    <CircleAlert className="shrink-0 size-3.5" aria-hidden="true" />
                    {error}
                </p>
            )}
        </div>
    );
}
