import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import { showConfirmationModal } from '../ui/modal';

export function initLogsTab(): void {
    const logLevelFilter = document.getElementById('log-level-filter') as HTMLSelectElement;
    const logSourceFilter = document.getElementById('log-source-filter') as HTMLSelectElement;
    const refreshButton = document.getElementById('refresh-logs-button') as HTMLButtonElement;
    const clearLogsButton = document.getElementById('clear-logs-button') as HTMLButtonElement;
    const logBody = document.getElementById('log-body') as HTMLDivElement;

    if (!logLevelFilter || !logBody) return;

    let allLogs: any[] = [];

    const renderLogs = () => {
        try {
            const levelFilter = logLevelFilter.value;
            const sourceFilter = logSourceFilter?.value || 'ALL';
            logBody.innerHTML = '';

            // 确保 allLogs 是数组
            if (!Array.isArray(allLogs)) {
                console.warn('allLogs 不是数组:', allLogs);
                allLogs = [];
            }

            if (allLogs.length === 0) {
                logBody.innerHTML = '<div class="no-logs-message">未找到日志。</div>';
                return;
            }

            let filteredLogs = allLogs.filter(log => {
                // 确保 log 对象存在且有必要的属性
                if (!log || typeof log !== 'object') {
                    console.warn('无效的日志条目:', log);
                    return false;
                }

                // 级别筛选
                const levelMatch = levelFilter === 'ALL' || log.level === levelFilter;

                // 来源筛选
                let sourceMatch = true;
                if (sourceFilter === 'DRIVE115') {
                    sourceMatch = log.message && log.message.includes('[115]');
                } else if (sourceFilter === 'GENERAL') {
                    sourceMatch = !log.message || !log.message.includes('[115]');
                }

                return levelMatch && sourceMatch;
            });

            if (filteredLogs.length === 0) {
                logBody.innerHTML = '<div class="no-logs-message">没有符合当前过滤条件的日志。</div>';
                return;
            }

            // 安全地处理日志条目
            filteredLogs.slice().reverse().forEach(log => {
                try {
                    const logEntry = document.createElement('div');
                    logEntry.className = `log-entry log-level-${(log.level || 'info').toLowerCase()}`;

                    const dataHtml = log.data ? `
                        <details class="log-data-details">
                            <summary>详细数据</summary>
                            <pre>${JSON.stringify(log.data, null, 2)}</pre>
                        </details>
                    ` : '';

                    const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : '未知时间';
                    const level = log.level || 'INFO';
                    const message = log.message || '无消息';

                    logEntry.innerHTML = `
                        <div class="log-header">
                            <span class="log-level-badge">${level}</span>
                            <span class="log-message">${message}</span>
                            <span class="log-timestamp">${timestamp}</span>
                        </div>
                        ${dataHtml}
                    `;
                    logBody.appendChild(logEntry);
                } catch (error) {
                    console.error('渲染单个日志条目时出错:', error, log);
                }
            });
        } catch (error) {
            console.error('渲染日志时出错:', error);
            logBody.innerHTML = '<div class="no-logs-message error">渲染日志时出现错误，请刷新重试。</div>';
        }
    };

    const fetchLogs = (isManualRefresh = false) => {
        if (isManualRefresh) {
            showMessage('正在刷新日志...', 'info');
        }

        try {
            chrome.runtime.sendMessage({ type: 'get-logs' }, response => {
                try {
                    if (response?.success) {
                        // 确保 logs 是一个数组
                        const logs = response.logs;
                        if (Array.isArray(logs)) {
                            allLogs = logs;
                        } else {
                            console.warn('获取的日志不是数组格式:', logs);
                            allLogs = [];
                        }
                        renderLogs();
                        if (isManualRefresh) {
                            showMessage('日志已成功刷新。', 'success');
                        }
                    } else {
                        console.error('获取日志失败:', response);
                        allLogs = [];
                        renderLogs();
                        if (isManualRefresh) {
                            showMessage('刷新日志失败，请稍后重试。', 'error');
                        } else {
                            showMessage('获取日志记录失败。', 'error');
                        }
                    }
                } catch (error) {
                    console.error('处理日志响应时出错:', error);
                    allLogs = [];
                    renderLogs();
                    if (isManualRefresh) {
                        showMessage('处理日志数据时出错。', 'error');
                    }
                }
            });
        } catch (error) {
            console.error('发送获取日志请求时出错:', error);
            allLogs = [];
            renderLogs();
            if (isManualRefresh) {
                showMessage('发送日志请求失败。', 'error');
            }
        }
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
    logSourceFilter?.addEventListener('change', renderLogs);
    refreshButton.addEventListener('click', () => fetchLogs(true));
    clearLogsButton.addEventListener('click', clearLogs);

    fetchLogs();
} 