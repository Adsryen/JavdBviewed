// src/dashboard/modals/init.ts
// 常驻模态挂载与事件广播

import { ensureMounted } from '../loaders/partialsLoader';

export async function ensureModalsMounted(): Promise<void> {
  try {
    const haveInlineModals = !!document.getElementById('confirmationModal')
      || !!document.getElementById('smartRestoreModal')
      || !!document.getElementById('webdavRestoreModal')
      || !!document.getElementById('conflictResolutionModal')
      || !!document.getElementById('restoreResultModal')
      || !!document.getElementById('dataViewModal')
      || !!document.getElementById('import-modal')
      || !!document.getElementById('migration-modal')
      || !!document.getElementById('data-check-modal')
      || !!document.getElementById('helpPanel');

    if (!haveInlineModals) {
      await ensureMounted('#dashboard-modals-root', 'modals/dashboard-modals.html');
      try { window.dispatchEvent(new CustomEvent('modals:mounted')); } catch {}
    } else {
      // 即便内联存在，也广播一次，方便监听方完成初始化
      try { window.dispatchEvent(new CustomEvent('modals:mounted')); } catch {}
    }
  } catch {}
}
