// src/dashboard/listeners/ui.ts
import { showMessage } from '../ui/toast';

export function bindUiListeners(): void {
  try {
    chrome.runtime.onMessage.addListener((message: any) => {
      if (message?.type === 'show-toast') {
        try { showMessage(message.message, message.toastType || 'info'); } catch {}
      }
    });
  } catch {}
}
