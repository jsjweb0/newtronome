import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4183',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'playback-desktop',
      testMatch: 'playback.spec.js',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'playback-mobile',
      testMatch: 'playback.spec.js',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'board-chromium',
      testMatch: 'board-*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4183 --strictPort',
    url: 'http://127.0.0.1:4183',
    reuseExistingServer: !process.env.CI,
  },
});
