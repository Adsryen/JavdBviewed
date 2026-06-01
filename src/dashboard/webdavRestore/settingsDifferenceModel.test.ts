import { describe, expect, it } from 'vitest';
import {
  buildSettingsDifferenceModalHtml,
  getSettingsDifferenceCloseState,
  getSettingsDifferenceOpenState,
  getSettingsDifferenceOverlayStyle,
  SETTINGS_DIFFERENCE_MODAL_CLASS,
} from './settingsDifferenceModel';

describe('WebDAV restore settings difference model', () => {
  it('builds settings comparison modal html from local and cloud data', () => {
    const html = buildSettingsDifferenceModalHtml({
      local: { theme: 'dark', nested: { enabled: true } },
      cloud: { theme: 'light' },
    });

    expect(html).toContain('扩展设置差异对比');
    expect(html).toContain('本地设置');
    expect(html).toContain('云端设置');
    expect(html).toContain('"theme": "dark"');
    expect(html).toContain('"theme": "light"');
    expect(html).toContain('closeSettingsDiff');
    expect(html).toContain('closeSettingsDiffFooter');
  });

  it('uses empty objects when settings sides are missing', () => {
    const html = buildSettingsDifferenceModalHtml({});

    expect(html.match(/<pre/g) ?? []).toHaveLength(2);
    expect(html).toContain('{}');
  });

  it('escapes JSON text before inserting it into innerHTML', () => {
    const html = buildSettingsDifferenceModalHtml({
      local: { unsafe: '<script>alert(1)</script>' },
      cloud: {},
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('provides overlay style and class used by the DOM shell', () => {
    expect(SETTINGS_DIFFERENCE_MODAL_CLASS).toBe('settings-diff-modal');
    expect(getSettingsDifferenceOverlayStyle()).toContain('position: fixed');
    expect(getSettingsDifferenceOverlayStyle()).toContain('z-index: 2147483647');
  });

  it('builds open and close animation states for the DOM shell', () => {
    expect(getSettingsDifferenceOpenState()).toEqual({
      bodyOverflow: 'hidden',
      initialStyle: {
        opacity: '0',
        transform: 'scale(0.9)',
        transition: 'all 0.3s ease-out',
      },
      animatedStyle: {
        opacity: '1',
        transform: 'scale(1)',
      },
    });

    expect(getSettingsDifferenceCloseState()).toEqual({
      bodyOverflow: '',
      animationDurationMs: 300,
      closingStyle: {
        opacity: '0',
        transform: 'scale(0.9)',
      },
    });
  });
});
