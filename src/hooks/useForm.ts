import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type StringFields<T> = {
  [K in keyof T]: string;
};
type FormErrors<T> = Partial<Record<keyof T, string>>;

type ValidateForm<T> = (values: T) => FormErrors<T>;

type SubmitForm<T> = (values: T) => void | Promise<void>;

export default function useForm<T extends StringFields<T>>(
  initialValues: T,
  validate: ValidateForm<T>
) {
  const [form, setForm] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.currentTarget;
    const field = id as keyof T;

    setForm((previousForm) => ({ ...previousForm, [field]: value }));
    setErrors((previousErrors) => ({ ...previousErrors, [field]: '' }));
  };

  const handleSubmit = (onSubmit: SubmitForm<T>) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors = validate(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    void onSubmit(form);
  };

  return {
    form,
    errors,
    handleChange,
    handleSubmit,
    setForm,
  };
}
