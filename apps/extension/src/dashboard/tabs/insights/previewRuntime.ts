import { prepareInsightsPreviewHtml } from './reportPreviewModel';

interface WritePreviewOptions {
  canSave?: boolean;
  ensureActions?: boolean;
  updateGrid?: boolean;
}

interface CreateInsightsPreviewRuntimeOptions {
  documentRef?: Document;
  setCurrentPreviewRawHtml: (html: string) => void;
  getCurrentPreviewRawHtml: () => string;
  setCanSaveReport?: (value: boolean) => void;
  preparePreviewHtml?: (html: string) => string;
  adjustIframeHeight: (iframe: HTMLIFrameElement) => void;
  ensurePreviewCopyButton?: () => unknown;
}

export function createInsightsPreviewRuntime(options: CreateInsightsPreviewRuntimeOptions) {
  const documentRef = options.documentRef || document;
  const preparePreviewHtml = options.preparePreviewHtml || prepareInsightsPreviewHtml;

  function getPreviewIframe(): HTMLIFrameElement | null {
    return documentRef.getElementById('insights-preview') as HTMLIFrameElement | null;
  }

  function applyGridLayout(): void {
    try {
      const grid = documentRef.querySelector('.tab-section[data-tab-id="insights"] .insights-grid') as HTMLElement | null;
      if (grid) grid.style.gridTemplateColumns = '0.9fr 1.5fr';
    } catch {}
  }

  function writePreparedHtml(iframe: HTMLIFrameElement, html: string): void {
    iframe.srcdoc = preparePreviewHtml(html);
    options.adjustIframeHeight(iframe);
  }

  function writePreview(rawHtml: string, writeOptions: WritePreviewOptions = {}): boolean {
    const iframe = getPreviewIframe();
    if (!iframe) return false;

    options.setCurrentPreviewRawHtml(rawHtml);
    writePreparedHtml(iframe, rawHtml);

    if (typeof writeOptions.canSave === 'boolean') {
      options.setCanSaveReport?.(writeOptions.canSave);
    }
    if (writeOptions.ensureActions !== false) {
      try { options.ensurePreviewCopyButton?.(); } catch {}
    }
    if (writeOptions.updateGrid !== false) {
      applyGridLayout();
    }

    return true;
  }

  function refreshPreviewFromRaw(): boolean {
    const iframe = getPreviewIframe();
    const rawHtml = options.getCurrentPreviewRawHtml();
    if (!iframe || !rawHtml) return false;

    writePreparedHtml(iframe, rawHtml);
    return true;
  }

  return {
    writePreview,
    refreshPreviewFromRaw,
  };
}
