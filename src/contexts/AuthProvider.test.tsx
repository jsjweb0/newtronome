import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { ToastContext } from './ToastContext';
import { NotificationProvider } from './NotificationProvider';
import { useNotifications } from './NotificationContext';

const authMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  getIdTokenResult: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('../firebase', () => ({ auth: {}, db: {} }));
vi.mock('firebase/auth', () => authMocks);
vi.mock('firebase/firestore', () => firestoreMocks);

type ProfileSnapshot = {
  exists: () => boolean;
  data: () => Record<string, unknown>;
};

type ProfileListener = {
  next: (snapshot: ProfileSnapshot) => void;
  error: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
};

function AuthStatus() {
  const { user, loading } = useAuth();
  const { notifications, addNotification } = useNotifications();
  return <>
    <span>{user?.displayName ?? user?.uid ?? '로그아웃'}</span>
    <output data-testid="auth-state">{JSON.stringify({ user, loading })}</output>
    <button onClick={() => addNotification({ message: '이전 알림' })}>알림 추가</button>
    <output data-testid="notifications">{notifications.length}</output>
  </>;
}

describe('AuthProvider 프로필 구독', () => {
  let notifyAuth: (user: User | null) => void;
  let listeners: ProfileListener[];
  const showToast = vi.fn();

  const authUser = {
    uid: 'user-1', email: 'user@example.com', displayName: null, photoURL: null,
    metadata: { creationTime: '2026-09-27T00:00:00.000Z' },
  } as User;

  function renderAuth() {
    return render(
      <MemoryRouter>
        <NotificationProvider>
          <ToastContext.Provider value={{ showToast }}>
            <AuthProvider><AuthStatus /></AuthProvider>
          </ToastContext.Provider>
        </NotificationProvider>
      </MemoryRouter>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    listeners = [];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    authMocks.onAuthStateChanged.mockImplementation(
      (_auth: unknown, onNext: (user: User | null) => void) => {
        notifyAuth = onNext;
        return vi.fn();
      },
    );
    authMocks.getIdTokenResult.mockResolvedValue({ claims: {} });
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
    firestoreMocks.onSnapshot.mockImplementation(
      (
        _reference: unknown,
        next: ProfileListener['next'],
        error: ProfileListener['error'],
      ) => {
        const unsubscribe = vi.fn();
        listeners.push({ next, error, unsubscribe });
        return unsubscribe;
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('새 닉네임을 반영하고 구독 오류를 토스트로 안내한다', async () => {
    const { unmount } = renderAuth();

    await act(async () => {
      await notifyAuth(authUser);
    });
    await waitFor(() => expect(listeners).toHaveLength(1));

    act(() => listeners[0].next({
      exists: () => true,
      data: () => ({ nickname: '새 닉네임' }),
    }));
    expect(screen.getByText('새 닉네임')).toBeTruthy();

    act(() => listeners[0].error(new Error('permission-denied')));
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '프로필 자동 동기화가 중단됐습니다. 새로고침해주세요.',
        type: 'error',
      }),
    );
    expect(firestoreMocks.onSnapshot).toHaveBeenCalledOnce();

    unmount();
    expect(listeners[0].unsubscribe).toHaveBeenCalledOnce();
  });

  it('프로필 조회가 실패해도 성공한 관리자 claim을 유지한다', async () => {
    firestoreMocks.getDoc.mockRejectedValue(new Error('offline'));
    authMocks.getIdTokenResult.mockResolvedValue({ claims: { admin: true } });
    renderAuth();
    await act(async () => { await notifyAuth(authUser); });
    expect(JSON.parse(screen.getByTestId('auth-state').textContent!)).toMatchObject({
      loading: false, user: { uid: 'user-1', isAdmin: true },
    });
    act(() => listeners[0].next({ exists: () => true, data: () => ({ nickname: '복구' }) }));
    expect(JSON.parse(screen.getByTestId('auth-state').textContent!)).toMatchObject({
      user: { nickname: '복구', isAdmin: true },
    });
  });

  it('claim 조회가 실패해도 성공한 프로필은 반영하고 관리자 권한은 부여하지 않는다', async () => {
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ nickname: '닉네임', photoURL: 'https://example.com/photo.png' }) });
    authMocks.getIdTokenResult.mockRejectedValue(new Error('token unavailable'));
    renderAuth();
    await act(async () => { await notifyAuth(authUser); });
    expect(JSON.parse(screen.getByTestId('auth-state').textContent!)).toMatchObject({
      loading: false, user: { nickname: '닉네임', photoURL: 'https://example.com/photo.png', isAdmin: false },
    });
  });

  it('늦게 끝난 이전 계정 조회가 로그아웃 상태를 덮어쓰지 않는다', async () => {
    let resolveProfile!: (snapshot: ProfileSnapshot) => void;
    firestoreMocks.getDoc.mockReturnValue(new Promise<ProfileSnapshot>((resolve) => { resolveProfile = resolve; }));
    renderAuth();
    act(() => { void notifyAuth(authUser); });
    await act(async () => { await notifyAuth(null); });
    await act(async () => { resolveProfile({ exists: () => true, data: () => ({ nickname: '이전 계정' }) }); });
    expect(JSON.parse(screen.getByTestId('auth-state').textContent!)).toEqual({ user: null, loading: false });
    expect(listeners).toHaveLength(0);
  });

  it('같은 uid에서는 알림을 유지하고 로그아웃 및 계정 변경 시 초기화한다', async () => {
    renderAuth();
    await act(async () => { await notifyAuth(authUser); });
    fireEvent.click(screen.getByRole('button', { name: '알림 추가' }));
    await act(async () => { await notifyAuth(authUser); });
    expect(screen.getByTestId('notifications').textContent).toBe('1');
    await act(async () => { await notifyAuth(null); });
    expect(screen.getByTestId('notifications').textContent).toBe('0');
    await act(async () => { await notifyAuth(authUser); });
    fireEvent.click(screen.getByRole('button', { name: '알림 추가' }));
    await act(async () => { await notifyAuth({ ...authUser, uid: 'user-2' } as User); });
    expect(screen.getByTestId('notifications').textContent).toBe('0');
  });

});
