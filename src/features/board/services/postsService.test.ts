import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createPostInFirestore,
    fetchMyPostsFromFirestore,
} from './postsService';

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
    doc: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(),
    where: vi.fn(),
}));

const transaction = vi.hoisted(() => ({
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
}));

vi.mock('../../../firebase', () => ({
    auth: firebase.auth,
    db: 'test-db',
}));

vi.mock('firebase/firestore', () => ({
    ...firestore,
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    increment: vi.fn(),
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
    firestore.doc.mockImplementation(
        (_database: unknown, ...segments: string[]) => segments.join('/'),
    );
    firestore.serverTimestamp.mockReturnValue('server-timestamp');
    firestore.runTransaction.mockImplementation(
        async (
            _database: unknown,
            callback: (value: typeof transaction) => Promise<unknown>,
        ) => callback(transaction),
    );
    transaction.get.mockResolvedValue({
        exists: () => true,
        data: () => ({ current: 7 }),
    });
});

const createPostInput = {
    title: '새 게시글',
    content: '게시글 본문',
    category: 'chat',
    isNotice: false,
    authorUid: 'user-1',
    displayName: '작성자',
    photoURL: null,
};

describe('createPostInFirestore', () => {
    it('카운터를 1 증가시키고 같은 번호의 게시글 ID를 반환한다', async () => {
        await expect(
            createPostInFirestore('free', createPostInput),
        ).resolves.toBe('8');

        expect(transaction.get).toHaveBeenCalledWith('postCounters/free');
        expect(transaction.update).toHaveBeenCalledWith(
            'postCounters/free',
            { current: 8 },
        );
        expect(transaction.set).toHaveBeenCalledWith(
            'free/8',
            {
                title: '새 게시글',
                content: '게시글 본문',
                date: 'server-timestamp',
                category: 'chat',
                isNotice: false,
                likeCount: 0,
                likedUsers: [],
                authorUid: 'user-1',
                displayName: '작성자',
                photoURL: null,
            },
        );
    });

    it('카운터 문서가 없으면 게시글을 저장하지 않는다', async () => {
        transaction.get.mockResolvedValueOnce({
            exists: () => false,
            data: () => ({}),
        });

        await expect(
            createPostInFirestore('free', createPostInput),
        ).rejects.toThrow('게시글 번호 카운터가 없습니다.');

        expect(transaction.update).not.toHaveBeenCalled();
        expect(transaction.set).not.toHaveBeenCalled();
    });

    it.each([-1, 1.5, '7', null])(
        '카운터 값 %s이 올바른 정수가 아니면 저장하지 않는다',
        async (current) => {
            transaction.get.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ current }),
            });

            await expect(
                createPostInFirestore('free', createPostInput),
            ).rejects.toThrow('게시글 번호 카운터가 올바르지 않습니다.');

            expect(transaction.update).not.toHaveBeenCalled();
            expect(transaction.set).not.toHaveBeenCalled();
        },
    );
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
