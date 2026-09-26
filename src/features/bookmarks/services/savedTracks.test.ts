import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToSavedTrack } from './savedTracks';

const firestore = vi.hoisted(() => ({
  doc: vi.fn(),
  onSnapshot: vi.fn<(
    ref: unknown,
    onSuccess: (snapshot: { exists: () => boolean }) => void,
    onError: (error: Error) => void
  ) => () => void>(),
}));

vi.mock('../../../firebase', () => ({ db: 'test-db' }));
vi.mock('firebase/firestore', () => ({
  ...firestore,
  collection: vi.fn(), deleteDoc: vi.fn(), orderBy: vi.fn(), query: vi.fn(),
  serverTimestamp: vi.fn(), setDoc: vi.fn(), Timestamp: class {},
}));

beforeEach(() => vi.resetAllMocks());

describe('subscribeToSavedTrack', () => {
  it.each([true, false])('forwards document existence (%s) and returns the unsubscribe function', (exists) => {
    const reference = { path: 'users/user-1/savedTracks/123' };
    const unsubscribe = vi.fn();
    firestore.doc.mockReturnValue(reference);
    firestore.onSnapshot.mockReturnValue(unsubscribe);
    const onSuccess = vi.fn();
    const onError = vi.fn();

    expect(subscribeToSavedTrack('user-1', 123, onSuccess, onError)).toBe(unsubscribe);
    expect(firestore.doc).toHaveBeenCalledWith('test-db', 'users', 'user-1', 'savedTracks', '123');
    expect(firestore.onSnapshot.mock.calls[0][0]).toBe(reference);
    firestore.onSnapshot.mock.calls[0][1]({ exists: () => exists });
    expect(onSuccess).toHaveBeenCalledWith(exists);
    expect(onError).not.toHaveBeenCalled();
  });

  it('forwards Firestore errors without reporting the track as unsaved', () => {
    firestore.onSnapshot.mockReturnValue(vi.fn());
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const error = new Error('권한 오류');
    subscribeToSavedTrack('user-1', 123, onSuccess, onError);
    firestore.onSnapshot.mock.calls[0][2](error);
    expect(onError).toHaveBeenCalledWith(error);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
