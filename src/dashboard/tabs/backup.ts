/**
 * @file backup.ts
 * @description 备份与恢复标签页初始化
 * @module dashboard/tabs
 */

import { initBackupActions, updateSyncStatus } from '../sidebar/actions';

export function initBackupTab(): void {
  const root = document.getElementById('tab-backup');
  if (!root) {
    return;
  }

  initBackupActions(root);
  updateSyncStatus();
}
