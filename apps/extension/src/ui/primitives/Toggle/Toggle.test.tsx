/**
 * @file Toggle.test.tsx
 * @description Toggle 基础渲染合约
 * @module ui/primitives
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Toggle } from './Toggle';

describe('Toggle primitive', () => {
  it('renders switch role and label', () => {
    const html = renderToStaticMarkup(
      createElement(Toggle, { label: '自动检查', defaultChecked: true }),
    );
    expect(html).toContain('role="switch"');
    expect(html).toContain('自动检查');
    expect(html).toContain('checked');
  });
});
