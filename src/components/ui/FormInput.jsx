import {CircleAlert} from "lucide-react";
import PropTypes from 'prop-types';
import clsx from "clsx";

export default function FormInput({
                                      label,
                                      id,
                                      required,
                                      error,
                                      className = '',
                                      ...props
                                  }) {
    return (
        <div>
            {label && (
                <label htmlFor={id} className="block text-sm mb-2">
                    {label}
                    {required && <span className="inline-block text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input {...props}
                       id={id}
                       required={required}
                       className={clsx(
                           "py-2.5 sm:py-3 px-4 block w-full rounded-lg text-xs md:text-base disabled:opacity-50 disabled:pointer-events-none dark:bg-black border-textThr placeholder-neutral-500 focus:ring-neutral-600",
                           error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200',
                           className
                       )}
                />
                {error && (
                    <div className="flex items-center absolute inset-y-0 end-0 pointer-events-none pe-3">
                        <CircleAlert className="shrink-0 size-4 text-red-500"/>
                    </div>
                )}
            </div>
            {error && (
                <p className="text-xs md:text-sm text-red-600 my-2">{error}</p>
            )}
        </div>
    )
}

FormInput.propTypes = {
    label: PropTypes.string,
    id: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    error: PropTypes.string,
    className: PropTypes.string,
    title: PropTypes.string,
};