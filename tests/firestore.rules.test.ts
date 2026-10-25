import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const PROJECT_ID = 'demo-newtronome';

let testEnvironment: RulesTestEnvironment;

beforeAll(async () => {
  const rules = await readFile(
    new URL('../firestore.rules', import.meta.url),
    'utf8'
  );

  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

async function createNotice() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'notice', 'notice-1'), {
      authorUid: 'admin-user',
      title: '공지사항',
    });
  });
}

describe('Firestore 관리자 권한', () => {
  it('admin Claim이 있으면 공지를 삭제할 수 있다', async () => {
    await createNotice();

    const adminDb = testEnvironment
      .authenticatedContext('admin-user', { admin: true })
      .firestore();

    await assertSucceeds(deleteDoc(doc(adminDb, 'notice', 'notice-1')));
  });

  it('관리자 이메일만 있고 Claim이 없으면 공지를 삭제할 수 없다', async () => {
    await createNotice();

    const emailOnlyDb = testEnvironment
      .authenticatedContext('email-user', {
        email: 'admin@email.com',
      })
      .firestore();

    await assertFails(deleteDoc(doc(emailOnlyDb, 'notice', 'notice-1')));
  });
});

function createValidPostData(uid = 'user-1') {
  return {
    title: '테스트 게시글',
    content: '테스트 본문',
    postNo: 1,
    date: Timestamp.fromDate(new Date('2026-01-01')),
    category: 'chat',
    isNotice: false,
    likeCount: 0,
    likedUsers: [],
    authorUid: uid,
    displayName: '테스트 사용자',
    photoURL: null,
  };
}

function createValidCommentData(uid = 'user-1') {
  return {
    content: '테스트 댓글',
    createdAt: Timestamp.fromDate(new Date('2026-01-01')),
    likedUsers: [],
    likeCount: 0,
    writerUid: uid,
    displayName: '테스트 사용자',
    photoURL: null,
  };
}

async function createFreePost(postId = 'post-1') {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'free', postId),
      createValidPostData('user-1')
    );
  });
}

async function createFreeComment(commentId = 'comment-1') {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(
        context.firestore(),
        'free',
        'post-1',
        'comments',
        commentId
      ),
      createValidCommentData('user-1')
    );
  });
}

describe('게시글 생성 규칙', () => {
  it('로그인 사용자가 자신의 UID로 정상 게시글을 생성할 수 있다', async () => {
    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertSucceeds(
      setDoc(
        doc(userDb, 'free', 'post-1'),
        createValidPostData('user-1')
      )
    );
  });

  it('게시글에 email 필드를 저장할 수 없다', async () => {
    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertFails(
      setDoc(doc(userDb, 'free', 'post-1'), {
        ...createValidPostData('user-1'),
        email: 'user@example.com',
      })
    );
  });

  it('다른 사용자의 UID로 게시글을 생성할 수 없다', async () => {
    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertFails(
      setDoc(
        doc(userDb, 'free', 'post-1'),
        createValidPostData('other-user')
      )
    );
  });
});

describe('댓글 생성 규칙', () => {
  it('로그인 사용자가 자신의 UID로 정상 댓글을 생성할 수 있다', async () => {
    await createFreePost();

    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertSucceeds(
      setDoc(
        doc(userDb, 'free', 'post-1', 'comments', 'comment-1'),
        createValidCommentData('user-1')
      )
    );
  });

  it('댓글에 writerEmail 필드를 저장할 수 없다', async () => {
    await createFreePost();

    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertFails(
      setDoc(
        doc(userDb, 'free', 'post-1', 'comments', 'comment-1'),
        {
          ...createValidCommentData('user-1'),
          writerEmail: 'user@example.com',
        }
      )
    );
  });

  it('다른 사용자의 UID로 댓글을 생성할 수 없다', async () => {
    await createFreePost();

    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertFails(
      setDoc(
        doc(userDb, 'free', 'post-1', 'comments', 'comment-1'),
        createValidCommentData('other-user')
      )
    );
  });
});

describe.each(['free', 'notice'] as const)(
  '%s 게시글이 삭제된 뒤 댓글 규칙',
  (boardType) => {
    it('기존 댓글은 조회·삭제할 수 있지만 새 작성과 수정은 차단한다', async () => {
      await testEnvironment.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(
          doc(adminDb, boardType, 'post-1'),
          {
            ...createValidPostData('user-1'),
            isNotice: boardType === 'notice',
          }
        );
        await setDoc(
          doc(adminDb, boardType, 'post-1', 'comments', 'comment-1'),
          createValidCommentData('user-1')
        );
        await deleteDoc(doc(adminDb, boardType, 'post-1'));
      });

      const userDb = testEnvironment
        .authenticatedContext('user-1')
        .firestore();
      const existingComment = doc(
        userDb,
        boardType,
        'post-1',
        'comments',
        'comment-1'
      );

      await assertSucceeds(getDoc(existingComment));
      await assertFails(
        setDoc(
          doc(userDb, boardType, 'post-1', 'comments', 'comment-2'),
          createValidCommentData('user-1')
        )
      );
      await assertFails(
        updateDoc(existingComment, { content: '수정된 댓글' })
      );
      await assertSucceeds(deleteDoc(existingComment));
    });
  }
);

describe('허용하지 않은 필드 수정 규칙', () => {
  describe.each(['free', 'notice'] as const)('%s 게시판', (boardType) => {
    it('관리자도 게시글에 email 필드를 추가할 수 없다', async () => {
      await testEnvironment.withSecurityRulesDisabled(async (context) => {
        await setDoc(
          doc(context.firestore(), boardType, 'post-1'),
          {
            ...createValidPostData('user-1'),
            isNotice: boardType === 'notice',
          }
        );
      });

      const adminDb = testEnvironment
        .authenticatedContext('admin-user', { admin: true })
        .firestore();

      await assertFails(
        updateDoc(doc(adminDb, boardType, 'post-1'), {
          email: 'user@example.com',
        })
      );
    });
  });

  it('관리자도 댓글에 writerEmail 필드를 추가할 수 없다', async () => {
    await createFreePost();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          'free',
          'post-1',
          'comments',
          'comment-1'
        ),
        createValidCommentData('user-1')
      );
    });

    const adminDb = testEnvironment
      .authenticatedContext('admin-user', { admin: true })
      .firestore();

    await assertFails(
      updateDoc(
        doc(
          adminDb,
          'free',
          'post-1',
          'comments',
          'comment-1'
        ),
        {
          writerEmail: 'user@example.com',
        }
      )
    );
  });
});

describe('수정 후 문서 유효성 규칙', () => {
  it('작성자가 유효한 게시글과 댓글 내용을 수정할 수 있다', async () => {
    await createFreePost();
    await createFreeComment();

    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertSucceeds(
      updateDoc(doc(userDb, 'free', 'post-1'), {
        title: '수정된 제목',
        content: '수정된 본문',
        category: null,
        updatedAt: new Date('2026-02-01').toISOString(),
      })
    );
    await assertSucceeds(
      updateDoc(
        doc(userDb, 'free', 'post-1', 'comments', 'comment-1'),
        { content: '수정된 댓글' }
      )
    );
  });

  it.each([
    ['title', 123],
    ['content', null],
    ['category', []],
    ['updatedAt', 123],
  ])('작성자가 게시글의 %s 필드를 잘못된 타입으로 수정할 수 없다', async (field, value) => {
    await createFreePost();

    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertFails(
      updateDoc(doc(userDb, 'free', 'post-1'), {
        [field]: value,
      })
    );
  });

  it.each(['title', 'content'])(
    '작성자가 게시글의 필수 필드 %s을 삭제할 수 없다',
    async (field) => {
      await createFreePost();

      const userDb = testEnvironment
        .authenticatedContext('user-1')
        .firestore();

      await assertFails(
        updateDoc(doc(userDb, 'free', 'post-1'), {
          [field]: deleteField(),
        })
      );
    }
  );

  it.each([123, null])(
    '작성자가 댓글 내용을 잘못된 값 %s로 수정할 수 없다',
    async (content) => {
      await createFreePost();
      await createFreeComment();

      const userDb = testEnvironment
        .authenticatedContext('user-1')
        .firestore();

      await assertFails(
        updateDoc(
          doc(userDb, 'free', 'post-1', 'comments', 'comment-1'),
          { content }
        )
      );
    }
  );

  it('작성자가 댓글의 필수 content 필드를 삭제할 수 없다', async () => {
    await createFreePost();
    await createFreeComment();

    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();

    await assertFails(
      updateDoc(
        doc(userDb, 'free', 'post-1', 'comments', 'comment-1'),
        { content: deleteField() }
      )
    );
  });

  it('관리자도 게시글과 댓글을 잘못된 타입으로 수정할 수 없다', async () => {
    await createFreePost();
    await createFreeComment();

    const adminDb = testEnvironment
      .authenticatedContext('admin-user', { admin: true })
      .firestore();

    await assertFails(
      updateDoc(doc(adminDb, 'free', 'post-1'), { title: 123 })
    );
    await assertFails(
      updateDoc(
        doc(adminDb, 'free', 'post-1', 'comments', 'comment-1'),
        { content: 123 }
      )
    );
  });

  it('유효한 좋아요와 조회수 수정은 계속 허용한다', async () => {
    await createFreePost();
    await createFreeComment();

    const userDb = testEnvironment
      .authenticatedContext('user-1')
      .firestore();
    const publicDb = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertSucceeds(
      updateDoc(doc(userDb, 'free', 'post-1'), {
        likeCount: 1,
        likedUsers: ['user-1'],
      })
    );
    await assertSucceeds(
      updateDoc(
        doc(userDb, 'free', 'post-1', 'comments', 'comment-1'),
        {
          likeCount: 1,
          likedUsers: ['user-1'],
        }
      )
    );
    await assertSucceeds(
      updateDoc(doc(publicDb, 'free', 'post-1'), {
        viewCount: 1,
      })
    );
  });
});
