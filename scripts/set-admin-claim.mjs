import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2];

if (!uid) {
  throw new Error('관리자 UID를 인자로 입력하세요.');
}

initializeApp({
  credential: applicationDefault(),
  projectId: 'free-board-15f7f',
});

const adminAuth = getAuth();
const user = await adminAuth.getUser(uid);

await adminAuth.setCustomUserClaims(uid, {
  ...(user.customClaims ?? {}),
  admin: true,
});

const updatedUser = await adminAuth.getUser(uid);

console.log('설정된 Claim:', updatedUser.customClaims);
