import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import FormInput from '../ui/FormInput';
import useForm from '../../hooks/useForm';
import { useNotifications } from '../../contexts/NotificationContext';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import AuthCard, { authSubmitClasses } from './AuthCard';
import { useRef, useState } from 'react';

interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>;

export default function SignupForm() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const validateSignup = (form: SignupFormValues): SignupFormErrors => {
    const errors: SignupFormErrors = {};

    if (!form.email) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!form.password) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (form.password.length < 6) {
      errors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    }

    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    return errors;
  };

  const { form, errors, handleChange, handleSubmit } = useForm<SignupFormValues>(
    { email: '', password: '', confirmPassword: '' },
    validateSignup
  );

  const isDirty = form.email !== '' && form.password !== '' && form.confirmPassword !== '';

  const handleLogin = async (
    formData: SignupFormValues,
  ): Promise<void> => {
    const id = Date.now();
    const notification = { id, message: '회원가입 성공!' };

    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await signup(formData.email, formData.password);

      showToast({ message: notification.message });
      addNotification(notification);

      navigate('/');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';

      console.error(message);
      showToast({
        message: `에러 발생: ${message}`,
        type: 'error',
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="회원가입" description="좋아하는 음악을 저장하고, 게시판에서 이야기를 나눠요.">
      <form
        noValidate
        onSubmit={handleSubmit(handleLogin)}
        className="flex flex-col gap-4.5"
      >
        <FormInput
          label="이메일"
          type="email"
          id="email"
          icon={<Mail />}
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
          error={errors.email}
        />
        <FormInput
          label="비밀번호"
          type="password"
          id="password"
          icon={<Lock />}
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          placeholder="비밀번호를 입력하세요."
          hint="6자 이상 입력해 주세요."
          required
          error={errors.password}
        />
        <FormInput
          label="비밀번호 확인"
          type="password"
          id="confirmPassword"
          icon={<ShieldCheck />}
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="비밀번호를 다시 입력하세요."
          required
          error={errors.confirmPassword}
        />
        <button
          type="submit"
          className={authSubmitClasses}
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting ? '가입 중...' : '회원가입'}
        </button>
      </form>
      <p className="text-center text-sm text-textSub">
        이미 계정이 있으신가요?{' '}
        <Link
          to="/login"
          className="inline-flex items-center min-h-11 font-bold text-primary hover:underline focus-visible:underline"
        >
          여기에서 로그인하세요
        </Link>
      </p>
    </AuthCard>
  );
}
