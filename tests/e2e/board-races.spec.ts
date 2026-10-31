import { test, expect } from './fixtures/board';

test('edit draft survives a stale query background refetch', async ({ page, store }) => {
  await page.clock.install();
  await page.goto('/board/free/edit/a');
  const title = page.getByPlaceholder('제목을 입력해주세요');
  const content = page.getByPlaceholder('내용을 입력해주세요.');
  await expect(title).toHaveValue('게시글 A');
  await title.fill('작성 중인 제목');
  await content.fill('작성 중인 본문');
  store.posts[0].viewCount += 3;
  const reads = store.count('detail', 'a');
  const release = store.hold('detail', 'a');
  await page.clock.fastForward(61_000);
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
  await expect.poll(() => store.count('detail', 'a')).toBeGreaterThan(reads);
  const response = page.waitForResponse((response) => response.url().endsWith('/__board_test_rpc')
    && response.request().postDataJSON().op === 'detail');
  release();
  await response;
  // A UI action after the response ensures React has had a render opportunity.
  await page.getByRole('heading', { name: '글 수정' }).click();
  await expect(title).toHaveValue('작성 중인 제목');
  await expect(content).toHaveValue('작성 중인 본문');
});

test('late A view mutation does not increment B', async ({ page, store }) => {
  const releaseA = store.hold('view', 'a');
  const releaseB = store.hold('view', 'b');
  await page.goto('/board/free/a');
  await expect(page.getByText('조회수 10', { exact: true })).toBeVisible();
  await expect.poll(() => store.count('view', 'a')).toBe(1);
  await page.getByRole('link', { name: /다음글.*게시글 B/ }).click();
  await expect(page.getByText('조회수 20', { exact: true })).toBeVisible();
  await expect.poll(() => store.count('view', 'b')).toBe(1);
  const responseA = page.waitForResponse((response) => response.url().endsWith('/__board_test_rpc')
    && response.request().postDataJSON().op === 'view' && response.request().postDataJSON().args[1] === 'a');
  releaseA();
  await responseA;
  await page.getByRole('heading', { name: /게시글 B/ }).click();
  await expect(page.getByText('조회수 20', { exact: true })).toBeVisible();
  releaseB();
  await expect(page.getByText('조회수 21', { exact: true })).toBeVisible();
  await page.goBack();
  await expect.poll(() => store.count('view', 'a')).toBe(2);
  await expect(page.getByText('조회수 12', { exact: true })).toBeVisible();
});

test('repeated delete clicks send one request while deletion is pending', async ({ page, store }) => {
  const release = store.hold('delete', 'a');
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/board/free/a');
  const remove = page.getByRole('button', { name: '삭제', exact: true });
  await remove.click();
  await expect.poll(() => store.count('delete', 'a')).toBe(1);
  // Real consecutive pointer actions; disabled buttons naturally suppress the second request.
  const box = await remove.boundingBox();
  if (!box) throw new Error('Delete button is missing');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.getByRole('heading', { name: /게시글 A/ }).click();
  expect(store.count('delete', 'a')).toBe(1);
  await expect(remove).toBeDisabled();
  expect(store.count('delete', 'a')).toBe(1);
  release();
  await expect(page).toHaveURL(/\/board\/free\?/);
  await expect(page.getByRole('link', { name: /게시글 A/ })).toHaveCount(0);
});

test('late deletion does not navigate away from a newly selected board', async ({ page, store }) => {
  const release = store.hold('delete', 'a');
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/board/free');
  await page.getByRole('link', { name: /게시글 A/ }).click();
  await expect(page.getByRole('heading', { name: /게시글 A/ })).toBeVisible();
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await expect.poll(() => store.count('delete', 'a')).toBe(1);
  await page.goBack();
  await page.getByRole('link', { name: 'Notice', exact: true }).first().click();
  await expect(page).toHaveURL(/\/board\/notice/);
  const response = page.waitForResponse((response) => response.url().endsWith('/__board_test_rpc')
    && response.request().postDataJSON().op === 'delete');
  release();
  await response;
  await expect(page.getByRole('heading', { name: '공지사항', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/board\/notice/);
});
