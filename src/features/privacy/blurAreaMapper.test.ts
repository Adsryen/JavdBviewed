/**
 * @file blurAreaMapper.test.ts
 * @description 隐私模糊区域选择器映射测试
 * @module features/privacy
 */
import { describe, expect, it } from 'vitest';

import { getAllBlurAreas, getAreaDisplayName, getSelectorsForAreas } from './blurAreaMapper';

describe('blurAreaMapper', () => {
  it('includes Dashboard 9C navigation buttons in the navigation blur area', () => {
    const selectors = getSelectorsForAreas(['navigation']);

    expect(selectors).toContain('.dashboard-main-tab');
    expect(selectors).toContain('.dashboard-sub-tab');
    expect(selectors).toContain('[data-area="navigation"]');
  });


  it('maps the account menu blur area and keeps old sidebar configs compatible', () => {
    const selectors = getSelectorsForAreas(['account-menu']);
    const legacySelectors = getSelectorsForAreas(['sidebar']);

    expect(selectors).toContain('#user-email-badge');
    expect(selectors).toContain('[data-area="account-menu-data"]');
    expect(legacySelectors).toContain('#user-email-badge');
  });

  it('exposes account-menu as the supported area name', () => {
    const areas = getAllBlurAreas();

    expect(areas).toContain('account-menu');
    expect(areas).not.toContain('sidebar' as never);
    expect(getAreaDisplayName('account-menu')).toBe('账号菜单');
  });
});
