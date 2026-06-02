import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightsPreviewRuntime } from '../../src/dashboard/tabs/insights/previewRuntime';

describe('insights preview runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('writes raw html to preview iframe and updates layout state', () => {
    let rawHtml = '';
    let canSave: boolean | undefined;
    const adjustIframeHeight = vi.fn();
    const ensurePreviewCopyButton = vi.fn();

    document.body.innerHTML = `
      <div class="tab-section" data-tab-id="insights">
        <div class="insights-grid"></div>
        <iframe id="insights-preview"></iframe>
      </div>
    `;

    const runtime = createInsightsPreviewRuntime({
      documentRef: document,
      setCurrentPreviewRawHtml: value => { rawHtml = value; },
      getCurrentPreviewRawHtml: () => rawHtml,
      setCanSaveReport: value => { canSave = value; },
      preparePreviewHtml: html => `prepared:${html}`,
      adjustIframeHeight,
      ensurePreviewCopyButton,
    });

    expect(runtime.writePreview('<html>report</html>', { canSave: true })).toBe(true);

    const iframe = document.querySelector<HTMLIFrameElement>('#insights-preview')!;
    const grid = document.querySelector<HTMLElement>('.insights-grid')!;

    expect(rawHtml).toBe('<html>report</html>');
    expect(iframe.srcdoc).toBe('prepared:<html>report</html>');
    expect(adjustIframeHeight).toHaveBeenCalledWith(iframe);
    expect(ensurePreviewCopyButton).toHaveBeenCalled();
    expect(grid.style.gridTemplateColumns).toBe('0.9fr 1.5fr');
    expect(canSave).toBe(true);
  });

  it('refreshes preview from stored raw html without changing save state', () => {
    let rawHtml = '<html>stored</html>';
    const setCanSaveReport = vi.fn();
    const adjustIframeHeight = vi.fn();

    document.body.innerHTML = '<iframe id="insights-preview"></iframe>';

    const runtime = createInsightsPreviewRuntime({
      documentRef: document,
      setCurrentPreviewRawHtml: value => { rawHtml = value; },
      getCurrentPreviewRawHtml: () => rawHtml,
      setCanSaveReport,
      preparePreviewHtml: html => `theme:${html}`,
      adjustIframeHeight,
      ensurePreviewCopyButton: vi.fn(),
    });

    expect(runtime.refreshPreviewFromRaw()).toBe(true);

    const iframe = document.querySelector<HTMLIFrameElement>('#insights-preview')!;
    expect(iframe.srcdoc).toBe('theme:<html>stored</html>');
    expect(adjustIframeHeight).toHaveBeenCalledWith(iframe);
    expect(setCanSaveReport).not.toHaveBeenCalled();
  });
});
