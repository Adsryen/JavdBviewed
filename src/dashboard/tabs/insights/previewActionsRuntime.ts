interface CreateInsightsPreviewActionsRuntimeOptions {
  documentRef?: Document;
  windowRef?: Window;
  getPreviewContainer: () => HTMLElement | null;
  getCanSaveReport: () => boolean;
  onSaveCurrentAsMonthly: () => void;
  inlineAssets: (html: string) => Promise<string>;
  showMessage?: (message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success') => void;
}

export interface InsightsPreviewActionsRuntime {
  ensurePreviewCopyButton: () => HTMLDivElement | null;
  copyPreviewHtml: () => Promise<void>;
}

const WRAP_ID = 'insights-preview-actions';
const COPY_ID = 'insights-preview-copy';
const SAVE_ID = 'insights-preview-save';
const REPOS_KEY = '__insights_preview_actions_repos__';

export function createInsightsPreviewActionsRuntime(
  options: CreateInsightsPreviewActionsRuntimeOptions,
): InsightsPreviewActionsRuntime {
  const doc = options.documentRef ?? document;
  const win = options.windowRef ?? window;

  function showMessage(message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success'): void {
    try { options.showMessage?.(message, type); } catch {}
  }

  function getPreviewIframe(): HTMLIFrameElement | null {
    return doc.getElementById('insights-preview') as HTMLIFrameElement | null;
  }

  function positionActions(wrap: HTMLDivElement): void {
    try {
      const iframe = getPreviewIframe();
      if (!iframe) return;
      wrap.style.top = `${(iframe.offsetTop || 0) + 8}px`;
    } catch {}
  }

  function bindResizePosition(wrap: HTMLDivElement): void {
    try {
      const wrapWithState = wrap as HTMLDivElement & Record<string, boolean>;
      if (wrapWithState[REPOS_KEY]) return;
      const onResize = () => positionActions(wrap);
      win.addEventListener('resize', onResize);
      wrapWithState[REPOS_KEY] = true;
    } catch {}
  }

  function createWrap(container: HTMLElement): HTMLDivElement {
    const wrap = doc.createElement('div');
    wrap.id = WRAP_ID;
    try {
      wrap.style.position = 'absolute';
      wrap.style.right = '8px';
      wrap.style.top = '8px';
      wrap.style.zIndex = '6';
      wrap.style.display = 'flex';
      wrap.style.gap = '8px';
    } catch {}
    container.appendChild(wrap);
    return wrap;
  }

  function ensureCopyButton(wrap: HTMLDivElement): void {
    let copyBtn = doc.getElementById(COPY_ID) as HTMLButtonElement | null;
    if (copyBtn) return;
    copyBtn = doc.createElement('button');
    copyBtn.id = COPY_ID;
    copyBtn.className = 'preview-copy-btn';
    copyBtn.title = '复制预览HTML';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>&nbsp;复制预览';
    try {
      copyBtn.style.padding = '6px 10px';
      copyBtn.style.borderRadius = '999px';
      copyBtn.style.background = '#fff';
      copyBtn.style.border = '1px solid #e5e7eb';
      copyBtn.style.color = '#334155';
      copyBtn.style.display = 'flex';
      copyBtn.style.alignItems = 'center';
      copyBtn.style.justifyContent = 'center';
      copyBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
      copyBtn.style.cursor = 'pointer';
      copyBtn.style.fontSize = '12px';
    } catch {}
    copyBtn.addEventListener('click', copyPreviewHtml);
    wrap.appendChild(copyBtn);
  }

  function ensureSaveButton(wrap: HTMLDivElement): void {
    let saveBtn = doc.getElementById(SAVE_ID) as HTMLButtonElement | null;
    if (!saveBtn) {
      saveBtn = doc.createElement('button');
      saveBtn.id = SAVE_ID;
      saveBtn.className = 'preview-save-btn';
      saveBtn.title = '保存为月报';
      saveBtn.innerHTML = '<i class="fas fa-save"></i>&nbsp;保存为月报';
      try {
        saveBtn.style.padding = '6px 10px';
        saveBtn.style.borderRadius = '999px';
        saveBtn.style.background = '#2563eb';
        saveBtn.style.border = '1px solid #1d4ed8';
        saveBtn.style.color = '#fff';
        saveBtn.style.display = 'flex';
        saveBtn.style.alignItems = 'center';
        saveBtn.style.justifyContent = 'center';
        saveBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
        saveBtn.style.cursor = 'pointer';
        saveBtn.style.fontSize = '12px';
      } catch {}
      saveBtn.onclick = () => {
        if (options.getCanSaveReport()) options.onSaveCurrentAsMonthly();
      };
      wrap.appendChild(saveBtn);
    }
    syncSaveButtonState(saveBtn);
  }

  function syncSaveButtonState(saveBtn: HTMLButtonElement): void {
    try {
      const canSave = options.getCanSaveReport();
      saveBtn.disabled = !canSave;
      saveBtn.style.opacity = canSave ? '1' : '0.6';
      saveBtn.style.cursor = canSave ? 'pointer' : 'not-allowed';
    } catch {}
  }

  function ensurePreviewCopyButton(): HTMLDivElement | null {
    try {
      const container = options.getPreviewContainer();
      if (!container) return null;

      try {
        const style = getComputedStyle(container);
        if (style.position === 'static') container.style.position = 'relative';
      } catch {}

      let wrap = doc.getElementById(WRAP_ID) as HTMLDivElement | null;
      if (!wrap) wrap = createWrap(container);
      positionActions(wrap);
      bindResizePosition(wrap);
      ensureCopyButton(wrap);
      ensureSaveButton(wrap);
      return wrap;
    } catch {
      return null;
    }
  }

  async function copyPreviewHtml(): Promise<void> {
    try {
      const iframe = getPreviewIframe();
      if (!iframe) return;
      const html = iframe.srcdoc || '';
      if (!html) {
        showMessage('暂无预览内容可复制', 'info');
        return;
      }
      const finalHtml = await options.inlineAssets(html);
      try {
        const nav = doc.defaultView?.navigator ?? navigator;
        if (nav.clipboard && nav.clipboard.writeText) {
          await nav.clipboard.writeText(finalHtml);
        } else {
          const textarea = doc.createElement('textarea');
          textarea.value = finalHtml;
          textarea.style.position = 'fixed';
          textarea.style.left = '-1000px';
          doc.body.appendChild(textarea);
          textarea.select();
          doc.execCommand('copy');
          textarea.remove();
        }
        showMessage('预览HTML已复制', 'info');
      } catch (error) {
        showMessage(`复制失败：${getErrorMessage(error)}`, 'error');
      }
    } catch {}
  }

  return {
    ensurePreviewCopyButton,
    copyPreviewHtml,
  };
}

function getErrorMessage(error: unknown): string {
  try { return error instanceof Error ? error.message : String(error || ''); } catch { return ''; }
}
