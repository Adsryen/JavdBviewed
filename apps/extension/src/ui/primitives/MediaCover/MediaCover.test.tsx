/**
 * @file MediaCover.test.tsx
 * @description 媒体封面渲染合约：文档流高度框；图片经懒加载+限流后挂载
 * @module ui/primitives
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MediaCover } from './MediaCover';

describe('MediaCover primitive', () => {
  it('renders frame + absolute art layers', () => {
    const html = renderToStaticMarkup(
      createElement(MediaCover, {
        artStyle: { background: 'red' },
        footer: 'footer',
      }),
    );
    expect(html).toContain('ui-media-cover__frame');
    expect(html).toContain('ui-media-cover__art');
    expect(html).toContain('footer');
    expect(html).not.toContain('ui-media-cover__ratio');
  });

  it('defers remote image src until lazy gate (static markup has no img yet)', () => {
    const html = renderToStaticMarkup(
      createElement(MediaCover, {
        imageUrl: 'http://example.com/a.jpg?api_key=x',
        alt: 'SSIS-001',
        lazy: true,
      }),
    );
    // 静态渲染不跑 effect：先占位，不把全表 URL 打进 DOM
    expect(html).toContain('ui-media-cover--fit-contain');
    expect(html).toContain('ui-media-cover__frame');
    expect(html).not.toContain('http://example.com/a.jpg?api_key=x');
  });
});
