import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import FormInput from '../ui/FormInput';
import useForm from '../../hooks/useForm';
import { CircleAlert, Lock, Mail, UserPlus } from 'lucide-react';
import AuthCard, { authSubmitClasses } from './AuthCard';
import { useNotifications } from '../../contexts/NotificationContext';
import { FirebaseError } from 'firebase/app';

interface LoginFormValues {
  email: string;
  password: string;
}

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export default function LoginForm() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const STORAGE_KEY = 'rememberedEmail';

  const validateLogin = (
    form: LoginFormValues,
  ): LoginFormErrors => {
    const errors: LoginFormErrors = {};

    if (!form.email) {
      errors.email = '이메일을 입력해주세요.';
      emailRef.current?.focus();
    }
    if (!form.password) {
      errors.password = '비밀번호를 입력해주세요.';
      passwordRef.current?.focus();
    }
    return errors;
  };

  const { form, errors, handleChange, handleSubmit, setForm } =
    useForm<LoginFormValues>(
      { email: '', password: '' },
      validateLogin
    );

  const isDirty = form.email !== '' && form.password !== '';

  const handleLogin = async (
    formData: LoginFormValues,
  ): Promise<void> => {
    const id = Date.now();
    const notification = { id, message: '로그인 성공!' };

    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setLoginError('');

    try {
      await login(formData.email, formData.password);

      try {
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, formData.email);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        showToast({
          message: '로그인은 완료됐지만 아이디 저장 설정을 반영하지 못했습니다.',
          type: 'error',
        });
      }

      navigate('/');

      showToast({ message: notification.message });
      addNotification(notification);
    } catch (error: unknown) {
      let message = '로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.';

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            message = '이메일 또는 비밀번호를 확인해주세요.';
            break;

          case 'auth/invalid-email':
            message = '올바른 이메일 형식을 입력해주세요.';
            break;

          case 'auth/network-request-failed':
            message = '네트워크 연결을 확인한 후 다시 시도해주세요.';
            break;

          case 'auth/too-many-requests':
            message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
            break;

          default:
            break;
        }
      }

      setLoginError(message);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(STORAGE_KEY);
      if (savedEmail) {
        setForm((prev) => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    } catch {

    }
  }, [setForm]);

  return (
    <AuthCard title="로그인" description="다시 만나서 반가워요. 저장한 음악이 기다리고 있어요.">
      <form noValidate onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-4.5">
        <FormInput
          label="이메일"
          type="email"
          id="email"
          icon={<Mail />}
          value={form.email}
          onChange={handleChange}
          placeholder="test@email.com"
          required
          error={errors.email}
          ref={emailRef}
          autoComplete="username"
        />
        <FormInput
          label="비밀번호"
          type="password"
          id="password"
          icon={<Lock />}
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          placeholder="비밀번호를 입력하세요."
          required
          error={errors.password}
          ref={passwordRef}
        />

        <label htmlFor="rememberMe" className="self-start flex items-center gap-2.5 min-h-11 cursor-pointer">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe((prev) => !prev)}
            className="shrink-0 size-5.5 rounded-md border-[1.5px] border-textSub/60 bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checked:border-primary checked:bg-primary"
          />
          <span className="text-sm text-textSub">아이디 저장</span>
        </label>
        <button
          type="submit"
          className={authSubmitClasses}
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
        {loginError && (
          <p role="alert" className="flex items-center gap-1 text-sm text-danger">
            <CircleAlert aria-hidden="true" className="shrink-0 size-4" />
            {loginError}
          </p>
        )}
      </form>

      <div aria-hidden="true" className="flex items-center gap-3 text-xs text-textSub/80 before:h-px before:flex-1 before:bg-textThr after:h-px after:flex-1 after:bg-textThr">
        또는
      </div>

      <Link
        to="/signup"
        className="w-full min-h-13 inline-flex items-center justify-center gap-2 rounded-xl border border-textThr text-[15px] font-bold text-textBase hover:bg-field focus-visible:outline-2 focus-visible:outline-primary"
      >
        <UserPlus aria-hidden="true" className="size-4.5" />
        이메일로 회원가입
      </Link>
    </AuthCard>
  );
}
