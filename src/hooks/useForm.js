import {useState} from "react";

export default function useForm(initialValues, validate) {
    const [form, setForm] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const {id, value} = e.target;
        setForm((prev) => ({...prev, [id]: value}));
        setErrors((prev) => ({...prev, [id]: ''}));
    };

    const handleSubmit = (onSubmit) => (e) => {
        e.preventDefault();
        const newErrors = validate(form);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        onSubmit(form);
    };

    return {
        form,
        errors,
        handleChange,
        handleSubmit,
        setForm,
    };
}
