import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostsProvider } from './PostsProvider';
import { usePosts, type CreatePostInput, type PostsContextValue } from './PostsContext';

type Snapshot = {
  docs: { id: string; data: () => Record<string, unknown> }[];
};

const firestore = vi.hoisted(() => ({
  getDocs: vi.fn<() => Promise<Snapshot>>(),
  setDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: 'test-db', auth: { currentUser: { uid: 'user-1' } },
}));
vi.mock('firebase/firestore', () => ({
  ...firestore,
  collection: vi.fn((_db, boardType) => boardType),
  doc: vi.fn(() => ({ id: 'new-post' })),
  getDoc: vi.fn(), increment: vi.fn(), orderBy: vi.fn(),
  query: vi.fn(), where: vi.fn(), Timestamp: class {},
}));

const input: CreatePostInput = {
  title: 'New post', content: 'Content', postNo: 2,
  date: new Date('2026-01-01'), category: null, isNotice: false,
  authorUid: 'user-1', email: null, displayName: null, photoURL: null,
};

function snapshot(...posts: { id: string; title: string }[]): Snapshot {
  return {
    docs: posts.map(({ id, title }) => ({
      id, data: () => ({ title, content: 'Content', authorUid: 'user-1' }),
    })),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

const oldPost = { id: 'old-post', title: 'Old post' };
const otherPost = { id: 'other-post', title: 'Other post' };
const cases = [
  {
    action: 'create',
    write: (api: PostsContextValue) => api.createPost('free', input),
    latest: [oldPost, otherPost, { id: 'new-post', title: 'New post' }],
  },
  {
    action: 'update',
    write: (api: PostsContextValue) => api.updatePost('free', 'old-post', { title: 'Updated post' }),
    latest: [{ ...oldPost, title: 'Updated post' }, otherPost],
  },
  {
    action: 'delete',
    write: (api: PostsContextValue) => api.deletePost('free', 'old-post'),
    latest: [otherPost],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  firestore.getDocs.mockReset();
  firestore.setDoc.mockResolvedValue(undefined);
  firestore.updateDoc.mockResolvedValue(undefined);
  firestore.deleteDoc.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('PostsProvider list cache', () => {
  it.each(cases)('fetches the full list after $action before the first read', async ({ write, latest }) => {
    const { result } = renderHook(usePosts, { wrapper: PostsProvider });
    firestore.getDocs.mockResolvedValue(snapshot(...latest));

    await write(result.current);
    const posts = await result.current.getPosts('free');

    expect(posts.map(({ id, title }) => ({ id, title }))).toEqual(latest);
    expect(firestore.getDocs).toHaveBeenCalledTimes(1);
    expect(await result.current.getPosts('free')).toEqual(posts);
    expect(firestore.getDocs).toHaveBeenCalledTimes(1);
  });

  it.each(cases)('discards an earlier response after $action and caches the fresh list', async ({ write, latest }) => {
    const pending = deferred<Snapshot>();
    firestore.getDocs.mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(snapshot(...latest));
    const { result } = renderHook(usePosts, { wrapper: PostsProvider });

    const reading = result.current.getPosts('free');
    await write(result.current);
    pending.resolve(snapshot(oldPost, otherPost));
    const posts = await reading;

    expect(posts.map(({ id, title }) => ({ id, title }))).toEqual(latest);
    expect(firestore.getDocs).toHaveBeenCalledTimes(2);
    expect(await result.current.getPosts('free')).toEqual(posts);
    expect(firestore.getDocs).toHaveBeenCalledTimes(2);
  });

  it('reuses a successfully fetched empty list', async () => {
    firestore.getDocs.mockResolvedValue(snapshot());
    const { result } = renderHook(usePosts, { wrapper: PostsProvider });

    expect(await result.current.getPosts('free')).toEqual([]);
    expect(await result.current.getPosts('free')).toEqual([]);
    expect(firestore.getDocs).toHaveBeenCalledTimes(1);
  });
});
