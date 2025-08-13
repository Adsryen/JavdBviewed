/**
 * 115网盘设置标签页
 */

import { STATE } from '../state';
import { getSettings, saveSettings } from '../../utils/storage';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import type { ExtensionSettings, Drive115Settings } from '../../types';
import { getDrive115Service } from '../../services/drive115';

/**
 * 115设置自动保存管理器
 */
class Drive115SettingsManager {
    private settings: Drive115Settings = {
        enabled: false,
        downloadDir: '',
        verifyCount: 5,
        maxFailures: 5,
        autoNotify: true
    };
    private autoSaveTimeout: number | null = null;
    private isAutoSaving = false;

    /**
     * 初始化
     */
    async initialize(): Promise<void> {
        console.log('115设置管理器开始初始化');
        await this.loadSettings();
        console.log('115设置已加载:', this.settings);
        this.updateUI(); // 根据加载的设置更新UI
        console.log('115设置UI已更新');
        this.bindEvents();
        console.log('115设置事件已绑定');
        this.updateAutoSaveStatus('idle');
        console.log('115设置管理器初始化完成');
    }


    /**
     * 加载设置
     */
    private async loadSettings(): Promise<void> {
        try {
            const mainSettings = await getSettings();
            this.settings = { ...this.settings, ...mainSettings.drive115 };
        } catch (error) {
            console.warn('加载115设置失败，使用默认设置:', error);
        }
    }

    /**
     * 绑定事件
     */
    private bindEvents(): void {
        // 启用/禁用115功能
        const enabledCheckbox = document.getElementById('drive115Enabled') as HTMLInputElement;
        enabledCheckbox?.addEventListener('change', () => {
            this.settings.enabled = enabledCheckbox.checked;
            this.updateUI();
            this.autoSaveSettings();
        });

        // 展开/收起“如何获取ID”帮助
        const howToToggle = document.getElementById('drive115HowToCidToggle') as HTMLButtonElement;
        const howToBlock = document.getElementById('drive115HowToCid') as HTMLDivElement;
        howToToggle?.addEventListener('click', () => {
            if (!howToBlock) return;
            const isHidden = howToBlock.style.display === 'none' || !howToBlock.style.display;
            howToBlock.style.display = isHidden ? 'block' : 'none';
            howToToggle.textContent = isHidden ? '收起说明' : '如何获取ID？';
        });

        // 下载目录变化（仅允许数字ID）
        const downloadDirInput = document.getElementById('drive115DownloadDir') as HTMLInputElement;
        downloadDirInput?.addEventListener('input', () => {
            // 仅保留数字
            const digitsOnly = (downloadDirInput.value || '').replace(/[^0-9]/g, '');
            if (downloadDirInput.value !== digitsOnly) {
                const cursor = downloadDirInput.selectionStart || digitsOnly.length;
                downloadDirInput.value = digitsOnly;
                // 尽量保持光标位置
                try { downloadDirInput.setSelectionRange(cursor - 1 >= 0 ? cursor - 1 : 0, cursor - 1 >= 0 ? cursor - 1 : 0); } catch {}
            }

            // 即时校验：启用时且为空 => 显示错误
            const enabledCheckbox = document.getElementById('drive115Enabled') as HTMLInputElement;
            const errorEl = document.getElementById('drive115DownloadDirError') as HTMLParagraphElement | null;
            const showError = !!(enabledCheckbox?.checked && digitsOnly.length === 0);
            if (errorEl) errorEl.style.display = showError ? 'block' : 'none';
            if (downloadDirInput) downloadDirInput.classList.toggle('input-invalid', showError);

            this.settings.downloadDir = digitsOnly;
            this.autoSaveSettings();
        });

        // 验证次数变化
        const verifyCountInput = document.getElementById('drive115VerifyCount') as HTMLInputElement;
        verifyCountInput?.addEventListener('input', () => {
            const value = parseInt(verifyCountInput.value, 10);
            if (!isNaN(value) && value >= 1 && value <= 20) {
                this.settings.verifyCount = value;
                this.autoSaveSettings();
            }
        });

        // 最大失败数变化
        const maxFailuresInput = document.getElementById('drive115MaxFailures') as HTMLInputElement;
        maxFailuresInput?.addEventListener('input', () => {
            const value = parseInt(maxFailuresInput.value, 10);
            if (!isNaN(value) && value >= 0 && value <= 50) {
                this.settings.maxFailures = value;
                this.autoSaveSettings();
            }
        });

        // 自动通知变化
        const autoNotifyCheckbox = document.getElementById('drive115AutoNotify') as HTMLInputElement;
        autoNotifyCheckbox?.addEventListener('change', () => {
            this.settings.autoNotify = autoNotifyCheckbox.checked;
            this.autoSaveSettings();
        });
    }

    /**
     * 更新UI
     */
    private updateUI(): void {
        const enabledCheckbox = document.getElementById('drive115Enabled') as HTMLInputElement;
        const downloadDirInput = document.getElementById('drive115DownloadDir') as HTMLInputElement;
        const verifyCountInput = document.getElementById('drive115VerifyCount') as HTMLInputElement;
        const maxFailuresInput = document.getElementById('drive115MaxFailures') as HTMLInputElement;
        const autoNotifyCheckbox = document.getElementById('drive115AutoNotify') as HTMLInputElement;

        if (enabledCheckbox) enabledCheckbox.checked = this.settings.enabled;
        if (downloadDirInput) downloadDirInput.value = this.settings.downloadDir;
        if (verifyCountInput) verifyCountInput.value = this.settings.verifyCount.toString();
        if (maxFailuresInput) maxFailuresInput.value = this.settings.maxFailures.toString();
        if (autoNotifyCheckbox) autoNotifyCheckbox.checked = this.settings.autoNotify;

        // 更新容器状态
        const settingsContainer = document.querySelector('.drive115-settings-container');
        if (settingsContainer) {
            if (this.settings.enabled) {
                settingsContainer.classList.remove('disabled');
            } else {
                settingsContainer.classList.add('disabled');
            }
        }
    }

    /**
     * 自动保存设置（防抖）
     */
    private autoSaveSettings(): void {
        console.log('115设置自动保存触发', this.settings);

        // 清除之前的定时器
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // 显示保存中状态
        this.updateAutoSaveStatus('saving');

        // 设置新的定时器，500ms后执行保存
        this.autoSaveTimeout = window.setTimeout(async () => {
            await this.performAutoSave();
        }, 500);
    }

    /**
     * 执行自动保存
     */
    private async performAutoSave(): Promise<void> {
        if (this.isAutoSaving) return;

        console.log('开始执行115设置自动保存', this.settings);
        this.isAutoSaving = true;

        try {
            // 获取当前主设置
            const mainSettings = await getSettings();
            // 更新115设置部分
            mainSettings.drive115 = this.settings;
            // 保存到主设置系统
            await saveSettings(mainSettings);

            // 同时更新115服务的设置
            const drive115Service = getDrive115Service();
            await drive115Service.saveSettings(this.settings);

            console.log('115设置自动保存成功');
            this.updateAutoSaveStatus('saved');

            // 2秒后恢复到空闲状态
            setTimeout(() => {
                this.updateAutoSaveStatus('idle');
            }, 2000);
        } catch (error) {
            console.error('115设置自动保存失败:', error);
            this.updateAutoSaveStatus('error');

            // 显示错误消息给用户
            showMessage('115设置保存失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');

            // 5秒后恢复到空闲状态
            setTimeout(() => {
                this.updateAutoSaveStatus('idle');
            }, 5000);
        } finally {
            this.isAutoSaving = false;
        }
    }

    /**
     * 更新自动保存状态显示
     */
    private updateAutoSaveStatus(status: 'idle' | 'saving' | 'saved' | 'error'): void {
        const statusDiv = document.getElementById('drive115AutoSaveStatus');
        if (!statusDiv) {
            console.warn('115自动保存状态元素未找到');
            return;
        }

        console.log('更新115自动保存状态:', status);
        statusDiv.className = `auto-save-status ${status}`;

        const statusConfig = {
            idle: { icon: 'fas fa-circle', text: '已同步' },
            saving: { icon: 'fas fa-sync-alt', text: '保存中...' },
            saved: { icon: 'fas fa-check', text: '已保存' },
            error: { icon: 'fas fa-exclamation-triangle', text: '保存失败' }
        };

        const config = statusConfig[status];
        statusDiv.innerHTML = `<i class="${config.icon}"></i> ${config.text}`;
    }
}

// 创建全局实例
const drive115SettingsManager = new Drive115SettingsManager();

export function initDrive115Tab(): void {
    // 初始化115设置自动保存管理器
    drive115SettingsManager.initialize();

    // 标题图标：加载成功才显示
    const titleIcon = document.getElementById('drive115TitleIcon') as HTMLImageElement | null;
    if (titleIcon) {
        const show = () => { titleIcon.style.display = 'inline-block'; };
        const hide = () => { titleIcon.remove(); };
        if (titleIcon.complete) {
            if (titleIcon.naturalWidth > 0) show(); else hide();
        } else {
            titleIcon.addEventListener('load', show, { once: true });
            titleIcon.addEventListener('error', hide, { once: true });
        }
    }

    // 初始化115日志查看
    initDrive115Logs();

    // 初始化115测试功能
    initDrive115Test();
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
