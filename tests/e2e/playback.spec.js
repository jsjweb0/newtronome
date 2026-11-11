import { test, expect } from '@playwright/test';
import { installSoundCloudMock } from './soundcloud';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.tags.includes('@virtual-time')) {
    const startTime = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time: startTime });
    await page.clock.pauseAt(startTime);
  }

  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.href === 'https://w.soundcloud.com/player/api.js') {
      return route.fulfill({ contentType: 'application/javascript', body: `(${installSoundCloudMock.toString()})();` });
    }
    return route.fulfill({ status: 200, body: '' });
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.soundCloudTest?.isBound())).toBe(true);
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
  await expect(page.locator('aside').getByRole('button', { name: 'E2E Second Artist Two 일시정지' })).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'E2E Second Artist Two 일시정지' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('footer').getByRole('button', { name: '재생', exact: true })).toBeVisible();
  await expect(page.locator('aside').getByRole('button', { name: 'E2E Second Artist Two 재생' })).toBeVisible();
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

test('missing READY times out and retry can finish with an empty result', { tag: '@virtual-time' }, async ({ page }, testInfo) => {
  try {
    const errorAlert = page.locator('main').getByRole('alert');
    await page.clock.runFor(9_999);
    await expect(errorAlert).toHaveCount(0);
    await expect(page.locator('main .animate-pulse').first()).toBeVisible();
    await page.clock.runFor(1);
    await expect(errorAlert).toBeVisible();
    await page.clock.resume();
    await expectNoLoading(page);
    await page.locator('main').getByRole('button', { name: '다시 시도' }).click();
    await page.evaluate(() => window.soundCloudTest.empty());
    await emit(page, 'READY');
    await expect(page.locator('main')).toContainText('플레이리스트가 비어 있어요');
    await expectNoLoading(page);
  } finally {
    const history = await page.evaluate(() => window.soundCloudTest.history);
    await testInfo.attach('soundcloud-history', {
      body: JSON.stringify(history, null, 2),
      contentType: 'application/json',
    });
  }
});

test('late responses from A do not overwrite B after consecutive track selections', async ({ page }, testInfo) => {
  try {
    await emit(page, 'READY');
    await expect(page.getByRole('heading', { name: 'Now Playlist' })).toBeVisible();
    await page.evaluate(() => {
      window.soundCloudTest.deferNext('getCurrentSound');
      window.soundCloudTest.deferNext('getDuration');
    });

    await page.locator('main').getByRole('button', { name: /E2E First/ }).click();
    await page.locator('main').getByRole('button', { name: /E2E Second/ }).click();
    const player = page.locator('footer');
    await expect(player).toContainText('E2E Second');
    await page.evaluate(() => window.soundCloudTest.emit('PLAY_PROGRESS', { currentPosition: 45000 }));
    await expect(player.getByRole('slider')).toHaveValue('45');

    const delayed = await page.evaluate(() => window.soundCloudTest.history.filter(entry => entry.type === 'deferred'));
    expect(delayed).toEqual([
      expect.objectContaining({ method: 'getCurrentSound', value: expect.objectContaining({ id: 1 }) }),
      expect.objectContaining({ method: 'getDuration', value: 180000 }),
    ]);
    for (const response of delayed) {
      await page.evaluate(id => window.soundCloudTest.release(id), response.requestId);
    }

    await expect(player).toContainText('E2E Second');
    await expect(player).not.toContainText('E2E First');
    await expect(player.getByRole('button', { name: '정지', exact: true })).toBeVisible();
    await expect(player.getByRole('slider')).toHaveValue('45');
    await expect(player.getByRole('slider')).toHaveAttribute('max', '210');
    const panelToggle = page.getByRole('button', { name: '플레이리스트 열기', exact: true });
    if (await panelToggle.count()) await panelToggle.click();
    await expect(page.locator('aside').getByRole('button', { name: 'E2E Second Artist Two 일시정지' })).toBeVisible();
    await expect(page.locator('aside').getByRole('button', { name: 'E2E First Artist One 일시정지' })).toHaveCount(0);
  } finally {
    // Attach on success too, so the same event sequence is available for every run.
    const history = await page.evaluate(() => window.soundCloudTest.history);
    await testInfo.attach('soundcloud-history', {
      body: JSON.stringify(history, null, 2),
      contentType: 'application/json',
    });
  }
});
