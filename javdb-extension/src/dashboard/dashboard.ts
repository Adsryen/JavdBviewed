// @ts-nocheck

import { initializeGlobalState, STATE } from './state';
import { initRecordsTab } from './tabs/records';
import { initSettingsTab } from './tabs/settings';
import { initAdvancedSettingsTab } from './tabs/advanced';
import { initLogsTab } from './tabs/logs';
import { initModal, showImportModal, handleFileRestoreClick } from './import';
import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import { VIDEO_STATUS } from '../utils/config';

document.addEventListener('DOMContentLoaded', async () => {
    await initializeGlobalState();
    initTabs();
    initRecordsTab();
    initSettingsTab();
    initAdvancedSettingsTab();
    initLogsTab();
    initSidebarActions();
    initStatsOverview();
    initInfoContainer();
    initModal();
});

function initTabs(): void {
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');

    const switchTab = (tabButton: Element | null) => {
        if (!tabButton) return;
        const tabId = tabButton.getAttribute('data-tab');
        if (!tabId) return;

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tabButton.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');

        if (history.pushState) {
            history.pushState(null, '', `#${tabId}`);
        } else {
            location.hash = `#${tabId}`;
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab);
            if (tab.getAttribute('data-tab') === 'tab-logs') {
                const refreshButton = document.getElementById('refresh-logs-button') as HTMLButtonElement;
                if (refreshButton) {
                    refreshButton.click();
                }
            }
        });
    });

    const currentHash = window.location.hash.substring(1) || 'tab-records';
    const targetTab = document.querySelector(`.tab-link[data-tab="${currentHash}"]`);
    switchTab(targetTab || tabs[0]);
}

function initStatsOverview(): void {
    const container = document.getElementById('stats-overview');
    if (!container) return;

    const totalRecords = STATE.records.length;
    const viewedCount = STATE.records.filter(r => r.status === VIDEO_STATUS.VIEWED).length;
    const wantCount = STATE.records.filter(r => r.status === VIDEO_STATUS.WANT).length;
    const browsedCount = STATE.records.filter(r => r.status === VIDEO_STATUS.BROWSED).length;

    container.innerHTML = `
        <div data-stat="total">
            <span class="stat-value">${totalRecords}</span>
            <span class="stat-label">总记录</span>
        </div>
        <div data-stat="viewed">
            <span class="stat-value">${viewedCount}</span>
            <span class="stat-label">已观看</span>
        </div>
        <div data-stat="browsed">
            <span class="stat-value">${browsedCount}</span>
            <span class="stat-label">已浏览</span>
        </div>
        <div data-stat="want">
            <span class="stat-value">${wantCount}</span>
            <span class="stat-label">想看</span>
        </div>
    `;
}

function initInfoContainer(): void {
    const infoContainer = document.getElementById('infoContainer');
    if (!infoContainer) return;

    const version = import.meta.env.VITE_APP_VERSION || 'N/A';
    const versionState = import.meta.env.VITE_APP_VERSION_STATE || 'unknown';

    const getStateTitle = (state: string): string => {
        switch (state) {
            case 'clean':
                return '此版本基于一个干净的、已完全提交的 Git 工作区构建。';
            case 'dev':
                return '此版本包含已暂存但尚未提交的更改 (dev/staged)。';
            case 'dirty':
                return '警告：此版本包含未跟踪或未暂存的本地修改 (dirty)！';
            default:
                return '无法确定此版本的构建状态。';
        }
    };

    infoContainer.innerHTML = `
        <div class="info-item">
            <span class="info-label">Version:</span>
            <span class="info-value version-state-${versionState}" title="${getStateTitle(versionState)}">${version}</span>
        </div>
    `;
}

function initSidebarActions(): void {
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    const syncDownBtn = document.getElementById('syncDown') as HTMLButtonElement;
    const fileListContainer = document.getElementById('fileListContainer') as HTMLDivElement;
    const fileList = document.getElementById('fileList') as HTMLUListElement;
    const clearAllBtn = document.getElementById('clearAllBtn') as HTMLButtonElement;

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showConfirmationModal({
                title: '确认清空所有本地记录',
                message: '您确定要清空所有本地记录吗？此操作不可撤销，且无法通过 WebDAV 恢复！',
                onConfirm: () => {
                    logAsync('INFO', '用户确认清空所有本地记录。');
                    chrome.runtime.sendMessage({ type: 'clear-all-records' }, response => {
                        if (response?.success) {
                            showMessage('所有本地记录已成功清空。', 'success');
                            logAsync('INFO', '所有本地记录已被成功清空。');
                            // Refresh the page or relevant parts to reflect the change
                            location.reload(); 
                        } else {
                            showMessage('清空记录失败，请稍后重试。', 'error');
                            logAsync('ERROR', '清空所有本地记录时发生错误。', { error: response.error });
                        }
                    });
                },
                onCancel: () => {
                    logAsync('INFO', '用户取消了清空所有本地记录的操作。');
                }
            });
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            logAsync('INFO', '用户点击了“导出到本地”按钮。');
            const dataToExport = {
                settings: STATE.settings,
                data: STATE.records.reduce((acc, record) => {
                    acc[record.id] = record;
                    return acc;
                }, {} as Record<string, VideoRecord>)
            };
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            showMessage('Data exported successfully.', 'success');
            logAsync('INFO', '本地数据导出成功。');
        });
    }
    
    const importFileInput = document.getElementById('importFile') as HTMLInputElement;

    if (importFileInput) {
        importFileInput.addEventListener('change', (event) => {
            logAsync('INFO', '用户选择了本地文件进行导入。');
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                logAsync('WARN', '用户取消了文件选择。');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    showImportModal(text);
                } else {
                    showMessage('Failed to read file content.', 'error');
                    logAsync('ERROR', '无法读取文件内容，内容非字符串。');
                }
            };
            reader.onerror = () => {
                showMessage(`Error reading file: ${reader.error}`, 'error');
                logAsync('ERROR', '读取导入文件时发生错误。', { error: reader.error });
            };
            reader.readAsText(file);

            importFileInput.value = '';
        });
    }

    if (syncDownBtn) {
        syncDownBtn.addEventListener('click', () => {
            syncDownBtn.textContent = '正在获取列表...';
            syncDownBtn.disabled = true;
            logAsync('INFO', '用户点击“从云端恢复”，开始获取文件列表。');

            chrome.runtime.sendMessage({ type: 'webdav-list-files' }, response => {
                syncDownBtn.textContent = '从云端恢复';
                syncDownBtn.disabled = false;

                if (response?.success) {
                    if (response.files && response.files.length > 0) {
                        fileList.innerHTML = ''; // Clear previous list
                        response.files.forEach((file: any) => {
                            const li = document.createElement('li');
                            li.dataset.filename = file.name;
                            li.dataset.filepath = file.path;
                            li.classList.add('file-item');

                            li.innerHTML = `
                                <i class="fas fa-file-alt file-icon"></i>
                                <span class="file-name">${file.name}</span>
                                <span class="file-date">${file.lastModified}</span>
                            `;

                            li.addEventListener('click', () => handleFileRestoreClick(file));
                            fileList.appendChild(li);
                        });
                        fileListContainer.classList.remove('hidden');
                        showMessage('获取文件列表成功，请点击文件进行恢复。');
                        logAsync('INFO', '成功获取云端文件列表。', { fileCount: response.files.length });
                        const settingsTab = document.querySelector('.tab-link[data-tab="tab-settings"]');
                        if (settingsTab) {
                            (settingsTab as HTMLButtonElement).click();
                            setTimeout(() => {
                                fileListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                        }
                    } else {
                        showMessage('在云端未找到任何备份文件。', 'warn');
                        logAsync('WARN', '云端没有任何备份文件。');
                    }
                } else {
                    showMessage(`获取文件列表失败: ${response.error}`, 'error');
                    logAsync('ERROR', '从云端获取文件列表失败。', { error: response.error });
                }
            });
        });
    }
} 