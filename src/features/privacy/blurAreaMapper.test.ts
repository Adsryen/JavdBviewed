/**
 * @file blurAreaMapper.test.ts
 * @description 隐私模糊区域选择器映射测试
 * @module features/privacy
 */
import { describe, expect, it } from 'vitest';

import { getSelectorsForAreas } from './blurAreaMapper';

describe('blurAreaMapper', () => {
  it('includes Dashboard 9C navigation buttons in the navigation blur area', () => {
    const selectors = getSelectorsForAreas(['navigation']);

    expect(selectors).toContain('.dashboard-main-tab');
    expect(selectors).toContain('.dashboard-sub-tab');
    expect(selectors).toContain('[data-area="navigation"]');
  });
});
