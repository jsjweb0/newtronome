import { test, expect } from '@playwright/test';
import { installSoundCloudMock } from './soundcloud';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.href === 'https://w.soundcloud.com/player/api.js') {
      return route.fulfill({ contentType: 'application/javascript', body: `(${installSoundCloudMock.toString()})();` });
    }
    return route.fulfill({ status: 200, body: '' });
  });
  await page.goto('/');
  await page.waitForFunction(() => window.soundCloudTest?.isBound());
});

async function emit(page, event) {
  await page.evaluate((name) => window.soundCloudTest.emit(name), event);
}

async function expectNoLoading(page) {
  await expect(page.getByRole('status', { name: '트랙 정보 불러오는 중', includeHidden: true })).toHaveCount(0);
  await expect(page.locator('footer .animate-pulse')).toHaveCount(0);
  await expect(page.locator('main .animate-pulse')).toHaveCount(0);
}

test('loading, selection and keyboard pause stay consistent across the UI', async ({ page }) => {
  await expect(page.locator('main .animate-pulse').first()).toBeVisible();
  await emit(page, 'READY');
  await expect(page.getByRole('heading', { name: 'Now Playlist' })).toBeVisible();
  await page.locator('main').getByRole('button', { name: /E2E Second/ }).click();
  await expect(page.locator('footer')).toContainText('E2E Second');
  await expect(page.locator('footer').getByRole('button', { name: '정지', exact: true })).toBeVisible();
  const panelToggle = page.getByRole('button', { name: '플레이리스트 열기', exact: true });
  if (await panelToggle.count()) await panelToggle.click();
  await expect(page.locator('aside').getByRole('button', { name: 'E2E Second 일시정지' })).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'E2E Second 일시정지' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('footer').getByRole('button', { name: '재생', exact: true })).toBeVisible();
  await expect(page.locator('aside').getByRole('button', { name: 'E2E Second 재생' })).toBeVisible();
  await expectNoLoading(page);
});

test('confirmed empty playlist ends loading and exposes no playback controls', async ({ page }) => {
  await page.evaluate(() => window.soundCloudTest.empty());
  await emit(page, 'READY');
  await expect(page.locator('main')).toContainText('플레이리스트가 비어 있어요');
  await expect(page.locator('aside')).toContainText('플레이리스트가 비어 있어요');
  await expectNoLoading(page);
  await expect(page.locator('footer button')).toHaveCount(0);
  expect(await page.evaluate(() => window.soundCloudTest.commands)).toEqual([]);
});

test('an empty reload removes the previous track and playback time', async ({ page }) => {
  await emit(page, 'READY');
  await page.locator('main').getByRole('button', { name: /E2E Second/ }).click();
  await page.evaluate(() => window.soundCloudTest.emit('PLAY_PROGRESS', { currentPosition: 45000 }));
  await expect(page.locator('footer').getByRole('slider')).toHaveValue('45');
  await emit(page, 'ERROR');
  await page.locator('main').getByRole('button', { name: '다시 시도' }).click();
  await page.evaluate(() => window.soundCloudTest.empty());
  await emit(page, 'READY');
  await expect(page.locator('main')).toContainText('플레이리스트가 비어 있어요');
  for (const region of ['main', 'aside', 'footer']) {
    await expect(page.locator(region)).not.toContainText('E2E Second');
  }
  await expect(page.locator('footer button, footer input')).toHaveCount(0);
  await expectNoLoading(page);
});

test('Widget error ends loading and retry restores the playlist', async ({ page }) => {
  await emit(page, 'ERROR');
  await expect(page.locator('main').getByRole('alert')).toBeVisible();
  await expectNoLoading(page);
  await page.locator('main').getByRole('button', { name: '다시 시도' }).click();
  await expect(page.locator('main .animate-pulse').first()).toBeVisible();
  await emit(page, 'READY');
  await expect(page.getByRole('heading', { name: 'Now Playlist' })).toBeVisible();
  await page.locator('footer').getByRole('button', { name: '재생', exact: true }).click();
  await expect(page.locator('footer').getByRole('button', { name: '정지', exact: true })).toBeVisible();
});

test('missing READY times out and retry can finish with an empty result', async ({ page }) => {
  await expect(page.locator('main').getByRole('alert')).toBeVisible({ timeout: 15000 });
  await expectNoLoading(page);
  await page.locator('main').getByRole('button', { name: '다시 시도' }).click();
  await page.evaluate(() => window.soundCloudTest.empty());
  await emit(page, 'READY');
  await expect(page.locator('main')).toContainText('플레이리스트가 비어 있어요');
  await expectNoLoading(page);
});
