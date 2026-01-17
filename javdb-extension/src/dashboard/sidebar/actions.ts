// @ts-nocheck
import { STATE } from '../state';
import { logAsync } from '../logger';
import { showMessage } from '../ui/toast';
import { setValue, getValue } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/config';
import { showWebDAVRestoreModal } from '../webdavRestore';
import { showImportModal } from '../import';

const WEBDAV_WARN_LAST_AT_KEY = 'webdav-warn-last-at';
const WEBDAV_WARN_THROTTLE_MS = 6 * 60 * 60 * 1000;

function updateSyncDisplay(lastSyncTimeElement: HTMLSpanElement, syncIndicator: HTMLDivElement, lastSync: string, warningDays: number): void {
  if (lastSync) {
    const syncDate = new Date(lastSync);
    const now = new Date();
    const rawDiffMs = now.getTime() - syncDate.getTime();
    const diffMs = Number.isFinite(rawDiffMs) ? Math.max(0, rawDiffMs) : 0;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    let timeText = '';
    if (diffDays > 0) timeText = `${diffDays}天前`;
    else if (diffHours > 0) timeText = `${diffHours}小时前`;
    else { const diffMinutes = Math.floor(diffMs / (1000 * 60)); timeText = diffMinutes > 0 ? `${diffMinutes}分钟前` : '刚刚'; }
    lastSyncTimeElement.textContent = timeText;
    lastSyncTimeElement.title = syncDate.toLocaleString('zh-CN');
    syncIndicator.className = 'sync-indicator';
    if (warningDays > 0 && diffDays > warningDays) {
      syncIndicator.classList.add('error');
      (syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement | null)!.textContent = '需要同步';
    } else if (diffDays > 1) {
      syncIndicator.classList.add('synced');
      (syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement | null)!.textContent = '已同步';
    } else {
      syncIndicator.classList.add('synced');
      (syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement | null)!.textContent = '最新';
    }
  } else {
    lastSyncTimeElement.textContent = '从未';
    lastSyncTimeElement.title = '尚未进行过同步';
    syncIndicator.className = 'sync-indicator';
    const text = syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement | null;
    if (text) text.textContent = '未同步';
    if (warningDays > 0) {
      syncIndicator.classList.add('error');
    }
  }
}

async function maybeWarnStaleBackup(diffDays: number, warningDays: number): Promise<void> {
  try {
    if (!(warningDays > 0 && diffDays > warningDays)) return;
    const now = Date.now();
    const lastAt = await getValue<number>(WEBDAV_WARN_LAST_AT_KEY, 0);
    if (typeof lastAt === 'number' && lastAt > 0 && lastAt <= now && now - lastAt < WEBDAV_WARN_THROTTLE_MS) return;
    showMessage(`⚠️ WebDAV 已超过 ${diffDays} 天未备份，建议尽快同步`, 'warn');
    await setValue(WEBDAV_WARN_LAST_AT_KEY, now);
  } catch {}
}

export function updateSyncStatus(): void {
  try {
    const lastSyncTimeElement = document.getElementById('lastSyncTime') as HTMLSpanElement;
    const lastSyncTimeSettings = document.getElementById('last-sync-time') as HTMLSpanElement;
    const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;
    const webdavSettings = STATE.settings?.webdav || {};
    const lastSync = webdavSettings.lastSync || '';
    const warningDays = Number(webdavSettings.warningDays ?? 7);
    if (lastSyncTimeElement && syncIndicator) {
      updateSyncDisplay(lastSyncTimeElement, syncIndicator, lastSync, Number.isFinite(warningDays) ? warningDays : 7);
    }
    if (lastSyncTimeSettings) {
      lastSyncTimeSettings.textContent = lastSync ? new Date(lastSync).toLocaleString('zh-CN') : '从未';
    }
    if (lastSync && Number.isFinite(warningDays) && warningDays > 0) {
      const diffMs = Date.now() - new Date(lastSync).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      maybeWarnStaleBackup(diffDays, warningDays).catch(() => {});
    }
  } catch (error) {
    console.error('更新同步状态时出错:', error);
    const lastSyncTimeElement = document.getElementById('lastSyncTime') as HTMLSpanElement;
    const lastSyncTimeSettings = document.getElementById('last-sync-time') as HTMLSpanElement;
    const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;
    if (lastSyncTimeElement) lastSyncTimeElement.textContent = '从未';
    if (lastSyncTimeSettings) lastSyncTimeSettings.textContent = '从未';
    if (syncIndicator) {
      syncIndicator.className = 'sync-indicator';
      const statusText = syncIndicator.querySelector('.sync-status-text');
      if (statusText) (statusText as HTMLSpanElement).textContent = '未同步';
    }
  }
}

export function setSyncingStatus(isUploading: boolean = false): void {
  const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;
  if (!syncIndicator) return;
  syncIndicator.className = 'sync-indicator syncing';
  const statusText = syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement | null;
  if (statusText) statusText.textContent = isUploading ? '上传中...' : '同步中...';
}

export function initSidebarToggle(): void {
  const SIDEBAR_STATE_KEY = 'sidebar-collapsed';
  const sidebar = document.querySelector('.sidebar') as HTMLElement;
  const toggleBtn = document.getElementById('sidebarToggleBtn') as HTMLButtonElement;
  if (!sidebar || !toggleBtn) return;
  const restoreSidebarState = async () => {
    try {
      const isCollapsed = await getValue(SIDEBAR_STATE_KEY, false);
      if (isCollapsed) {
        sidebar.classList.add('collapsed');
        const icon = toggleBtn.querySelector('i');
        if (icon) (icon as HTMLElement).style.transform = 'rotate(180deg)';
      }
    } catch {}
  };
  const saveSidebarState = async (isCollapsed: boolean) => { try { await setValue(SIDEBAR_STATE_KEY, isCollapsed); } catch {} };
  const toggleSidebar = () => {
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (isCollapsed) { sidebar.classList.remove('collapsed'); saveSidebarState(false); }
    else { sidebar.classList.add('collapsed'); saveSidebarState(true); }
    const icon = toggleBtn.querySelector('i');
    if (icon) (icon as HTMLElement).style.transform = sidebar.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0deg)';
  };
  toggleBtn.addEventListener('click', toggleSidebar);
  restoreSidebarState();
}

export function initSidebarActions(): void {
  initSidebarToggle();
  const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
  const syncNowBtn = document.getElementById('syncNow') as HTMLButtonElement;
  const syncDownBtn = document.getElementById('syncDown') as HTMLButtonElement;
  const importFileInput = document.getElementById('importFile') as HTMLInputElement;

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      logAsync('INFO', '用户点击了“导出到本地”按钮');
      const userProfile = await getValue(STORAGE_KEYS.USER_PROFILE, null);
      const actorRecords = await getValue(STORAGE_KEYS.ACTOR_RECORDS, {});
      const dataToExport = {
        settings: STATE.settings,
        data: STATE.records.reduce((acc: any, record: any) => { acc[record.id] = record; return acc; }, {} as Record<string, any>),
        userProfile,
        actorRecords
      };
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showMessage('数据导出成功（包含账号信息与演员库）', 'success');
      logAsync('INFO', '本地数据导出成功（包含账号信息与演员库）');
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', (event) => {
      logAsync('INFO', '用户选择了本地文件进行导入');
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) { logAsync('WARN', '用户取消了文件选择'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') showImportModal(text);
        else { showMessage('Failed to read file content.', 'error'); logAsync('ERROR', '无法读取文件内容，内容非字符串'); }
      };
      reader.onerror = () => { showMessage(`Error reading file: ${reader.error}`, 'error'); logAsync('ERROR', '读取导入文件时发生错误', { error: reader.error as any }); };
      reader.readAsText(file);
      importFileInput.value = '';
    });
  }

  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', () => {
      syncNowBtn.textContent = '正在上传...';
      syncNowBtn.disabled = true;
      setSyncingStatus(true);
      logAsync('INFO', '用户点击“立即上传至云端”，开始上传数据');
      chrome.runtime.sendMessage({ type: 'webdav-upload' }, (response) => {
        syncNowBtn.textContent = '立即上传至云端';
        syncNowBtn.disabled = false;
        if (response?.success) { showMessage('数据已成功上传至云端', 'success'); logAsync('INFO', '数据成功上传至云端'); setTimeout(() => updateSyncStatus(), 500); }
        else { showMessage(`上传失败: ${response?.error}`, 'error'); logAsync('ERROR', '数据上传至云端失败', { error: response?.error }); setTimeout(() => updateSyncStatus(), 500); }
      });
    });
  }

  if (syncDownBtn) {
    syncDownBtn.addEventListener('click', () => { logAsync('INFO', '用户点击“从云端恢复”，打开恢复弹窗'); showWebDAVRestoreModal(); });
  }
}
