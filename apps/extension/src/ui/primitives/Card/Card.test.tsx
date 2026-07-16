/**
 * @file Card.test.tsx
 * @description Card 基础渲染合约
 * @module ui/primitives
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card primitive', () => {
  it('renders title and body', () => {
    const html = renderToStaticMarkup(
      createElement(Card, { title: '标题' }, '正文内容'),
    );
    expect(html).toContain('标题');
    expect(html).toContain('正文内容');
    expect(html).toContain('bg-[var(--color-surface)]');
  });
});
