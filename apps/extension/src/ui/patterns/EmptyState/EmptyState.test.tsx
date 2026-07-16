/**
 * @file EmptyState.test.tsx
 * @description EmptyState 基础渲染合约
 * @module ui/patterns
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState pattern', () => {
  it('renders title and description', () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        title: '暂无数据',
        description: '请先同步',
      }),
    );
    expect(html).toContain('暂无数据');
    expect(html).toContain('请先同步');
    expect(html).toContain('data-ui-pattern="empty-state"');
    expect(html).toContain('bg-[var(--color-surface-2)]');
  });

  it('renders action slot', () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        title: '空',
        action: createElement('button', { type: 'button' }, '去设置'),
      }),
    );
    expect(html).toContain('去设置');
  });
});
