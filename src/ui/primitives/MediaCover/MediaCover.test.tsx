/**
 * @file MediaCover.test.tsx
 * @description 媒体封面渲染合约：文档流高度框 + 完整海报显示
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

  it('renders img with contain fit class when imageUrl provided', () => {
    const html = renderToStaticMarkup(
      createElement(MediaCover, {
        imageUrl: 'http://example.com/a.jpg?api_key=x',
        alt: 'SSIS-001',
      }),
    );
    expect(html).toContain('<img');
    expect(html).toContain('http://example.com/a.jpg?api_key=x');
    expect(html).toContain('ui-media-cover__art-img');
    expect(html).toContain('ui-media-cover--fit-contain');
  });
});
