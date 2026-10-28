import { test, expect, makePost } from './fixtures/board';

test('list read failure shows retry UI and recovers without production traffic', async ({ page, store }) => {
  store.fail('list', 4);
  await page.goto('/board/free');
  const main = page.locator('main');
  await expect(main.getByRole('alert')).toContainText('게시글을 불러오지 못했습니다.');
  expect(store.count('list')).toBe(4);
  await main.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('link', { name: /게시글 A/ })).toBeVisible();
});

test('failed post create and update retain entered values and existing data', async ({ page, store }) => {
  store.fail('create');
  await page.goto('/board/free/write');
  await page.getByTitle('카테고리').selectOption('chat');
  await page.getByPlaceholder('제목을 입력해주세요').fill('실패해도 남을 제목');
  await page.getByPlaceholder('내용을 입력해주세요.').fill('실패해도 남을 본문');
  await page.getByRole('button', { name: '등록', exact: true }).click();
  await expect(page.getByText('글 등록에 실패했습니다.', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('제목을 입력해주세요')).toHaveValue('실패해도 남을 제목');
  await expect(page.getByPlaceholder('내용을 입력해주세요.')).toHaveValue('실패해도 남을 본문');
  expect(store.posts).toHaveLength(2);

  store.fail('update');
  await page.goto('/board/free/edit/a');
  await page.getByPlaceholder('제목을 입력해주세요').fill('저장 실패 제목');
  await page.getByPlaceholder('내용을 입력해주세요.').fill('저장 실패 본문');
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(page.getByText('게시글 수정에 실패했습니다.', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('제목을 입력해주세요')).toHaveValue('저장 실패 제목');
  expect(store.posts.find((post) => post.id === 'a')?.title).toBe('게시글 A');
});

test('failed comment mutations retain input and server-backed rows', async ({ page, store }) => {
  await page.goto('/board/free/a');
  const composer = page.getByPlaceholder('내용을 입력해주세요.');
  store.fail('createComment');
  await composer.fill('등록 실패 댓글');
  await page.getByRole('button', { name: '작성', exact: true }).click();
  await expect(page.getByText('댓글 등록에 실패했습니다.', { exact: true })).toBeVisible();
  await expect(composer).toHaveValue('등록 실패 댓글');
  await expect(page.getByText('A의 기존 댓글', { exact: true })).toBeVisible();

  const originalRow = page.getByText('A의 기존 댓글', { exact: true }).locator('xpath=../../..');
  store.fail('updateComment');
  await originalRow.getByRole('button', { name: 'Dropdown', exact: true }).click();
  await originalRow.getByRole('button', { name: '수정', exact: true }).click();
  const editor = page.locator('textarea').last();
  await editor.fill('수정 실패 댓글');
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(page.getByText('수정에 실패했습니다.', { exact: true })).toBeVisible();
  await expect(editor).toHaveValue('수정 실패 댓글');
  expect(store.comments.find((comment) => comment.id === 'ca')?.content).toBe('A의 기존 댓글');

  // Cancel editing, then verify a failed delete keeps the existing row.
  await page.getByRole('button', { name: '취소', exact: true }).click();
  store.fail('deleteComment');
  await originalRow.getByRole('button', { name: 'Dropdown', exact: true }).click();
  await originalRow.getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText('삭제에 실패했습니다.', { exact: true })).toBeVisible();
  await expect(page.getByText('A의 기존 댓글', { exact: true })).toBeVisible();
});

test('failed post delete keeps the current post visible', async ({ page, store }) => {
  store.fail('delete');
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/board/free/a');
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.getByText('삭제에 실패했습니다.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /게시글 A/ })).toBeVisible();
  expect(store.posts.some((post) => post.id === 'a')).toBe(true);
});

test('a late detail response cannot replace the newly selected post', async ({ page, store }) => {
  const releaseA = store.hold('detail', 'a');
  await page.goto('/board/free');
  await page.getByRole('link', { name: /게시글 A/ }).click();
  await expect.poll(() => store.count('detail', 'a')).toBe(1);
  await page.getByRole('link', { name: 'Free Board', exact: true }).first().click();
  await page.getByRole('link', { name: /게시글 B/ }).click();
  await expect(page.getByRole('heading', { name: /게시글 B/ })).toBeVisible();
  releaseA();
  await page.getByRole('heading', { name: /게시글 B/ }).click();
  await expect(page.getByRole('heading', { name: /게시글 B/ })).toBeVisible();
  await expect(page).toHaveURL(/\/board\/free\/b/);
});

test('search, sort, pagination, detail and browser back preserve list state', async ({ page, store }) => {
  store.posts = Array.from({ length: 12 }, (_, index) =>
    makePost(`post-${index + 1}`, `React 글 ${index + 1}`, { postNo: index + 1 }));
  await page.goto('/board/free');
  await page.getByRole('navigation', { name: 'Pagination' })
    .getByRole('button', { name: '2', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('link', { name: /React 글 2/ })).toBeVisible();
  await page.getByRole('link', { name: /React 글 2/ }).click();
  await page.goBack();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('link', { name: /React 글 2/ })).toBeVisible();

  await page.getByRole('textbox', { name: '검색어' }).fill('React 글 1');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page).toHaveURL(/keyword=React(?:\+|%20)%EA%B8%80(?:\+|%20)1/);
  await expect(page.getByRole('link', { name: /React 글 12/ })).toBeVisible();
  await page.getByRole('button', { name: '최신 순', exact: true }).click();
  await expect(page).toHaveURL(/sort=asc/);
  const resultLinks = page.locator('a[href*="/board/free/post-"]');
  await expect(resultLinks.first()).toContainText('React 글 1');
});

