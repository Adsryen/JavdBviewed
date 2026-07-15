/**
 * @file mediaGridLayout.visual.spec.ts
 * @description 自检：媒体库网格卡片不得互相重叠，封面接近 16:9
 * @module tests/visual
 */
import { expect, test } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** 两矩形是否严格重叠（边贴边不算） */
function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

test.describe('media grid layout self-check', () => {
  test('grid cards do not overlap and cover is ~16:9', async ({ page }) => {
    const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/ui/media-grid-layout.html');
    await page.goto(pathToFileURL(fixturePath).href);

    const cards = page.locator('[data-layout-card]');
    await expect(cards).toHaveCount(6);

    const boxes: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (let i = 0; i < 6; i += 1) {
      const box = await cards.nth(i).boundingBox();
      expect(box, `card ${i} missing box`).toBeTruthy();
      if (!box) continue;
      expect(box.height, `card ${i} height too small: ${box.height}`).toBeGreaterThan(100);
      expect(box.width, `card ${i} width too small`).toBeGreaterThan(120);
      boxes.push({ x: box.x, y: box.y, w: box.width, h: box.height });
    }

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const bad = overlaps(boxes[i], boxes[j]);
        expect(
          bad,
          `card ${i} overlaps card ${j}: ${JSON.stringify(boxes[i])} vs ${JSON.stringify(boxes[j])}`,
        ).toBe(false);
      }
    }

    // 至少两行：第 4 张应比第 1 张更靠下（3 列布局）
    expect(boxes[3].y).toBeGreaterThan(boxes[0].y + 40);

    const coverBox = await page.locator('.ui-media-cover__frame').first().boundingBox();
    expect(coverBox).toBeTruthy();
    if (coverBox) {
      const ratio = coverBox.width / coverBox.height;
      expect(ratio, `cover ratio ${ratio}`).toBeGreaterThan(1.5);
      expect(ratio, `cover ratio ${ratio}`).toBeLessThan(2.0);
      expect(coverBox.height).toBeGreaterThan(100);
    }
  });
});
