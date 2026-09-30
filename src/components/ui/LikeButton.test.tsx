import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onSnapshot } from 'firebase/firestore';
import LikeButton from './LikeButton';

const mocks = vi.hoisted(() => ({
  subscriptions: [] as Array<{
    onSuccess: (snapshot: {
      data: () => Record<string, unknown>;
      metadata?: { hasPendingWrites: boolean };
    }) => void;
    onError: (error: Error) => void;
  }>,
  setDoc: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('../../firebase', () => ({ db: 'test-db' }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'post-ref'),
  onSnapshot: vi.fn((_ref, _options, onSuccess, onError) => {
    mocks.subscriptions.push({ onSuccess, onError });
    return vi.fn();
  }),
  setDoc: mocks.setDoc,
  arrayUnion: vi.fn((uid: string) => ({ add: uid })),
  arrayRemove: vi.fn((uid: string) => ({ remove: uid })),
  increment: vi.fn((amount: number) => ({ amount })),
}));

function renderLikeButton() {
  render(<LikeButton collection="posts" docId="post-1" />);
  return screen.getByRole<HTMLButtonElement>('button', { name: '좋아요' });
}

function publishLikeSnapshot(likedUsers: string[], likeCount: number) {
  act(() => {
    mocks.subscriptions[0].onSuccess({ data: () => ({ likedUsers, likeCount }) });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.subscriptions.length = 0;
  mocks.setDoc.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('LikeButton request state', () => {
  it('does not write before the first subscription response', () => {
    const button = renderLikeButton();

    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });

  it('does not toggle an unknown like state after a subscription failure', () => {
    const button = renderLikeButton();

    act(() => mocks.subscriptions[0].onError(new Error('permission denied')));
    expect(screen.getByRole('button', { name: /다시 시도/ })).toBe(button);
    expect(mocks.setDoc).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.subscriptions).toHaveLength(2);
    expect(button.disabled).toBe(true);
  });

  it('restores the displayed count and like state when saving fails', async () => {
    const button = renderLikeButton();
    publishLikeSnapshot([], 0);
    mocks.setDoc.mockRejectedValueOnce(new Error('write failed'));

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('0')).toBeTruthy();
    expect(button.querySelector('svg')?.classList.contains('fill-red-500!')).toBe(false);
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '좋아요 처리에 실패했습니다.',
      type: 'error',
    });
  });

  it('sends only one write for repeated clicks while a save is pending', () => {
    const button = renderLikeButton();
    publishLikeSnapshot([], 0);
    mocks.setDoc.mockImplementation(() => new Promise<void>(() => undefined));

    fireEvent.click(button);
    fireEvent.click(button);

    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
  });

  it('waits for the server-confirmed snapshot before changing the displayed like', () => {
    const button = renderLikeButton();
    publishLikeSnapshot([], 0);
    expect(onSnapshot).toHaveBeenCalledWith(
      'post-ref',
      { includeMetadataChanges: true },
      expect.any(Function),
      expect.any(Function)
    );

    act(() => mocks.subscriptions[0].onSuccess({
      data: () => ({ likedUsers: ['user-1'], likeCount: 1 }),
      metadata: { hasPendingWrites: true },
    }));
    expect(screen.getByText('0')).toBeTruthy();
    expect(button.querySelector('svg')?.classList.contains('fill-red-500!')).toBe(false);

    act(() => mocks.subscriptions[0].onSuccess({
      data: () => ({ likedUsers: ['user-1'], likeCount: 1 }),
      metadata: { hasPendingWrites: false },
    }));
    expect(screen.getByText('1')).toBeTruthy();
    expect(button.querySelector('svg')?.classList.contains('fill-red-500!')).toBe(true);
  });
});
