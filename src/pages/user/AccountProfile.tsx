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
import { LogOut, Mail, Calendar } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

export default function AccountProfile() {
  const { user, logout, loading, avatarUrl, nicknameUrl } = useAuth();
  const db = getFirestore();
  const auth = getAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const initialProfileRef = useRef({ nickname: '', photoURL: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});

  useEffect(() => {
    if (loading) return;

    if (!user) {
      void navigate('/login', { replace: true });
      return;
    }

    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.exists() ? snap.data() : {};

      setNickname(data.nickname || '');
      setPhotoURL(data.photoURL || '');

      initialProfileRef.current = {
        nickname: data.nickname || '',
        photoURL: data.photoURL || '',
      };

    })();
  }, [loading, user, db, navigate, avatarUrl, nicknameUrl]);

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
    const notification = { notificationId, message: '프로필이 저장되었습니다!' };
    const notificationErr = { notificationId, message: '프로필 저장이 실패하였습니다!' };

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

      // 1) 유효성 검사
      const { isValid, errors } = validateProfile({
        nickname,
        photoURL,
        password: newPassword,
        confirmPassword,
        currentPassword,
      });
      if (!isValid) {
        // 에러 상태를 관리하고 있다면 setErrors(errors) 호출
        setErrors(errors);
        setSaving(false);
        showToast({ message: Object.values(errors)[0], type: 'error' });
        return;
      }

      // 2) 원본과 비교해 변경사항이 없으면 리턴
      if (profileChanged) {
        const userRef = doc(db, 'users', currentUser.uid);

        await setDoc(
          userRef,
          { nickname, photoURL, updatedAt: serverTimestamp() },
          { merge: true }
        );

        await updateProfile(currentUser, {
          displayName: nickname,
          photoURL,
        });
      }

      if (wantsPasswordChange) {
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

      showToast({ message: notification.message });
      addNotification(notification);
    } catch (error: unknown) {
      addNotification(notificationErr);

      if (
        error instanceof FirebaseError &&
        error.code === 'auth/wrong-password'
      ) {
        setErrors({
          currentPassword: '현재 비밀번호가 올바르지 않습니다.',
        });
        showToast({
          message: '현재 비밀번호가 틀렸어요.',
          type: 'error',
        });
      } else {
        const message =
          error instanceof Error ? error.message : '오류가 발생했습니다.';

        showToast({ message, type: 'error' });
      }
    } finally {
      setSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading || !user) return null;

  return (
    <div className="text-textSub">
      <div className="lg:w-md p-4 sm:p-7 m-auto lg:border lg:border-textThr rounded-xl">
        <h2 className="block mb-4 text-xl md:text-2xl font-bold text-textBase text-center">
          PROFILE
        </h2>
        <div className="flex justify-center items-center">
          <div className="relative inline-block w-28 h-28">
            <img
              src={photoURL || nicknameUrl || avatarUrl}
              alt={nickname || user?.email || ''}
              className="inline-block rounded-full w-full h-full object-cover object-center"
            />
            {profileChanged && (
              <span className="animate-fade-in absolute top-1 inset-e-2 block size-4 rounded-full bg-red-500 dark:ring-neutral-900"></span>
            )}
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex items-center">
            <p className="shrink-0 basis-20 flex items-center gap-x-1 text-sm">
              <Mail className="shrink-0 size-4" />
              이메일
            </p>
            <div className="text-xs md:text-base">{user.email}</div>
          </div>
          <div className="flex items-center mb-6">
            <p className="shrink-0 basis-20 flex items-center gap-x-1 text-sm">
              <Calendar className="shrink-0 size-4" />
              가입일
            </p>
            <div className="text-xs md:text-base">{formatDate(user.createdAt)}</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave}>
            <div className="grid gap-y-5">
              <FormInput
                label="이름"
                id="nickname"
                name="nickname"
                autoComplete="username"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                error={errors.nickname}
              />

              <FormInput
                label="사진 URL"
                id="photoURL"
                name="photoURL"
                autoComplete="off"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                error={errors.photoURL}
              />

              <FormInput
                label="현재 비밀번호"
                type="password"
                id="currentPassword"
                name="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={errors.currentPassword}
              />

              <FormInput
                label="새 비밀번호"
                type="password"
                id="newPassword"
                name="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.password}
              />

              <FormInput
                label="새 비밀번호 확인"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
              />

              <button
                type="submit"
                className="w-full mt-4 py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-primary text-white disabled:bg-textThr"
                disabled={saving || !isDirty}
              >
                저장하기
              </button>
            </div>
          </form>
          {/* End Form */}
        </div>
      </div>
      <div className="flex items-center justify-center mt-4">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-x-1 text-primary text-sm md:text-base"
        >
          <LogOut className="size-3 md:size-4" /> LogOut
        </button>
      </div>
    </div>
  );
}
