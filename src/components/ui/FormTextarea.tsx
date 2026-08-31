import { useId, type ComponentPropsWithRef } from "react";
import { CircleAlert } from "lucide-react";

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
        <div>
            {label && (
                <label htmlFor={textareaId} className="block text-sm mb-2 dark:text-white">
                    {label}
                    {required && <span className="inline-block text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <textarea
                    {...props}
                    id={textareaId}
                    name={name}
                    required={required}
                    aria-invalid={error ? true : ariaInvalid}
                    aria-describedby={describedBy}
                    className={`resize-none h-80 py-2.5 sm:py-3 px-4 block w-full rounded-lg text-xs md:text-base disabled:opacity-50 disabled:pointer-events-none
            dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'}
            ${className}`}
                />
                {error && (
                    <div className="flex items-center absolute bottom-3 right-3 pointer-events-none pe-3">
                        <CircleAlert className="shrink-0 size-4 text-red-500" aria-hidden="true" />
                    </div>
                )}
            </div>
            {error && (
                <p id={errorId} className="text-xs md:text-sm text-red-600 my-2">{error}</p>
            )}
        </div>
    );
}
