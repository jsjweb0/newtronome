import { test as base, expect } from '@playwright/test';
import type { Post } from '../../../src/features/board/types/post';
import type { Comment } from '../../../src/features/board/types/comment';

const user = { uid: 'e2e-owner', email: 'owner@example.test', displayName: 'E2E 작성자', photoURL: null, isAdmin: true };
type Operation = 'list' | 'detail' | 'mine' | 'create' | 'update' | 'delete' | 'view'
  | 'comments' | 'myComments' | 'count' | 'createComment' | 'updateComment' | 'deleteComment';
type Request = { op: Operation; args: unknown[] };

export function makePost(id: string, title: string, overrides: Partial<Post> = {}): Post {
  return { id, title, content: `${title} 본문`, boardType: 'free', authorUid: user.uid,
    displayName: user.displayName, photoURL: null, category: 'chat',
    date: new Date('2026-10-01T00:00:00Z'), updatedAt: null,
    likeCount: 0, likedUsers: [], viewCount: 10, isNotice: false, ...overrides };
}

export function makeComment(id: string, postId: string, content: string): Comment {
  return { id, postId, content, boardType: 'free', writerUid: user.uid,
    displayName: user.displayName, photoURL: null,
    createdAt: new Date('2026-10-01T00:00:00Z'), likeCount: 0, liked: false };
}

// Each browser test owns its store. These are service-contract mocks, not Firebase integration tests.
export class BoardStore {
  posts = [makePost('a', '게시글 A'), makePost('b', '게시글 B', { viewCount: 20 })];
  comments = [makeComment('ca', 'a', 'A의 기존 댓글'), makeComment('cb', 'b', 'B의 기존 댓글')];
  requests: Request[] = [];
  private sequence = 0;
  private postNumber = 0;
  private failures = new Map<Operation, number>();
  private gates = new Map<string, Promise<void>>();
  private releases: (() => void)[] = [];

  fail(op: Operation, count = 1) { this.failures.set(op, count); }
  hold(op: Operation, id = '*') {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    this.gates.set(`${op}/${id}`, gate);
    this.releases.push(release);
    return () => { this.gates.delete(`${op}/${id}`); release(); };
  }
  releaseAll() { this.releases.forEach((release) => release()); }
  count(op: Operation, id?: string) {
    return this.requests.filter((request) => request.op === op && (id === undefined || request.args[1] === id)).length;
  }
  async handle(request: Request): Promise<unknown> {
    this.requests.push(request);
    const { op, args } = request;
    const board = String(args[0]);
    const id = String(args[1]);
    const gate = this.gates.get(`${op}/${id}`) ?? this.gates.get(`${op}/*`);
    const remaining = this.failures.get(op) ?? 0;
    if (remaining) {
      this.failures.set(op, remaining - 1);
      if (gate) await gate;
      throw new Error(`Controlled ${op} failure`);
    }
    const post = this.posts.find((item) => item.boardType === board && item.id === id);
    // Reads take a snapshot before release, allowing reproducible stale-response tests.
    let result: unknown;
    switch (op) {
      case 'list': case 'mine': result = this.posts.filter((item) => item.boardType === board); break;
      case 'detail': if (!post) throw new Error('해당 문서가 없습니다.'); result = post; break;
      case 'comments': result = this.comments.filter((item) => item.boardType === board && item.postId === id); break;
      case 'myComments': result = this.comments.filter((item) => item.writerUid === board); break;
      case 'count': result = this.comments.filter((item) => item.boardType === board && item.postId === id).length; break;
    }
    const snapshot = result === undefined ? undefined : JSON.parse(JSON.stringify(result));
    if (gate) await gate;
    switch (op) {
      case 'create': {
        const postId = String(++this.postNumber);
        const created = makePost(postId, '', { ...args[1] as Partial<Post>, boardType: board as Post['boardType'] });
        this.posts.unshift(created); return postId;
      }
      case 'update': if (!post) throw new Error('Missing post'); Object.assign(post, args[2]); break;
      case 'delete': this.posts = this.posts.filter((item) => !(item.boardType === board && item.id === id)); break;
      case 'view': if (!post) throw new Error('Missing post'); post.viewCount += 1; break;
      case 'createComment': {
        const created = { ...makeComment(`new-comment-${++this.sequence}`, id, ''), ...args[2] as Partial<Comment> };
        this.comments.push(created); return created;
      }
      case 'updateComment': {
        const comment = this.comments.find((item) => item.boardType === board && item.postId === id && item.id === args[2]);
        if (!comment) throw new Error('Missing comment'); comment.content = String(args[3]); break;
      }
      case 'deleteComment': this.comments = this.comments.filter((item) => !(item.boardType === board && item.postId === id && item.id === args[2])); break;
    }
    return snapshot ?? null;
  }
}

const rpc = `async function call(op, args) {
  const response = await fetch('/__board_test_rpc', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({op,args}) });
  if (!response.ok) throw new Error('Controlled service failure');
  return JSON.parse(await response.text(), (key,value) => ['date','updatedAt','createdAt'].includes(key) && value ? new Date(value) : value);
}`;
const exportsFor = (mapping: Record<string, Operation>) => rpc + Object.entries(mapping)
  .map(([name, op]) => `export const ${name} = (...args) => call('${op}',args);`).join('\n');

export const test = base.extend<{ store: BoardStore }>({
  store: async ({ page }, use) => {
    const store = new BoardStore();
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      // Also block the dev server's production /api proxy. No production traffic is permitted.
      if (url.origin !== 'http://127.0.0.1:4183' || url.pathname.startsWith('/api/')) {
        await route.abort(); return;
      }
      if (url.pathname === '/__board_test_rpc') {
        try {
          const value = await store.handle(route.request().postDataJSON() as Request);
          await route.fulfill({ json: value });
        } catch {
          await route.fulfill({ status: 503, json: { error: 'Controlled failure' } });
        }
        return;
      }
      let body: string | undefined;
      if (url.pathname === '/src/features/board/services/postsService.ts') {
        body = exportsFor({ fetchPostsFromFirestore: 'list', fetchPostFromFirestore: 'detail', fetchMyPostsFromFirestore: 'mine',
          createPostInFirestore: 'create', updatePostInFirestore: 'update', deletePostFromFirestore: 'delete', incrementPostViewCount: 'view' });
      } else if (url.pathname === '/src/features/board/services/commentsService.ts') {
        body = exportsFor({ fetchComments: 'comments', fetchMyComments: 'myComments', fetchCommentCount: 'count',
          createCommentInFirestore: 'createComment', updateCommentInFirestore: 'updateComment', deleteCommentFromFirestore: 'deleteComment' });
      } else if (url.pathname === '/src/contexts/AuthProvider.tsx') {
        body = `import React from '/node_modules/.vite/deps/react.js';
          import {AuthContext} from '/src/contexts/AuthContext.ts';
          export function AuthProvider({children}) {
            return React.createElement(AuthContext.Provider, {value:{user:${JSON.stringify(user)},loading:false,avatarUrl:'',nicknameUrl:'E2E 작성자',login:async()=>{},signup:async()=>{},logout:async()=>{}}}, children);
          }`;
      } else if (url.pathname === '/src/firebase.ts') {
        body = `import { initializeApp } from '/node_modules/.vite/deps/firebase_app.js';
          import { getFirestore } from '/node_modules/.vite/deps/firebase_firestore.js';
          export const db = getFirestore(initializeApp({projectId:'demo-newtronome-e2e',apiKey:'test-only',appId:'test-only'}));
          export const auth = {currentUser:${JSON.stringify(user)}};
          export const analytics = null;`;
      }
      if (body !== undefined) await route.fulfill({ contentType: 'application/javascript', body });
      else await route.continue();
    });
    await use(store);
    store.releaseAll();
  },
});
export { expect };
