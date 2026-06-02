import { beforeEach, describe, expect, it } from 'vitest';
import { createInsightsLoadingStatusRuntime } from '../../src/dashboard/tabs/insights/loadingStatusRuntime';

describe('insights loading status runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('toggles loading overlay, action disabled state, and status bar', () => {
    document.body.innerHTML = `
      <button id="insights-generate"></button>
      <button id="insights-export"></button>
      <button id="insights-preview-save"></button>
      <div id="preview-container">
        <iframe id="insights-preview"></iframe>
      </div>
    `;
    const container = document.querySelector<HTMLElement>('#preview-container')!;

    const runtime = createInsightsLoadingStatusRuntime({
      documentRef: document,
      getPreviewContainer: () => container,
    });

    runtime.showLoading(true);

    expect(document.querySelector('#insights-loading-style')).toBeTruthy();
    expect(document.querySelector<HTMLElement>('#insights-loading-overlay')?.style.display).toBe('flex');
    expect(document.querySelector<HTMLButtonElement>('#insights-generate')?.disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#insights-export')?.disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#insights-preview-save')?.disabled).toBe(true);

    runtime.showStatus('生成失败', 'error');
    const status = document.querySelector<HTMLElement>('#insights-status')!;
    expect(status.textContent).toBe('生成失败');
    expect(status.style.display).toBe('block');
    expect(status.nextElementSibling?.id).toBe('insights-preview');

    runtime.clearStatus();
    expect(status.style.display).toBe('none');

    runtime.showLoading(false);
    expect(document.querySelector<HTMLElement>('#insights-loading-overlay')?.style.display).toBe('none');
    expect(document.querySelector<HTMLButtonElement>('#insights-generate')?.disabled).toBe(false);
    expect(document.querySelector<HTMLButtonElement>('#insights-export')?.disabled).toBe(false);
    expect(document.querySelector<HTMLButtonElement>('#insights-preview-save')?.disabled).toBe(false);
  });
});
