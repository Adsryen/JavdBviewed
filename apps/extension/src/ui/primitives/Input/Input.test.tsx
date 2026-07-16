/**
 * @file Input.test.tsx
 * @description Input 基础渲染合约
 * @module ui/primitives
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input primitive', () => {
  it('renders text input with token classes', () => {
    const html = renderToStaticMarkup(createElement(Input, { placeholder: '搜索' }));
    expect(html).toContain('placeholder="搜索"');
    expect(html).toContain('bg-[var(--color-surface)]');
  });

  it('marks invalid state', () => {
    const html = renderToStaticMarkup(createElement(Input, { invalid: true }));
    expect(html).toContain('border-[var(--color-danger)]');
  });
});
