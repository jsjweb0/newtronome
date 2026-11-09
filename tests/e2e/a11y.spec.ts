import AxeBuilder from '@axe-core/playwright';
import type { AxeResults, Result } from 'axe-core';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/board';
import { installSoundCloudMock } from './soundcloud';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) =>
          [
            `    element: ${node.target.join(' ')}`,
            `    fix: ${node.failureSummary ?? violation.help}`,
          ].join('\n')
        )
        .join('\n');

      return [
        `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}`,
        `  ${violation.helpUrl}`,
        nodes,
      ].join('\n');
    })
    .join('\n\n');
}

async function analyzePage(page: Page): Promise<AxeResults> {
  return new AxeBuilder({ page })
    .withTags(wcagTags)
    .analyze();
}

async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await analyzePage(page);

  if (results.violations.length > 0) {
    throw new Error(`접근성 위반:\n${formatViolations(results.violations)}`);
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('https://w.soundcloud.com/player/api.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `(${installSoundCloudMock.toString()})();`,
    })
  );
});

test('메인 페이지', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.soundCloudTest?.isBound());
  await page.evaluate(() => window.soundCloudTest?.emit('READY'));
  await expect(page.getByRole('heading', { name: 'Now Playlist' })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('검색 페이지', async ({ page }) => {
  await page.goto('/search');
  await expect(page.getByRole('heading', { name: 'Search', exact: true })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('게시판 페이지', async ({ page, store }) => {
  void store;
  await page.goto('/board/free');
  await expect(page.getByRole('heading', { name: 'Free Board' })).toBeVisible();
  await expect(page.getByRole('link', { name: /게시글 A/ })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('로그인 페이지', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('404 페이지', async ({ page }) => {
  await page.goto('/not-a-real-page');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await expectNoA11yViolations(page);
});
