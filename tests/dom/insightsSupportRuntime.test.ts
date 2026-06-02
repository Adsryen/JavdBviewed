import { beforeEach, describe, expect, it } from 'vitest';
import {
  adjustInsightsIframeHeight,
  getInsightsPreviewContainer,
} from '../../src/dashboard/tabs/insights/supportRuntime';

describe('insights support runtime DOM helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('finds preview container and keeps iframe height in sync with content', () => {
    document.body.innerHTML = `
      <div id="preview-container">
        <iframe id="insights-preview"></iframe>
      </div>
    `;
    const container = document.querySelector<HTMLElement>('#preview-container')!;
    const iframe = document.querySelector<HTMLIFrameElement>('#insights-preview')!;

    expect(getInsightsPreviewContainer(document)).toBe(container);
    expect(container.style.position).toBe('relative');

    const iframeDoc = iframe.contentDocument!;
    Object.defineProperty(iframeDoc.body, 'scrollHeight', { configurable: true, value: 120 });
    Object.defineProperty(iframeDoc.body, 'offsetHeight', { configurable: true, value: 90 });
    Object.defineProperty(iframeDoc.documentElement, 'scrollHeight', { configurable: true, value: 110 });
    Object.defineProperty(iframeDoc.documentElement, 'offsetHeight', { configurable: true, value: 80 });

    adjustInsightsIframeHeight(iframe);

    expect(iframe.style.height).toBe('140px');
  });
});
