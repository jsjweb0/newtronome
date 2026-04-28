import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {useEffect, useRef, useState} from "react";
import {useToast} from "../../contexts/ToastContext.jsx"
import FormInput from "../ui/FormInput.jsx";
import useForm from "../../hooks/useForm.js";
import clsx from "clsx";
import {isProfileModified} from "../../utils/profile.js";
import {useNotifications} from "../../contexts/NotificationContext.jsx";

export default function LoginForm() {
    const { showToast } = useToast();
    const {addNotification} = useNotifications();
    const {login} = useAuth();
    const navigate = useNavigate();
    const [rememberMe, setRememberMe] = useState(false);
    const [loginError, setLoginError] = useState('');
    const emailRef = useRef(null);
    const passwordRef = useRef();
    const STORAGE_KEY = "rememberedEmail";

    const validateLogin = (form) => {
        const errors = {};
        if (!form.email) {
            errors.email = "이메일을 입력해주세요.";
            emailRef.current.focus();
        }
        if (!form.password) {
            errors.password = "비밀번호를 입력해주세요.";
            passwordRef.current.focus();
        }
        return errors;
    };

    const {
        form,
        errors,
        handleChange,
        handleSubmit,
        setForm,
    } = useForm({email: '', password: ''}, validateLogin);

    const isDirty =
        form.email !== "" ||
        form.password !== ""  ;

    const handleLogin = async (formData) => {
        const id = Date.now();
        const notification = { id, message: '로그인 성공!' };

        try {
            await login(formData.email, formData.password);
            if (rememberMe) {
                localStorage.setItem("rememberedEmail", form.email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }
            navigate("/");

            showToast({ message: notification.message });
            addNotification(notification);

        } catch (err) {
            setLoginError("이메일 또는 비밀번호가 틀렸습니다.");
        }
    };

    useEffect(() => {
        const savedEmail = localStorage.getItem(STORAGE_KEY);
        if (savedEmail) {
            setForm((prev) => ({...prev, email: savedEmail}));
            setRememberMe(true);
        }
    }, []);

    return (
        <div
            className="mt-7 px-4">
            <div
                className="w-full max-w-md mx-auto p-4 sm:p-7 border border-textThr rounded-xl shadow-2xs">
                <div className="text-center">
                    <h1 className="block text-xl md:text-2xl font-bold">로그인</h1>
                </div>

                <div className="mt-10">
                    {/* Form */}
                    <form noValidate onSubmit={handleSubmit(handleLogin)}>
                        <div className="grid gap-y-4">
                            <FormInput label="이메일"
                                       type="email"
                                       id="email"
                                       value={form.email}
                                       onChange={handleChange}
                                       placeholder="test@email.com"
                                       required
                                       error={errors.email}
                                       ref={emailRef}
                                       autoComplete="username"
                            />
                            <FormInput label="비밀번호"
                                       type="password"
                                       id="password"
                                       autoComplete="current-password"
                                       value={form.password}
                                       onChange={handleChange}
                                       placeholder="비밀번호를 입력하세요."
                                       required
                                       error={errors.password}
                                       ref={passwordRef}
                            />

                            {/* Checkbox */}
                            <div className="flex items-center">
                                <div className="flex">
                                    <input id="rememberMe" name="rememberMe" type="checkbox"
                                           checked={rememberMe}
                                           onChange={(e) => setRememberMe(prev => !prev)}
                                           className="shrink-0 mt-0.5 size-5 border border-textThr rounded-sm focus:ring-primary dark:bg-black checked:bg-primary"/>
                                </div>
                                <div className="ms-3">
                                    <label htmlFor="rememberMe" className="text-sm">아이디 저장</label>
                                </div>
                            </div>
                            {/* End Checkbox */}

                            <button type="submit"
                                    className={clsx(
                                        "w-full py-3 px-4 inline-flex justify-center items-center gap-x-2  rounded-lg border border-transparent",
                                        "text-sm font-medium text-white bg-primary",
                                        "disabled:pointer-events-none disabled:bg-textThr disabled:text-neutral-500"
                                    )}
                                    disabled={!isDirty}
                            >
                                로그인
                            </button>
                        </div>
                    </form>
                    {/* End Form */}
                    {loginError && <div className="text-red-500 text-sm mt-2">{loginError}</div>}
                </div>

                <div className="my-8 py-3 flex items-center text-xs text-gray-400 uppercase before:flex-1 before:border-t before:border-gray-200 before:me-6 after:flex-1 after:border-t after:border-gray-200 after:ms-6 dark:text-neutral-500 dark:before:border-neutral-600 dark:after:border-neutral-600">또는</div>

                <div>
                    <Link to="/signup" className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800">
                        이메일로 회원가입
                    </Link>
                </div>
            </div>
        </div>
    )
}