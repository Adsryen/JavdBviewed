/**
 * @file themeTokens.test.ts
 * @description 日夜主题关键 CSS 变量成对性合约测试
 * @module ui/tokens
 */
import { describe, expect, it } from 'vitest';
import {
  assertThemeParity,
  getRequiredThemeVars,
  loadDashboardThemeCss,
} from './themeTokens';

describe('dashboard theme token contract', () => {
  it('requires a non-empty critical variable list', () => {
    expect(getRequiredThemeVars().length).toBeGreaterThan(8);
  });

  it('keeps critical variables declared in both light (:root) and dark themes', () => {
    const css = loadDashboardThemeCss();
    const { lightMissing, darkMissing } = assertThemeParity(css);
    expect(lightMissing, `light missing: ${lightMissing.join(', ')}`).toEqual([]);
    expect(darkMissing, `dark missing: ${darkMissing.join(', ')}`).toEqual([]);
  });
});
