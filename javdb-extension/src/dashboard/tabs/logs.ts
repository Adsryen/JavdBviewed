import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import { showConfirmationModal } from '../ui/modal';

export function initLogsTab(): void {
    const logLevelFilter = document.getElementById('log-level-filter') as HTMLSelectElement;
    const refreshButton = document.getElementById('refresh-logs-button') as HTMLButtonElement;
    const clearLogsButton = document.getElementById('clear-logs-button') as HTMLButtonElement;
    const logBody = document.getElementById('log-body') as HTMLDivElement;

    if (!logLevelFilter || !logBody) return;

    let allLogs: any[] = [];

    const renderLogs = () => {
        const filterValue = logLevelFilter.value;
        logBody.innerHTML = '';
        if (allLogs.length === 0) {
            logBody.innerHTML = '<div class="no-logs-message">未找到日志。</div>';
            return;
        }

        const filteredLogs = allLogs.filter(log => filterValue === 'ALL' || log.level === filterValue);

        if (filteredLogs.length === 0) {
            logBody.innerHTML = '<div class="no-logs-message">没有符合当前过滤条件的日志。</div>';
            return;
        }

        for (const log of filteredLogs.slice().reverse()) {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-level-${log.level.toLowerCase()}`;

            const dataHtml = log.data ? `
                <details class="log-data-details">
                    <summary>详细数据</summary>
                    <pre>${JSON.stringify(log.data, null, 2)}</pre>
                </details>
            ` : '';

            logEntry.innerHTML = `
                <div class="log-header">
                    <span class="log-level-badge">${log.level}</span>
                    <span class="log-message">${log.message}</span>
                    <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                </div>
                ${dataHtml}
            `;
            logBody.appendChild(logEntry);
        }
    };

    const fetchLogs = (isManualRefresh = false) => {
        if (isManualRefresh) {
            showMessage('正在刷新日志...', 'info');
        }
        chrome.runtime.sendMessage({ type: 'get-logs' }, response => {
            if (response?.success) {
                allLogs = response.logs || [];
                renderLogs();
                if (isManualRefresh) {
                    showMessage('日志已成功刷新。', 'success');
                }
            } else {
                if (isManualRefresh) {
                    showMessage('刷新日志失败，请稍后重试。', 'error');
                } else {
                    showMessage('获取日志记录失败。', 'error');
                }
            }
        });
    };

    const clearLogs = () => {
        showConfirmationModal({
            title: '确认清空日志',
            message: '您确定要清空所有日志记录吗？此操作不可撤销。',
            onConfirm: () => {
                logAsync('INFO', '用户确认清空日志。');
                chrome.runtime.sendMessage({ type: 'clear-logs' }, response => {
                    if (response?.success) {
                        showMessage('日志已成功清空。', 'success');
                        logAsync('INFO', '日志已被成功清空。');
                        fetchLogs(); // Re-fetch to show the empty state
                    } else {
                        showMessage('清空日志失败，请稍后重试。', 'error');
                        logAsync('ERROR', '清空日志时发生错误。', { error: response.error });
                    }
                });
            },
            onCancel: () => {
                logAsync('INFO', '用户取消了清空日志操作。');
            }
        });
    };
    
    logLevelFilter.addEventListener('change', renderLogs);
    refreshButton.addEventListener('click', () => fetchLogs(true));
    clearLogsButton.addEventListener('click', clearLogs);

    fetchLogs();
} 