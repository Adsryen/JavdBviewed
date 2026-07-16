/**
 * @file SettingSelect.test.tsx
 * @description SettingSelect 基础渲染合约
 * @module ui/patterns
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingSelect } from './SettingSelect';

describe('SettingSelect pattern', () => {
  it('renders options with stable id and selected value', () => {
    const html = renderToStaticMarkup(
      createElement(SettingSelect, {
        id: 'consoleLevel',
        value: 'INFO',
        onChange: () => {},
        options: [
          { value: 'OFF', label: 'OFF' },
          { value: 'INFO', label: 'INFO' },
          { value: 'DEBUG', label: 'DEBUG' },
        ],
      }),
    );
    expect(html).toContain('data-ui-pattern="setting-select"');
    expect(html).toContain('id="consoleLevel"');
    expect(html).toContain('value="INFO"');
    expect(html).toContain('OFF');
    expect(html).toContain('DEBUG');
  });

  it('marks disabled state', () => {
    const html = renderToStaticMarkup(
      createElement(SettingSelect, {
        id: 'disabled-select',
        value: 'a',
        disabled: true,
        onChange: () => {},
        options: [{ value: 'a', label: 'A' }],
      }),
    );
    expect(html).toContain('disabled');
  });
});
