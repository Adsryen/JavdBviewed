/**
 * @file playwright.config.ts
 * @description 本地视觉/布局自检配置（默认不启 Storybook；截图用例需 PLAYWRIGHT_WITH_STORYBOOK=1）
 * @module tests/visual
 */
import { defineConfig, devices } from '@playwright/test';

const withStorybook = process.env.PLAYWRIGHT_WITH_STORYBOOK === '1';

export default defineConfig({
  testDir: 'tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:6006',
    trace: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: withStorybook
    ? {
        command: 'pnpm storybook --ci --port 6006 --host 127.0.0.1',
        url: 'http://127.0.0.1:6006',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
});
