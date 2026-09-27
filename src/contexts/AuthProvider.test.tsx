import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { ToastContext } from './ToastContext';

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
  const { user } = useAuth();
  return <span>{user?.displayName ?? user?.uid ?? '로그아웃'}</span>;
}

describe('AuthProvider 프로필 구독', () => {
  let notifyAuth: (user: User | null) => void;
  let listeners: ProfileListener[];
  const showToast = vi.fn();

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
    const { unmount } = render(
      <MemoryRouter>
        <ToastContext.Provider value={{ showToast }}>
          <AuthProvider>
            <AuthStatus />
          </AuthProvider>
        </ToastContext.Provider>
      </MemoryRouter>,
    );

    const authUser = {
      uid: 'user-1',
      email: 'user@example.com',
      displayName: null,
      photoURL: null,
      metadata: { creationTime: '2026-09-27T00:00:00.000Z' },
    } as User;

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
});
