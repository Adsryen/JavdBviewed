interface ConfirmDialogOptions {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
}

interface CreateInsightsConfirmRuntimeOptions {
  documentRef?: Document;
}

export function createInsightsConfirmRuntime(options: CreateInsightsConfirmRuntimeOptions = {}) {
  const documentRef = options.documentRef || document;

  function confirmDialog(opts: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const overlayId = 'insights-confirm-overlay';
        let overlay = documentRef.getElementById(overlayId) as HTMLDivElement | null;
        if (overlay) overlay.remove();

        overlay = documentRef.createElement('div');
        overlay.id = overlayId;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'var(--surface-overlay)';
        overlay.style.backdropFilter = 'blur(2px)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        const modal = documentRef.createElement('div');
        modal.style.width = '520px';
        modal.style.maxWidth = '95%';
        modal.style.background = 'var(--surface-primary)';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = 'var(--shadow-xl)';
        modal.style.border = '1px solid var(--border-primary)';
        modal.style.padding = '14px 16px';

        const title = documentRef.createElement('div');
        title.textContent = opts.title || '确认';
        title.style.fontWeight = '700';
        title.style.marginBottom = '8px';
        title.style.color = 'var(--text-primary)';

        const message = documentRef.createElement('div');
        message.textContent = opts.message;
        message.style.color = 'var(--text-primary)';
        message.style.fontSize = '13px';
        message.style.margin = '6px 0 12px';

        const actions = documentRef.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';
        actions.style.gap = '8px';

        const cancel = documentRef.createElement('button');
        cancel.textContent = opts.cancelText || '取消';
        cancel.style.padding = '6px 12px';
        cancel.style.fontSize = '12px';
        cancel.style.background = 'var(--surface-secondary)';
        cancel.style.border = '1px solid var(--border-primary)';
        cancel.style.color = 'var(--text-primary)';
        cancel.style.borderRadius = '4px';

        const ok = documentRef.createElement('button');
        ok.textContent = opts.okText || '确认';
        ok.style.padding = '6px 12px';
        ok.style.fontSize = '12px';
        ok.style.background = 'var(--primary)';
        ok.style.border = '1px solid var(--primary-hover)';
        ok.style.color = 'var(--text-inverse)';
        ok.style.borderRadius = '4px';

        cancel.onclick = () => { overlay?.remove(); resolve(false); };
        ok.onclick = () => { overlay?.remove(); resolve(true); };
        overlay.onclick = (event) => { if (event.target === overlay) { overlay?.remove(); resolve(false); } };

        actions.appendChild(cancel);
        actions.appendChild(ok);
        modal.appendChild(title);
        modal.appendChild(message);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        documentRef.body.appendChild(overlay);
      } catch {
        resolve(true);
      }
    });
  }

  return { confirmDialog };
}
