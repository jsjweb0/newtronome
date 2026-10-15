import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'board-*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  outputDir: '../../test-results/board',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4183',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'board-chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4183 --strictPort',
    url: 'http://127.0.0.1:4183',
    reuseExistingServer: false,
  },
});
