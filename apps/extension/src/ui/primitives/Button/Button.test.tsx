/**
 * @file Button.test.tsx
 * @description Button 基础渲染合约
 * @module ui/primitives
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button primitive', () => {
  it('renders children and primary styles by default', () => {
    const html = renderToStaticMarkup(createElement(Button, null, '保存'));
    expect(html).toContain('保存');
    expect(html).toContain('bg-[var(--color-primary)]');
    expect(html).toContain('type="button"');
  });

  it('supports secondary variant', () => {
    const html = renderToStaticMarkup(
      createElement(Button, { variant: 'secondary' }, '取消'),
    );
    expect(html).toContain('取消');
    expect(html).toContain('bg-[var(--color-surface-2)]');
  });
});
