import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightsPreviewActionsRuntime } from '../../src/dashboard/tabs/insights/previewActionsRuntime';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('insights preview actions runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('creates copy and save actions, updates save state, and copies inlined html', async () => {
    let canSaveReport = false;
    const inlineAssets = vi.fn(async (html: string) => `inlined:${html}`);
    const showMessage = vi.fn();
    const onSaveCurrentAsMonthly = vi.fn();
    const writeText = vi.fn(async (_text: string) => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    document.body.innerHTML = `
      <div id="preview-container" style="position: static;">
        <iframe id="insights-preview"></iframe>
      </div>
    `;
    const iframe = document.querySelector<HTMLIFrameElement>('#insights-preview')!;
    iframe.srcdoc = '<html>report</html>';

    const runtime = createInsightsPreviewActionsRuntime({
      documentRef: document,
      windowRef: window,
      getPreviewContainer: () => document.querySelector('#preview-container'),
      getCanSaveReport: () => canSaveReport,
      onSaveCurrentAsMonthly,
      inlineAssets,
      showMessage,
    });

    const wrap = runtime.ensurePreviewCopyButton();

    expect(wrap?.id).toBe('insights-preview-actions');
    expect(document.querySelectorAll('#insights-preview-actions').length).toBe(1);
    expect((document.querySelector('#preview-container') as HTMLElement).style.position).toBe('relative');

    const saveButton = document.querySelector<HTMLButtonElement>('#insights-preview-save')!;
    expect(saveButton.disabled).toBe(true);
    saveButton.click();
    expect(onSaveCurrentAsMonthly).not.toHaveBeenCalled();

    canSaveReport = true;
    runtime.ensurePreviewCopyButton();
    expect(document.querySelectorAll('#insights-preview-actions').length).toBe(1);
    expect(saveButton.disabled).toBe(false);
    saveButton.click();
    expect(onSaveCurrentAsMonthly).toHaveBeenCalledTimes(1);

    document.querySelector<HTMLButtonElement>('#insights-preview-copy')?.click();
    await flushPromises();

    expect(inlineAssets).toHaveBeenCalledWith('<html>report</html>');
    expect(writeText).toHaveBeenCalledWith('inlined:<html>report</html>');
    expect(showMessage).toHaveBeenCalledWith('预览HTML已复制', 'info');
  });
});
