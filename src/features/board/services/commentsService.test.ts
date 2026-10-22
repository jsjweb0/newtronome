import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMyComments } from './commentsService';

const firestore = vi.hoisted(() => ({
    collectionGroup: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));

vi.mock('../../../firebase', () => ({
    db: 'test-db',
}));

vi.mock('firebase/firestore', () => ({
    ...firestore,
    addDoc: vi.fn(),
    collection: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getCountFromServer: vi.fn(),
    Timestamp: class {
        private readonly value: Date;

        constructor(value: Date) {
            this.value = value;
        }

        toDate() {
            return this.value;
        }
    },
    updateDoc: vi.fn(),
}));

type PostReference = {
    id: string;
    path: string;
    parent: { id: string };
};

function createCommentSnapshot(
    id: string,
    postReference: PostReference,
    content: string,
) {
    return {
        id,
        ref: {
            parent: {
                parent: postReference,
            },
        },
        data: () => ({
            content,
            createdAt: new Date('2026-01-01'),
            likedUsers: [],
            likeCount: 0,
            writerUid: 'user-1',
            displayName: '테스트 사용자',
            photoURL: null,
        }),
    };
}

beforeEach(() => {
    vi.resetAllMocks();
    firestore.collectionGroup.mockReturnValue('comments-group');
    firestore.where.mockReturnValue('writer-filter');
    firestore.orderBy.mockReturnValue('created-at-order');
    firestore.query.mockReturnValue('my-comments-query');
});

describe('fetchMyComments', () => {
    it('부모 글 존재 여부를 댓글에 표시하고 같은 부모 글은 한 번만 조회한다', async () => {
        const existingPost = {
            id: 'post-1',
            path: 'free/post-1',
            parent: { id: 'free' },
        };
        const deletedPost = {
            id: 'post-2',
            path: 'notice/post-2',
            parent: { id: 'notice' },
        };

        firestore.getDocs.mockResolvedValue({
            docs: [
                createCommentSnapshot('comment-1', existingPost, '첫 번째 댓글'),
                createCommentSnapshot('comment-2', existingPost, '두 번째 댓글'),
                createCommentSnapshot('comment-3', deletedPost, '삭제된 글의 댓글'),
            ],
        });
        firestore.getDoc.mockImplementation(async (reference: PostReference) => ({
            exists: () => reference.path === existingPost.path,
        }));

        const result = await fetchMyComments('user-1');

        expect(result).toMatchObject([
            { id: 'comment-1', postId: 'post-1', postExists: true },
            { id: 'comment-2', postId: 'post-1', postExists: true },
            { id: 'comment-3', postId: 'post-2', postExists: false },
        ]);
        expect(firestore.getDoc).toHaveBeenCalledTimes(2);
        expect(firestore.getDoc).toHaveBeenCalledWith(existingPost);
        expect(firestore.getDoc).toHaveBeenCalledWith(deletedPost);
    });
});
