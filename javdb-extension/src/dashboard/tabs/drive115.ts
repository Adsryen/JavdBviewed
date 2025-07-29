/**
 * 115网盘设置标签页
 */

import { STATE } from '../state';
import { saveSettings } from '../../utils/storage';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import type { ExtensionSettings } from '../../types';
import { getDrive115Service } from '../../services/drive115';

export function initDrive115Tab(): void {
    // 初始化115设置
    initDrive115Settings();
    
    // 初始化115日志查看
    initDrive115Logs();
    
    // 初始化115测试功能
    initDrive115Test();
}

/**
 * 初始化115设置
 */
function initDrive115Settings(): void {
    const drive115Enabled = document.getElementById('drive115Enabled') as HTMLInputElement;
    const drive115DownloadDir = document.getElementById('drive115DownloadDir') as HTMLInputElement;
    const drive115VerifyCount = document.getElementById('drive115VerifyCount') as HTMLInputElement;
    const drive115MaxFailures = document.getElementById('drive115MaxFailures') as HTMLInputElement;
    const drive115AutoNotify = document.getElementById('drive115AutoNotify') as HTMLInputElement;
    const saveDrive115SettingsBtn = document.getElementById('saveDrive115Settings') as HTMLButtonElement;

    // 加载当前设置
    loadDrive115Settings();

    // 保存设置
    saveDrive115SettingsBtn?.addEventListener('click', async () => {
        try {
            const settings: Partial<ExtensionSettings> = {
                drive115: {
                    enabled: drive115Enabled?.checked || false,
                    downloadDir: drive115DownloadDir?.value || '${云下载}',
                    verifyCount: parseInt(drive115VerifyCount?.value || '5'),
                    maxFailures: parseInt(drive115MaxFailures?.value || '5'),
                    autoNotify: drive115AutoNotify?.checked || true,
                }
            };

            await saveSettings(settings);
            
            // 更新115服务设置
            const drive115Service = getDrive115Service();
            await drive115Service.saveSettings(settings.drive115!);

            showMessage('115网盘设置已保存', 'success');
            await logAsync('INFO', '115网盘设置已保存', settings.drive115);
        } catch (error) {
            console.error('保存115设置失败:', error);
            showMessage('保存115设置失败', 'error');
            await logAsync('ERROR', '保存115设置失败', { error: String(error) });
        }
    });

    // 启用/禁用状态变化
    drive115Enabled?.addEventListener('change', () => {
        const isEnabled = drive115Enabled.checked;
        const settingsContainer = document.querySelector('.drive115-settings-container');
        if (settingsContainer) {
            if (isEnabled) {
                settingsContainer.classList.remove('disabled');
            } else {
                settingsContainer.classList.add('disabled');
            }
        }
    });
}

/**
 * 加载115设置
 */
async function loadDrive115Settings(): Promise<void> {
    try {
        const drive115Service = getDrive115Service();
        const rawSettings = drive115Service.getSettings();

        // 确保 settings 对象存在且有必要的属性
        const settings = {
            enabled: false,
            downloadDir: '',
            verifyCount: 3,
            maxFailures: 3,
            autoNotify: true,
            ...rawSettings
        };

        // 确保所有属性都存在
        if (typeof settings.enabled !== 'boolean') settings.enabled = false;
        if (typeof settings.downloadDir !== 'string') settings.downloadDir = '';
        if (typeof settings.verifyCount !== 'number') settings.verifyCount = 3;
        if (typeof settings.maxFailures !== 'number') settings.maxFailures = 3;
        if (typeof settings.autoNotify !== 'boolean') settings.autoNotify = true;

        const drive115Enabled = document.getElementById('drive115Enabled') as HTMLInputElement;
        const drive115DownloadDir = document.getElementById('drive115DownloadDir') as HTMLInputElement;
        const drive115VerifyCount = document.getElementById('drive115VerifyCount') as HTMLInputElement;
        const drive115MaxFailures = document.getElementById('drive115MaxFailures') as HTMLInputElement;
        const drive115AutoNotify = document.getElementById('drive115AutoNotify') as HTMLInputElement;

        if (drive115Enabled) drive115Enabled.checked = settings.enabled;
        if (drive115DownloadDir) drive115DownloadDir.value = settings.downloadDir;
        if (drive115VerifyCount) drive115VerifyCount.value = settings.verifyCount.toString();
        if (drive115MaxFailures) drive115MaxFailures.value = settings.maxFailures.toString();
        if (drive115AutoNotify) drive115AutoNotify.checked = settings.autoNotify;

        // 设置初始状态
        const settingsContainer = document.querySelector('.drive115-settings-container');
        if (settingsContainer) {
            if (settings.enabled) {
                settingsContainer.classList.remove('disabled');
            } else {
                settingsContainer.classList.add('disabled');
            }
        }
    } catch (error) {
        console.error('加载115设置失败:', error);
        // 在出错时设置默认状态
        const drive115Enabled = document.getElementById('drive115Enabled') as HTMLInputElement;
        if (drive115Enabled) drive115Enabled.checked = false;

        const settingsContainer = document.querySelector('.drive115-settings-container');
        if (settingsContainer) {
            settingsContainer.classList.add('disabled');
        }
    }
}

/**
 * 初始化115日志查看
 */
function initDrive115Logs(): void {
    const refreshLogsBtn = document.getElementById('refreshDrive115Logs') as HTMLButtonElement;
    const clearLogsBtn = document.getElementById('clearDrive115Logs') as HTMLButtonElement;
    const exportLogsBtn = document.getElementById('exportDrive115Logs') as HTMLButtonElement;

    // 刷新日志
    refreshLogsBtn?.addEventListener('click', async () => {
        await refreshDrive115Logs();
    });

    // 清空日志
    clearLogsBtn?.addEventListener('click', async () => {
        if (confirm('确定要清空所有115网盘日志吗？此操作不可撤销。')) {
            try {
                const drive115Service = getDrive115Service();
                await drive115Service.clearLogs();
                await refreshDrive115Logs();
                showMessage('115网盘日志已清空', 'success');
            } catch (error) {
                console.error('清空115日志失败:', error);
                showMessage('清空115日志失败', 'error');
            }
        }
    });

    // 导出日志
    exportLogsBtn?.addEventListener('click', async () => {
        try {
            const drive115Service = getDrive115Service();
            const logsJson = await drive115Service.exportLogs();
            
            const blob = new Blob([logsJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `drive115-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showMessage('115网盘日志已导出', 'success');
        } catch (error) {
            console.error('导出115日志失败:', error);
            showMessage('导出115日志失败', 'error');
        }
    });

    // 初始加载日志
    refreshDrive115Logs();
}

/**
 * 刷新115日志显示
 */
async function refreshDrive115Logs(): Promise<void> {
    try {
        const drive115Service = getDrive115Service();
        const [logs, stats] = await Promise.all([
            drive115Service.getLogs(),
            drive115Service.getLogStats()
        ]);

        // 更新日志统计
        updateDrive115LogStats(stats || {});

        // 更新日志列表 - 确保 logs 是数组
        const logArray = Array.isArray(logs) ? logs : [];
        updateDrive115LogList(logArray.slice(0, 100)); // 只显示最近100条
    } catch (error) {
        console.error('刷新115日志失败:', error);
        // 在出错时显示空状态
        updateDrive115LogStats({});
        updateDrive115LogList([]);
    }
}

/**
 * 更新115日志统计
 */
function updateDrive115LogStats(stats: any): void {
    const statsContainer = document.getElementById('drive115LogStats');
    if (!statsContainer) return;

    // 确保 stats 对象存在并有默认值
    const safeStats = {
        total: 0,
        recent24h: 0,
        byType: {
            offline_success: 0,
            offline_failed: 0
        },
        ...stats
    };

    // 确保 byType 对象存在
    if (!safeStats.byType || typeof safeStats.byType !== 'object') {
        safeStats.byType = {
            offline_success: 0,
            offline_failed: 0
        };
    }

    try {
        statsContainer.innerHTML = `
            <div class="log-stat-item">
                <span class="stat-label">总日志数:</span>
                <span class="stat-value">${safeStats.total || 0}</span>
            </div>
            <div class="log-stat-item">
                <span class="stat-label">24小时内:</span>
                <span class="stat-value">${safeStats.recent24h || 0}</span>
            </div>
            <div class="log-stat-item">
                <span class="stat-label">成功下载:</span>
                <span class="stat-value">${safeStats.byType.offline_success || 0}</span>
            </div>
            <div class="log-stat-item">
                <span class="stat-label">失败下载:</span>
                <span class="stat-value">${safeStats.byType.offline_failed || 0}</span>
            </div>
        `;
    } catch (error) {
        console.error('更新115日志统计时出错:', error);
        statsContainer.innerHTML = '<div class="log-stat-item error">统计数据加载失败</div>';
    }
}

/**
 * 更新115日志列表
 */
function updateDrive115LogList(logs: any[]): void {
    const logsList = document.getElementById('drive115LogsList');
    if (!logsList) return;

    // 确保 logs 是数组
    if (!Array.isArray(logs)) {
        console.warn('115日志数据不是数组格式:', logs);
        logsList.innerHTML = '<div class="no-logs error">日志数据格式错误</div>';
        return;
    }

    if (logs.length === 0) {
        logsList.innerHTML = '<div class="no-logs">暂无115网盘日志</div>';
        return;
    }

    try {
        logsList.innerHTML = logs.map(log => {
            // 确保每个日志条目都是有效对象
            if (!log || typeof log !== 'object') {
                console.warn('无效的115日志条目:', log);
                return '';
            }

            const date = log.timestamp ? new Date(log.timestamp).toLocaleString() : '未知时间';
            const typeClass = getLogTypeClass(log.type || 'unknown');

            return `
                <div class="log-entry ${typeClass}">
                    <div class="log-header">
                        <span class="log-type">${getLogTypeText(log.type || 'unknown')}</span>
                        <span class="log-time">${date}</span>
                    </div>
                    <div class="log-message">${log.message || '无消息'}</div>
                    ${log.videoId ? `<div class="log-video-id">番号: ${log.videoId}</div>` : ''}
                    ${log.data ? `<div class="log-data">${JSON.stringify(log.data, null, 2)}</div>` : ''}
                </div>
            `;
        }).filter(html => html !== '').join('');
    } catch (error) {
        console.error('渲染115日志列表时出错:', error);
        logsList.innerHTML = '<div class="no-logs error">渲染日志时出现错误</div>';
    }
}

/**
 * 获取日志类型样式类
 */
function getLogTypeClass(type: string): string {
    switch (type) {
        case 'offline_success':
        case 'verify_success':
        case 'batch_complete':
            return 'log-success';
        case 'offline_failed':
        case 'verify_failed':
            return 'log-error';
        case 'offline_start':
        case 'verify_start':
        case 'batch_start':
            return 'log-info';
        default:
            return 'log-default';
    }
}

/**
 * 获取日志类型文本
 */
function getLogTypeText(type: string): string {
    const typeMap: Record<string, string> = {
        offline_start: '开始下载',
        offline_success: '下载成功',
        offline_failed: '下载失败',
        verify_start: '开始验证',
        verify_success: '验证成功',
        verify_failed: '验证失败',
        batch_start: '批量开始',
        batch_complete: '批量完成'
    };
    
    return typeMap[type] || type;
}

/**
 * 初始化115测试功能
 */
function initDrive115Test(): void {
    const testSearchBtn = document.getElementById('testDrive115Search') as HTMLButtonElement;
    const testSearchInput = document.getElementById('testSearchInput') as HTMLInputElement;
    const testResultsDiv = document.getElementById('testResults') as HTMLDivElement;

    testSearchBtn?.addEventListener('click', async () => {
        const query = testSearchInput?.value?.trim();
        if (!query) {
            showMessage('请输入搜索关键词', 'warning');
            return;
        }

        try {
            testSearchBtn.disabled = true;
            testSearchBtn.textContent = '搜索中...';
            
            const drive115Service = getDrive115Service();
            const results = await drive115Service.searchFiles(query);
            
            if (testResultsDiv) {
                if (results.length === 0) {
                    testResultsDiv.innerHTML = '<div class="no-results">未找到匹配文件</div>';
                } else {
                    testResultsDiv.innerHTML = `
                        <div class="test-results-header">找到 ${results.length} 个文件:</div>
                        <div class="test-results-list">
                            ${results.slice(0, 10).map(file => `
                                <div class="test-result-item">
                                    <div class="file-name">${file.n}</div>
                                    <div class="file-info">大小: ${formatFileSize(file.s)} | ID: ${file.fid}</div>
                                </div>
                            `).join('')}
                            ${results.length > 10 ? `<div class="more-results">还有 ${results.length - 10} 个文件...</div>` : ''}
                        </div>
                    `;
                }
            }
            
            showMessage(`搜索完成，找到 ${results.length} 个文件`, 'success');
        } catch (error) {
            console.error('115搜索测试失败:', error);
            showMessage('115搜索测试失败', 'error');
            if (testResultsDiv) {
                testResultsDiv.innerHTML = `<div class="error-result">搜索失败: ${error}</div>`;
            }
        } finally {
            testSearchBtn.disabled = false;
            testSearchBtn.textContent = '测试搜索';
        }
    });
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
