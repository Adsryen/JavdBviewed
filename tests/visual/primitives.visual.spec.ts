/**
 * @file primitives.visual.spec.ts
 * @description 本地 Playwright 截图基线：基础组件 light/dark（D10 不上 CI）
 * @module tests/visual
 */
import { expect, test, type Page } from '@playwright/test';

/**
 * 打开 Storybook iframe 并设置 data-theme
 */
async function openStory(page: Page, storyId: string, theme: 'light' | 'dark') {
  const url = `/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.waitForTimeout(150);
}

test.describe('UI primitives visual', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`button primary (${theme})`, async ({ page }) => {
      await openStory(page, 'primitives-button--primary', theme);
      const root = page.locator('#storybook-root');
      await expect(root).toBeVisible();
      await expect(page).toHaveScreenshot(`button-primary-${theme}.png`, {
        fullPage: false,
      });
    });

    test(`button matrix sizes (${theme})`, async ({ page }) => {
      await openStory(page, 'primitives-button--sizes', theme);
      await expect(page).toHaveScreenshot(`button-sizes-${theme}.png`);
    });

    test(`input default (${theme})`, async ({ page }) => {
      await openStory(page, 'primitives-input--default', theme);
      await expect(page).toHaveScreenshot(`input-default-${theme}.png`);
    });

    test(`toggle on (${theme})`, async ({ page }) => {
      await openStory(page, 'primitives-toggle--on', theme);
      await expect(page).toHaveScreenshot(`toggle-on-${theme}.png`);
    });

    test(`badge matrix (${theme})`, async ({ page }) => {
      await openStory(page, 'primitives-badge--matrix', theme);
      await expect(page).toHaveScreenshot(`badge-matrix-${theme}.png`);
    });

    test(`modal open (${theme})`, async ({ page }) => {
      await openStory(page, 'primitives-modal--open', theme);
      await expect(page).toHaveScreenshot(`modal-open-${theme}.png`);
    });
  }
});
