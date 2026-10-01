import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToSavedTrack, subscribeToSavedTracks } from './savedTracks';

type Snapshot = { exists: () => boolean } | {
  docs: { id: string; data: () => unknown }[];
};

const firestore = vi.hoisted(() => ({
  doc: vi.fn(),
  onSnapshot: vi.fn<(
    ref: unknown,
    onSuccess: (snapshot: Snapshot) => void,
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

describe('subscribeToSavedTracks data validation', () => {
  const validTrack = {
    id: 123, title: 'Track', artist: 'Artist',
    artworkUrl: null, permalinkUrl: null, durationMs: 1000,
    genre: '', tags: [], savedAt: null,
  };

  it.each([0, 1000])('accepts a numeric ID matching the document ID and duration %s', (durationMs) => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const track = { ...validTrack, durationMs };
    subscribeToSavedTracks('user-1', onSuccess, onError);
    firestore.onSnapshot.mock.calls[0][1]({
      docs: [{ id: '123', data: () => track }],
    });

    expect(onSuccess).toHaveBeenCalledExactlyOnceWith([track]);
    expect(onError).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'mismatched ID', documentId: 'A', track: { ...validTrack, id: 'B' } },
    { label: 'negative duration', documentId: '123', track: { ...validTrack, durationMs: -1 } },
  ])('rejects $label without publishing a partial list', ({ documentId, track }) => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    subscribeToSavedTracks('user-1', onSuccess, onError);
    firestore.onSnapshot.mock.calls[0][1]({
      docs: [
        { id: '123', data: () => validTrack },
        { id: documentId, data: () => track },
      ],
    });

    expect(onError).toHaveBeenCalledExactlyOnceWith(
      new Error('저장된 트랙 데이터 형식이 올바르지 않습니다.')
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(track.id).toBe(documentId === 'A' ? 'B' : 123);
  });
});
