/**
 * @file FilterChip.test.tsx
 * @description FilterChip 基础渲染合约
 * @module ui/patterns
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FilterChip } from './FilterChip';

describe('FilterChip pattern', () => {
  it('renders inactive chip', () => {
    const html = renderToStaticMarkup(
      createElement(FilterChip, { active: false }, '全部来源'),
    );
    expect(html).toContain('全部来源');
    expect(html).toContain('data-ui-pattern="filter-chip"');
    expect(html).toContain('data-active="false"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('bg-[var(--color-surface-2)]');
  });

  it('renders active chip with primary token classes', () => {
    const html = renderToStaticMarkup(
      createElement(FilterChip, { active: true }, 'Emby'),
    );
    expect(html).toContain('Emby');
    expect(html).toContain('data-active="true"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('bg-[var(--color-primary-soft)]');
    expect(html).toContain('text-[var(--color-primary-active)]');
  });
});
