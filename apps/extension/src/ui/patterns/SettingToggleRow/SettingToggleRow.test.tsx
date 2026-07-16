/**
 * @file SettingToggleRow.test.tsx
 * @description SettingToggleRow 基础渲染合约
 * @module ui/patterns
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingToggleRow } from './SettingToggleRow';

describe('SettingToggleRow pattern', () => {
  it('renders label, stable id and checked switch', () => {
    const html = renderToStaticMarkup(
      createElement(SettingToggleRow, {
        id: 'hideViewed',
        label: '隐藏已标记"看过"的影片',
        checked: true,
        onChange: () => {},
      }),
    );
    expect(html).toContain('data-ui-pattern="setting-toggle-row"');
    expect(html).toContain('id="hideViewed"');
    expect(html).toContain('for="hideViewed"');
    expect(html).toContain('隐藏已标记');
    expect(html).toContain('role="switch"');
    expect(html).toContain('checked');
  });

  it('renders optional description', () => {
    const html = renderToStaticMarkup(
      createElement(SettingToggleRow, {
        id: 'hideVR',
        label: '隐藏 VR',
        description: '列表中不展示 VR 作品',
        checked: false,
        onChange: () => {},
      }),
    );
    expect(html).toContain('列表中不展示 VR 作品');
  });
});
