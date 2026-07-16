interface CreateInsightsLoadingStatusRuntimeOptions {
  documentRef?: Document;
  getPreviewContainer: () => HTMLElement | null;
}

export interface InsightsLoadingStatusRuntime {
  ensureLoadingStyles: () => void;
  setActionsDisabled: (disabled: boolean) => void;
  showLoading: (show: boolean) => void;
  showStatus: (message: string, kind?: 'info' | 'error') => void;
  clearStatus: () => void;
}

const STYLE_ID = 'insights-loading-style';
const OVERLAY_ID = 'insights-loading-overlay';
const STATUS_ID = 'insights-status';
const ACTION_BUTTON_IDS = [
  'insights-generate',
  'insights-export',
  'insights-export-json',
  'insights-refresh-history',
  'insights-delete-selected',
  'insights-preview-save',
  'insights-preview-copy',
];

export function createInsightsLoadingStatusRuntime(
  options: CreateInsightsLoadingStatusRuntimeOptions,
): InsightsLoadingStatusRuntime {
  const doc = options.documentRef ?? document;

  function ensureLoadingStyles(): void {
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
  @keyframes insights-spin { to { transform: rotate(360deg); } }
  `;
    doc.head.appendChild(style);
  }

  function setActionsDisabled(disabled: boolean): void {
    try {
      for (const id of ACTION_BUTTON_IDS) {
        const btn = doc.getElementById(id) as HTMLButtonElement | null;
        if (btn) btn.disabled = disabled;
      }
    } catch {}
  }

  function showLoading(show: boolean): void {
    try {
      const container = options.getPreviewContainer();
      if (!container) return;
      ensureLoadingStyles();

      let overlay = doc.getElementById(OVERLAY_ID) as HTMLDivElement | null;
      if (show) {
        setActionsDisabled(true);
        if (!overlay) {
          overlay = doc.createElement('div');
          overlay.id = OVERLAY_ID;
          overlay.style.position = 'absolute';
          overlay.style.inset = '0';
          overlay.style.display = 'flex';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';
          overlay.style.background = 'rgba(255,255,255,0.6)';
          overlay.style.backdropFilter = 'blur(1px)';
          overlay.style.zIndex = '5';
          overlay.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px; color:#334155; font-size:14px;">
            <div style="width:28px; height:28px; border:3px solid #cbd5e1; border-top-color:#3b82f6; border-radius:50%; animation: insights-spin 0.9s linear infinite;"></div>
            <span>生成中…</span>
          </div>
        `;
          container.appendChild(overlay);
        } else {
          overlay.style.display = 'flex';
        }
      } else {
        setActionsDisabled(false);
        if (overlay) overlay.style.display = 'none';
      }
    } catch {}
  }

  function showStatus(message: string, kind: 'info' | 'error' = 'info'): void {
    try {
      const container = options.getPreviewContainer();
      if (!container) return;
      let bar = doc.getElementById(STATUS_ID) as HTMLDivElement | null;
      if (!bar) {
        bar = doc.createElement('div');
        bar.id = STATUS_ID;
        bar.style.margin = '6px 0';
        bar.style.padding = '8px 10px';
        bar.style.borderRadius = '6px';
        bar.style.fontSize = '12px';
        const iframe = doc.getElementById('insights-preview');
        container.insertBefore(bar, iframe || null);
      }
      if (kind === 'error') {
        bar.style.background = '#fef2f2';
        bar.style.color = '#991b1b';
        bar.style.border = '1px solid #fecaca';
      } else {
        bar.style.background = '#eff6ff';
        bar.style.color = '#1e3a8a';
        bar.style.border = '1px solid #bfdbfe';
      }
      bar.textContent = message;
      bar.style.display = 'block';
    } catch {}
  }

  function clearStatus(): void {
    const bar = doc.getElementById(STATUS_ID) as HTMLDivElement | null;
    if (bar) bar.style.display = 'none';
  }

  return {
    ensureLoadingStyles,
    setActionsDisabled,
    showLoading,
    showStatus,
    clearStatus,
  };
}
