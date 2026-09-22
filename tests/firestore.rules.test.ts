import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
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
