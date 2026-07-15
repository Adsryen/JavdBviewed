/**
 * @file PageHeader.test.tsx
 * @description PageHeader 基础渲染合约
 * @module ui/patterns
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader pattern', () => {
  it('renders title, description and actions', () => {
    const html = renderToStaticMarkup(
      createElement(
        PageHeader,
        {
          title: '设置',
          description: '选择要配置的设置项',
          actions: createElement('button', { type: 'button' }, '操作'),
        },
      ),
    );
    expect(html).toContain('设置');
    expect(html).toContain('选择要配置的设置项');
    expect(html).toContain('操作');
    expect(html).toContain('data-ui-pattern="page-header"');
    expect(html).toContain('text-[var(--color-fg)]');
  });

  it('renders eyebrow / back area', () => {
    const html = renderToStaticMarkup(
      createElement(PageHeader, {
        title: '子页',
        eyebrow: createElement(
          'button',
          { type: 'button', 'data-action': 'back-to-settings' },
          '返回',
        ),
      }),
    );
    expect(html).toContain('data-action="back-to-settings"');
    expect(html).toContain('返回');
  });
});
