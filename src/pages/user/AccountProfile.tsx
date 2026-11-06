import { useState, useEffect, useRef } from 'react';
import {
  getAuth,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import {
  validateProfile,
  type ProfileValidationErrors,
} from '../../utils/profile';
import FormInput from '../../components/ui/FormInput';
import { formatDate } from '../../utils/format';
import {
  Calendar,
  Image as ImageIcon,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { useNotifications } from '../../contexts/NotificationContext';
import RetryErrorState from '../../components/ui/RetryErrorState';

export default function AccountProfile() {
  const { user, logout, loading } = useAuth();
  const db = getFirestore();
  const auth = getAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const userUid = user?.uid;
  const initialProfileRef = useRef({ nickname: '', photoURL: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});

  useEffect(() => {
    if (loading) return;

    if (!userUid) {
      void navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError('');

      try {
        const snap = await getDoc(doc(db, 'users', userUid));
        if (cancelled) return;

        const data = snap.exists() ? snap.data() : {};
        const nextNickname =
          typeof data.nickname === 'string' ? data.nickname : '';
        const nextPhotoURL =
          typeof data.photoURL === 'string' ? data.photoURL : '';

        setNickname(nextNickname);
        setPhotoURL(nextPhotoURL);
        initialProfileRef.current = {
          nickname: nextNickname,
          photoURL: nextPhotoURL,
        };
      } catch {
        if (!cancelled) {
          setProfileError('프로필을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [loading, userUid, db, navigate, retryCount]);

  // 저장 버튼 활성화 여부
  const profileChanged =
    nickname !== initialProfileRef.current.nickname ||
    photoURL !== initialProfileRef.current.photoURL;
  const wantsPasswordChange = newPassword !== '' || confirmPassword !== '';
  const isDirty = profileChanged || wantsPasswordChange;

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    setErrors({});

    const notificationId = Date.now();
    let profileDocumentSaved = false;
    let profileUpdated = false;
    let passwordChangeStarted = false;

    // 클라이언트 검증
    if (wantsPasswordChange) {
      if (!currentPassword) {
        setErrors({ currentPassword: '현재 비밀번호를 입력하세요.' });
        setSaving(false);
        return showToast({ message: '현재 비밀번호가 필요합니다.', type: 'error' });
      }
      if (newPassword.length < 6) {
        setErrors({ password: '새 비밀번호는 6자 이상입니다.' });
        setSaving(false);
        return showToast({ message: '새 비밀번호는 6자 이상이어야 합니다.', type: 'error' });
      }
      if (newPassword !== confirmPassword) {
        setErrors({ confirmPassword: '비밀번호가 일치하지 않습니다.' });
        setSaving(false);
        return showToast({ message: '비밀번호 확인이 일치하지 않아요.', type: 'error' });
      }
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('인증 사용자 정보를 확인할 수 없습니다.');
      }

      if (profileChanged) {
        const validation = validateProfile({ nickname, photoURL });
        if (!validation.isValid) {
          setErrors(validation.errors);
          showToast({
            message: Object.values(validation.errors)[0],
            type: 'error',
          });
          return;
        }
      }

      // 2) 원본과 비교해 변경사항이 없으면 리턴
      if (profileChanged) {
        const userRef = doc(db, 'users', currentUser.uid);

        await setDoc(
          userRef,
          { nickname, photoURL, updatedAt: serverTimestamp() },
          { merge: true }
        );
        profileDocumentSaved = true;

        await updateProfile(currentUser, {
          displayName: nickname,
          photoURL,
        });
        profileUpdated = true;
        initialProfileRef.current = { nickname, photoURL };
      }

      if (wantsPasswordChange) {
        passwordChangeStarted = true;
        if (!currentUser.email) {
          throw new Error('이메일 계정에서만 비밀번호를 변경할 수 있습니다.');
        }

        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );

        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
      }

      const successMessage = wantsPasswordChange
        ? profileChanged
          ? '프로필과 비밀번호가 변경되었습니다.'
          : '비밀번호가 변경되었습니다.'
        : '프로필이 저장되었습니다!';
      showToast({ message: successMessage });
      addNotification({ notificationId, message: successMessage });
    } catch (error: unknown) {
      const wrongPassword =
        error instanceof FirebaseError &&
        (error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential');

      let failureMessage = '변경사항을 저장하지 못했습니다. 다시 시도해주세요.';
      if (profileUpdated && passwordChangeStarted) {
        failureMessage = wrongPassword
          ? '프로필은 저장됐지만 현재 비밀번호가 올바르지 않습니다. 비밀번호만 다시 시도해주세요.'
          : '프로필은 저장됐지만 비밀번호 변경에 실패했습니다. 비밀번호만 다시 시도해주세요.';
      } else if (profileDocumentSaved) {
        failureMessage = '프로필 문서는 저장됐지만 계정 프로필 업데이트에 실패했습니다. 다시 저장해주세요.';
      } else if (passwordChangeStarted) {
        failureMessage = wrongPassword
          ? '현재 비밀번호가 올바르지 않습니다.'
          : '비밀번호를 변경하지 못했습니다. 다시 시도해주세요.';
      }

      addNotification({ notificationId, message: failureMessage });

      if (wrongPassword) {
        setErrors({
          currentPassword: '현재 비밀번호가 올바르지 않습니다.',
        });
      }
      showToast({ message: failureMessage, type: 'error' });
    } finally {
      setSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading || !user) return null;

  const displayName = nickname.trim() || user.displayName?.trim() || user.email || '사용자';
  const fieldsetClasses =
    'min-w-0 m-0 flex flex-col gap-4.5 px-4 py-4.5 md:p-6 rounded-2xl border border-line bg-surface';
  const legendClasses = 'float-left w-full mb-0.5 p-0 text-base font-extrabold text-textBase';

  return (
    <section aria-labelledby="account-title" className="w-full max-w-190 mx-auto flex flex-col gap-4 md:gap-5 px-1 md:px-7 pb-6">
      <div>
        <p className="font-inter text-xs font-extrabold tracking-[0.14em] text-primary">PROFILE</p>
        <h1 id="account-title" className="mt-1 text-[28px] leading-tight font-extrabold tracking-tight text-textBase">
          My Account
        </h1>
      </div>

      <div className="flex items-center gap-4.5 px-4 py-4.5 md:px-6 md:py-5.5 rounded-2xl border border-line bg-linear-135 from-primary/10 to-surface to-70%">
        <Avatar
          name={displayName}
          photoURL={photoURL || user.photoURL}
          className="size-18 text-[28px] ring-2 ring-primary ring-offset-3 ring-offset-surface"
        />
        <div className="min-w-0 flex flex-col gap-1">
          <strong className="truncate text-xl text-textBase">{displayName}</strong>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-0.5 text-[13px]">
            <dt className="flex items-center gap-1 text-textSub/80">
              <Mail aria-hidden="true" className="size-3.5" />
              이메일
            </dt>
            <dd className="truncate text-textSub">{user.email}</dd>
            <dt className="flex items-center gap-1 text-textSub/80">
              <Calendar aria-hidden="true" className="size-3.5" />
              가입일
            </dt>
            <dd className="text-textSub">{formatDate(user.createdAt, true)}</dd>
          </dl>
        </div>
      </div>

      {profileLoading ? (
        <p role="status" className="py-8 text-center text-sm text-textSub">프로필을 불러오는 중입니다.</p>
      ) : profileError ? (
        <RetryErrorState
          message={profileError}
          onRetry={() => {
            setProfileLoading(true);
            setRetryCount((count) => count + 1);
          }}
        />
      ) : (
        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          <fieldset className={fieldsetClasses}>
            <legend className={legendClasses}>프로필</legend>
            <FormInput
              label="이름"
              id="nickname"
              name="nickname"
              icon={<UserRound />}
              autoComplete="username"
              placeholder="이름을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              error={errors.nickname}
            />

            <FormInput
              label="사진 URL"
              id="photoURL"
              name="photoURL"
              icon={<ImageIcon />}
              autoComplete="off"
              placeholder="https://example.com/profile.jpg"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              error={errors.photoURL}
            />
          </fieldset>

          <fieldset className={fieldsetClasses}>
            <legend className={legendClasses}>
              비밀번호 변경 <span className="text-xs font-medium text-textSub">· 바꿀 때만 입력하세요</span>
            </legend>
            <FormInput
              label="현재 비밀번호"
              type="password"
              id="currentPassword"
              name="currentPassword"
              icon={<Lock />}
              autoComplete="current-password"
              placeholder="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={errors.currentPassword}
            />

            <FormInput
              label="새 비밀번호"
              type="password"
              id="newPassword"
              name="newPassword"
              icon={<KeyRound />}
              autoComplete="new-password"
              placeholder="6자 이상"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.password}
            />

            <FormInput
              label="새 비밀번호 확인"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              icon={<ShieldCheck />}
              autoComplete="new-password"
              placeholder="새 비밀번호를 다시 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />
          </fieldset>

          <div className="flex max-md:flex-col-reverse md:items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 min-h-12 px-4.5 rounded-full border border-danger/40 text-sm font-bold text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger"
            >
              <LogOut aria-hidden="true" className="size-4" />
              LogOut
            </button>
            <div className="flex max-md:flex-col md:items-center gap-3">
              {isDirty && (
                <span role="status" className="text-xs text-amber-600 dark:text-[#FFB54A] max-md:text-center">
                  저장하지 않은 변경 사항이 있어요
                </span>
              )}
              <button
                type="submit"
                className="min-h-12 px-7 rounded-full bg-primary text-[15px] font-extrabold text-onPrimary hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:bg-textThr disabled:text-textSub"
                disabled={saving || !isDirty}
              >
                저장하기
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
