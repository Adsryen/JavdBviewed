// src/dashboard/listeners/ui.ts
import { showMessage } from '../ui/toast';

export function bindUiListeners(): void {
  try {
    chrome.runtime.onMessage.addListener((message: any) => {
      if (message?.type === 'show-toast') {
        try { showMessage(message.message, message.toastType || 'info'); } catch {}
      }
      // 后台广播：115 用户信息已在后台刷新，通知 dashboard 更新 UI
      if (message?.type === 'drive115.refresh_user_info') {
        try { window.dispatchEvent(new CustomEvent('drive115:refreshUserInfo')); } catch {}
      }
    });
  } catch {}
}
