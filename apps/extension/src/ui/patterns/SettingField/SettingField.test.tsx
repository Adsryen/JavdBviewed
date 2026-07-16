/**
 * @file SettingField.test.tsx
 * @description SettingField 基础渲染合约
 * @module ui/patterns
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingField } from './SettingField';

describe('SettingField pattern', () => {
  it('renders label, control and stable htmlFor', () => {
    const html = renderToStaticMarkup(
      createElement(
        SettingField,
        { id: 'insightsTopN', label: 'Top N 排行数量' },
        createElement('input', { id: 'insightsTopN', type: 'number' }),
      ),
    );
    expect(html).toContain('data-ui-pattern="setting-field"');
    expect(html).toContain('for="insightsTopN"');
    expect(html).toContain('Top N 排行数量');
    expect(html).toContain('id="insightsTopN"');
  });

  it('renders optional description below control', () => {
    const html = renderToStaticMarkup(
      createElement(
        SettingField,
        {
          id: 'insightsSource',
          label: '数据源',
          description: '选择报告使用的数据来源。',
        },
        createElement('select', { id: 'insightsSource' }),
      ),
    );
    expect(html).toContain('选择报告使用的数据来源。');
  });
});
