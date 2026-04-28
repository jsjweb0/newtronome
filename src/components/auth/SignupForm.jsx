import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {useToast} from "../../contexts/ToastContext.jsx"
import FormInput from "../ui/FormInput.jsx";
import useForm from "../../hooks/useForm.js";
import {useNotifications} from "../../contexts/NotificationContext.jsx";
import clsx from "clsx";

export default function SignupForm() {
    const { showToast } = useToast();
    const {addNotification} = useNotifications();
    const navigate = useNavigate();
    const { signup } = useAuth();

    const validateSignup = (form) => {
        const errors = {};
        if (!form.email) {
            errors.email = "이메일을 입력해주세요.";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            errors.email = "올바른 이메일 형식이 아닙니다.";
        }

        if (!form.password) {
            errors.password = "비밀번호를 입력해주세요.";
        } else if (form.password.length < 6) {
            errors.password = "비밀번호는 최소 6자 이상이어야 합니다.";
        }

        if (form.confirmPassword !== form.password) {
            errors.confirmPassword = "비밀번호가 일치하지 않습니다.";
        }

        return errors;
    }

    const {
        form,
        errors,
        handleChange,
        handleSubmit,
    } = useForm({ email: '', password: '', confirmPassword: '' }, validateSignup);

    const isDirty =
        form.email !== "" ||
        form.password !== "" ||
        form.confirmPassword !== "";

    return (
        <div
            className="mt-7 px-4">
            <div
                className="w-full max-w-md mx-auto p-4 sm:p-7 border border-textThr rounded-xl shadow-2xs">
                <div className="text-center">
                    <h1 className="block text-xl md:text-2xl font-bold">회원가입</h1>
                    <p className="mt-4 text-sm">
                        이미 계정이 있으신가요?
                        <Link to="/login"
                              className="inline-block ml-1 text-primary decoration-2 hover:underline focus:outline-hidden focus:underline font-medium">
                            여기에서 로그인하세요
                        </Link>
                    </p>
                </div>

                <div className="mt-10">
                    <form noValidate onSubmit={handleSubmit(async (formData) => {
                        const id = Date.now();
                        const notification = { id, message: '회원가입 성공!' };

                        try {
                            await signup(formData.email, formData.password, formData.nickname, formData.photoURL);

                            showToast({ message: notification.message });
                            addNotification(notification);

                            navigate('/');
                        } catch (err) {
                            console.error(err.message);
                            showToast({ message: "에러 발생: " + err.message, type: "error" });
                        }
                    })}>
                        <div className="grid gap-y-4">
                            <FormInput label="이메일"
                                       type="email"
                                       id="email"
                                       value={form.email}
                                       onChange={handleChange}
                                       placeholder="you@example.com"
                                       required
                                       error={errors.email}
                            />
                            <FormInput label="비밀번호"
                                       type="password"
                                       id="password"
                                       value={form.password}
                                       onChange={handleChange}
                                       placeholder="비밀번호를 입력하세요."
                                       required
                                       error={errors.password} />
                            <FormInput label="비밀번호 확인"
                                       type="password"
                                       id="confirmPassword"
                                       value={form.confirmPassword}
                                       onChange={handleChange}
                                       placeholder="비밀번호를 다시 입력하세요."
                                       required
                                       error={errors.confirmPassword}
                            />
                            <button type="submit"
                                    className={clsx(
                                        "w-full mt-4 py-3 px-4 inline-flex justify-center items-center gap-x-2",
                                        "text-sm font-medium rounded-lg border border-transparent bg-primary text-white",
                                        "disabled:bg-textThr disabled:pointer-events-none"
                                    )}
                                    disabled={!isDirty}
                            >
                                가입하기
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}