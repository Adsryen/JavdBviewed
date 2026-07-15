/**
 * @file SettingsSubpageShell.test.tsx
 * @description 设置子页壳：partial HTML 经 React 注入后控件 id 可见
 * @module apps/dashboard/pages/settings
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsSubpageShell } from './SettingsSubpageShell';

const PANEL_HTML = `
<div class="settings-page" id="display-settings">
  <input type="checkbox" id="hideViewed" />
  <input type="checkbox" id="hideBrowsed" />
  <input type="checkbox" id="hideVR" />
  <input type="checkbox" id="hideWant" />
</div>
`;

describe('SettingsSubpageShell', () => {
  it('embeds panel HTML with required display control ids', () => {
    const html = renderToStaticMarkup(
      createElement(SettingsSubpageShell, {
        title: '列表显示设置',
        description: 'desc',
        panelHtml: PANEL_HTML,
        bodyHostId: 'settings-panel-body-host',
      }),
    );
    expect(html).toContain('id="settings-panel-body-host"');
    expect(html).toContain('id="display-settings"');
    expect(html).toContain('id="hideViewed"');
    expect(html).toContain('id="hideWant"');
    expect(html).toContain('data-action="back-to-settings"');
    expect(html).toContain('列表显示设置');
  });
});
