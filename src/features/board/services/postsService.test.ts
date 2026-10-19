import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMyPostsFromFirestore } from './postsService';

const firebase = vi.hoisted(() => ({
    auth: {
        currentUser: { uid: 'user-1', email: 'old@example.com' } as {
            uid: string;
            email: string | null;
        } | null,
    },
}));

const firestore = vi.hoisted(() => ({
    collection: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));

vi.mock('../../../firebase', () => ({
    auth: firebase.auth,
    db: 'test-db',
}));

vi.mock('firebase/firestore', () => ({
    ...firestore,
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    increment: vi.fn(),
    setDoc: vi.fn(),
    Timestamp: class {},
    updateDoc: vi.fn(),
}));

beforeEach(() => {
    vi.resetAllMocks();
    firebase.auth.currentUser = {
        uid: 'user-1',
        email: 'old@example.com',
    };
    firestore.collection.mockReturnValue('free-collection');
    firestore.where.mockReturnValue('author-filter');
    firestore.orderBy.mockReturnValue('date-order');
    firestore.query.mockReturnValue('my-posts-query');
    firestore.getDocs.mockResolvedValue({ docs: [] });
});

describe('fetchMyPostsFromFirestore', () => {
    it('이메일이 아닌 로그인 사용자의 UID로 내 게시글을 조회한다', async () => {
        await expect(fetchMyPostsFromFirestore('free')).resolves.toEqual([]);

        expect(firestore.collection).toHaveBeenCalledWith('test-db', 'free');
        expect(firestore.where).toHaveBeenCalledWith(
            'authorUid',
            '==',
            'user-1',
        );
        expect(firestore.where).not.toHaveBeenCalledWith(
            'email',
            '==',
            'old@example.com',
        );
        expect(firestore.orderBy).toHaveBeenCalledWith('date', 'desc');
        expect(firestore.getDocs).toHaveBeenCalledWith('my-posts-query');
    });

    it('로그인 사용자가 없으면 조회하지 않는다', async () => {
        firebase.auth.currentUser = null;

        await expect(fetchMyPostsFromFirestore('free'))
            .rejects.toThrow('로그인 필요');
        expect(firestore.getDocs).not.toHaveBeenCalled();
    });
});
