/**
 * @file Tabs.test.tsx
 * @description Tabs 渲染合约
 * @module ui/primitives
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs primitive', () => {
  it('renders tablist and selected tab', () => {
    const html = renderToStaticMarkup(
      createElement(Tabs, {
        items: [
          { id: 'a', label: '甲' },
          { id: 'b', label: '乙' },
        ],
        value: 'b',
        onChange: vi.fn(),
      }),
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('甲');
    expect(html).toContain('乙');
    expect(html).toContain('aria-selected="true"');
  });
});
