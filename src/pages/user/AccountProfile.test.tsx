import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AccountProfile from './AccountProfile';

const mocks = vi.hoisted(() => ({
  db: {},
  auth: { currentUser: { uid: 'user-1', email: 'user@example.com' } },
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  credential: vi.fn(),
  showToast: vi.fn(),
  addNotification: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => mocks.auth,
  updateProfile: mocks.updateProfile,
  updatePassword: mocks.updatePassword,
  reauthenticateWithCredential: mocks.reauthenticateWithCredential,
  EmailAuthProvider: { credential: mocks.credential },
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: () => mocks.db,
  doc: vi.fn(() => ({})),
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', email: 'user@example.com', displayName: '사용자', photoURL: null },
    loading: false,
    logout: vi.fn(),
  }),
}));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: mocks.addNotification }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ nickname: '사용자', photoURL: '' }) });
  mocks.setDoc.mockResolvedValue(undefined);
  mocks.updateProfile.mockResolvedValue(undefined);
  mocks.updatePassword.mockResolvedValue(undefined);
  mocks.reauthenticateWithCredential.mockResolvedValue(undefined);
  mocks.credential.mockReturnValue({ providerId: 'password' });
});
afterEach(cleanup);

describe('프로필 입력 검증과 비밀번호 유지', () => {
  it.each([
    { label: '이름', invalid: ' ', valid: '새이름', error: '닉네임을 입력해주세요.' },
    { label: '사진 URL', invalid: 'invalid-url', valid: 'https://example.com/photo.png', error: '유효한 이미지 URL을 입력해주세요.' },
  ])('$label 검증 실패 시 비밀번호를 유지하고 수정 후 저장할 수 있다', async ({ label, invalid, valid, error }) => {
    render(<MemoryRouter><AccountProfile /></MemoryRouter>);
    const field = await screen.findByLabelText<HTMLInputElement>(label);
    const passwords = [
      screen.getByLabelText<HTMLInputElement>('현재 비밀번호'),
      screen.getByLabelText<HTMLInputElement>('새 비밀번호'),
      screen.getByLabelText<HTMLInputElement>('새 비밀번호 확인'),
    ];
    const values = ['current-password', 'new-password', 'new-password'];
    passwords.forEach((input, index) => fireEvent.change(input, { target: { value: values[index] } }));
    fireEvent.change(field, { target: { value: invalid } });
    const save = screen.getByRole<HTMLButtonElement>('button', { name: '저장하기' });
    fireEvent.click(save);

    expect(screen.getByText(error)).toBeTruthy();
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(passwords.map((input) => input.value)).toEqual(values);
    expect(save.disabled).toBe(false);
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.updateProfile).not.toHaveBeenCalled();
    expect(mocks.reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(mocks.updatePassword).not.toHaveBeenCalled();
    expect(mocks.addNotification).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: valid } });
    fireEvent.click(save);
    await waitFor(() => expect(mocks.updatePassword).toHaveBeenCalledWith(mocks.auth.currentUser, 'new-password'));
    await waitFor(() => expect(passwords.map((input) => input.value)).toEqual(['', '', '']));
    expect(mocks.credential).toHaveBeenCalledWith('user@example.com', 'current-password');
    expect(mocks.setDoc).toHaveBeenCalledOnce();
    expect(mocks.updateProfile).toHaveBeenCalledWith(mocks.auth.currentUser, {
      displayName: label === '이름' ? valid : '사용자',
      photoURL: label === '사진 URL' ? valid : '',
    });
    expect(mocks.addNotification).toHaveBeenCalledWith(expect.objectContaining({
      message: '프로필과 비밀번호가 변경되었습니다.',
    }));
    expect(screen.queryByText(error)).toBeNull();
    expect(save.disabled).toBe(true);
  });
});
