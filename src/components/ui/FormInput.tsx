import { useId, type ComponentPropsWithRef } from "react";
import { CircleAlert } from "lucide-react";
import clsx from "clsx";

type FormInputProps = ComponentPropsWithRef<"input"> & {
    label?: string;
    error?: string;
};

export default function FormInput({
    label,
    id,
    required,
    error,
    className = "",
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
}: FormInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const describedBy = [ariaDescribedBy, error ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
        <div>
            {label && (
                <label htmlFor={inputId} className="block text-sm mb-2">
                    {label}
                    {required && <span className="inline-block text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    {...props}
                    id={inputId}
                    required={required}
                    aria-invalid={error ? true : ariaInvalid}
                    aria-describedby={describedBy}
                    className={clsx(
                        "py-2.5 sm:py-3 px-4 block w-full rounded-lg text-xs md:text-base disabled:opacity-50 disabled:pointer-events-none dark:bg-black border-textThr placeholder-neutral-500 focus:ring-neutral-600",
                        error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200",
                        className
                    )}
                />
                {error && (
                    <div className="flex items-center absolute inset-y-0 inset-e-0 pointer-events-none pe-3">
                        <CircleAlert className="shrink-0 size-4 text-red-500" aria-hidden="true" />
                    </div>
                )}
            </div>
            {error && (
                <p id={errorId} className="text-xs md:text-sm text-red-600 my-2">
                    {error}
                </p>
            )}
        </div>
    );
}
