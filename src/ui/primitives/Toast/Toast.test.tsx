/**
 * @file Toast.test.tsx
 * @description Toast 渲染合约
 * @module ui/primitives
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';

describe('Toast primitive', () => {
  it('renders title body and close control', () => {
    const html = renderToStaticMarkup(
      createElement(Toast, {
        title: '成功',
        tone: 'success',
        onClose: vi.fn(),
        children: '已完成',
      }),
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('成功');
    expect(html).toContain('已完成');
    expect(html).toContain('关闭提示');
  });
});
