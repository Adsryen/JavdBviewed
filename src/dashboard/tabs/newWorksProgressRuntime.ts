export interface NewWorksProgressData {
  processed?: number;
  total?: number;
  identifiedTotal?: number;
  effectiveTotal?: number;
  actorName?: string;
  done?: boolean;
}

export interface NewWorksProgressRuntimeDeps {
  sendCancelMessage(): void;
  doc?: Document;
}

export interface NewWorksProgressMessageBus {
  onMessage: {
    addListener(listener: (message: any) => void): void;
    removeListener(listener: (message: any) => void): void;
  };
}

export function ensureNewWorksProgressUI(
  currentEl: HTMLElement | undefined,
  deps: NewWorksProgressRuntimeDeps,
): HTMLElement | undefined {
  const doc = deps.doc || document;
  if (currentEl && doc.body.contains(currentEl)) {
    return currentEl;
  }

  const host = doc.querySelector('.new-works-controls')
    || doc.getElementById('newWorksStatsContainer')
    || doc.getElementById('tab-new-works');
  if (!host) {
    return undefined;
  }

  const el = doc.createElement('div');
  el.id = 'newWorksProgress';
  el.style.cssText = 'margin:10px 0;padding:12px;border:1px dashed #999;border-radius:6px;background:rgba(0,0,0,0.03);font-size:13px;';
  el.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <i class="fas fa-tasks"></i>
                <span class="text">准备中...</span>
                <button id="newWorksCancelBtn" class="btn-secondary" style="margin-left:auto;">取消</button>
            </div>
            <div class="progress-bar-container" style="width:100%;height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
                <div class="progress-bar-fill" style="width:0%;height:100%;background:linear-gradient(90deg, #4caf50, #66bb6a);transition:width 0.3s ease;"></div>
            </div>
        `;
  host.appendChild(el);

  const cancelBtn = el.querySelector('#newWorksCancelBtn') as HTMLButtonElement | null;
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (cancelBtn.disabled) return;
      cancelBtn.disabled = true;
      cancelBtn.textContent = '取消中...';
      deps.sendCancelMessage();
    }, { once: true });
  }

  return el;
}

export function updateNewWorksProgressUI(progressEl: HTMLElement | undefined, data: NewWorksProgressData): void {
  if (!progressEl) return;

  const text = progressEl.querySelector('.text') as HTMLElement | null;
  const progressBar = progressEl.querySelector('.progress-bar-fill') as HTMLElement | null;
  if (!text) return;

  if (data.done) {
    text.textContent = '检查完成';
    if (progressBar) {
      progressBar.style.width = '100%';
    }
    return;
  }

  const processed = typeof data.processed === 'number' ? data.processed : undefined;
  const total = typeof data.total === 'number' ? data.total : undefined;
  const identifiedTotal = typeof data.identifiedTotal === 'number' ? data.identifiedTotal : undefined;
  const effectiveTotal = typeof data.effectiveTotal === 'number' ? data.effectiveTotal : undefined;
  const actor = data.actorName ? `，当前：${data.actorName}` : '';

  if (progressBar && processed !== undefined && total !== undefined && total > 0) {
    progressBar.style.width = `${Math.round((processed / total) * 100)}%`;
  }

  const segmentProgress = processed !== undefined && total !== undefined ? `进度 ${processed}/${total}` : '进行中';
  const segmentIdentified = identifiedTotal !== undefined ? `，已识别 ${identifiedTotal}` : '';
  const segmentEffective = effectiveTotal !== undefined ? `，有效 ${effectiveTotal}` : '';
  text.textContent = `${segmentProgress}${segmentIdentified}${segmentEffective}${actor}`;
}

export function hideNewWorksProgressUIAfter(
  progressEl: HTMLElement | undefined,
  ms: number,
  onRemoved: () => void,
  win: Window = window,
): void {
  if (!progressEl) return;
  win.setTimeout(() => {
    progressEl.remove();
    onRemoved();
  }, Math.max(0, ms));
}

export function attachNewWorksProgressListener(
  currentListener: ((message: any) => void) | undefined,
  onProgress: (data: NewWorksProgressData) => void,
  bus: NewWorksProgressMessageBus,
): (message: any) => void {
  detachNewWorksProgressListener(currentListener, bus);

  const handler = (message: any) => {
    try {
      if (message && message.type === 'new-works-progress') {
        const payload = message.payload || {};
        onProgress({
          processed: payload.processed,
          total: payload.total,
          identifiedTotal: payload.identifiedTotal,
          effectiveTotal: payload.effectiveTotal,
          actorName: payload.actorName,
        });
      }
    } catch {}
  };
  bus.onMessage.addListener(handler);
  return handler;
}

export function detachNewWorksProgressListener(
  listener: ((message: any) => void) | undefined,
  bus: NewWorksProgressMessageBus,
): undefined {
  if (listener) {
    try { bus.onMessage.removeListener(listener); } catch {}
  }
  return undefined;
}
