/**
 * @file MediaCover.test.tsx
 * @description 媒体封面渲染合约：必须有 frame 作为 16:9 文档流高度来源
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
    // 不再使用易塌缩的 padding-top ratio / svg sizer 作为主方案标记
    expect(html).not.toContain('ui-media-cover__ratio');
  });
});
