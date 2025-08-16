/**
 * 115网盘设置面板
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import type { SettingsPanelConfig } from '../types';
import { getSettings, saveSettings } from '../../../../utils/storage';
import { showMessage } from '../../../ui/toast';
import { logAsync } from '../../../logger';
import { log } from '../../../../utils/logController';
import type { ExtensionSettings, Drive115Settings } from '../../../../types';
import { getDrive115Service } from '../../../../services/drive115';
import { DEFAULT_DRIVE115_SETTINGS } from '../../../../services/drive115/config';

export class Drive115SettingsPanel extends BaseSettingsPanel {
    private settings: Drive115Settings = { ...DEFAULT_DRIVE115_SETTINGS };
    private autoSaveTimeout: number | null = null;
    private isAutoSaving = false;

    constructor() {
        super({
            panelId: 'drive115-settings',
            panelName: '115网盘设置',
            autoSave: true,
            saveDelay: 1000,
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 115设置面板的DOM元素在HTML中已经存在，这里不需要特殊初始化
        log.verbose('115设置DOM元素初始化完成');
    }

    /**
     * 加载设置
     */
    private async loadSettings(): Promise<void> {
        try {
            const mainSettings = await getSettings();
            this.settings = { ...DEFAULT_DRIVE115_SETTINGS, ...mainSettings.drive115 };
            log.verbose('115设置已加载:', this.settings);
        } catch (error) {
            console.warn('加载115设置失败，使用默认设置:', error);
            this.settings = { ...DEFAULT_DRIVE115_SETTINGS };
        }
    }

    /**
     * 绑定事件
     */
    protected bindEvents(): void {
        // 启用/禁用115功能
        const enabledCheckbox = document.getElementById('drive115Enabled') as HTMLInputElement;
        enabledCheckbox?.addEventListener('change', () => {
            this.settings.enabled = enabledCheckbox.checked;
            this.updateUI();
            this.autoSaveSettings();
        });

        // 展开/收起"如何获取ID"帮助
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
            const value = parseInt(verifyCountInput.value) || 5;
            this.settings.verifyCount = Math.max(1, Math.min(10, value));
            this.autoSaveSettings();
        });

        // 最大失败数变化
        const maxFailuresInput = document.getElementById('drive115MaxFailures') as HTMLInputElement;
        maxFailuresInput?.addEventListener('input', () => {
            const value = parseInt(maxFailuresInput.value) || 5;
            this.settings.maxFailures = Math.max(0, Math.min(20, value));
            this.autoSaveSettings();
        });

        // 自动通知变化
        const autoNotifyCheckbox = document.getElementById('drive115AutoNotify') as HTMLInputElement;
        autoNotifyCheckbox?.addEventListener('change', () => {
            this.settings.autoNotify = autoNotifyCheckbox.checked;
            this.autoSaveSettings();
        });

        // 测试搜索
        const testSearchInput = document.getElementById('testSearchInput') as HTMLInputElement;
        const testSearchButton = document.getElementById('testDrive115Search') as HTMLButtonElement;
        testSearchButton?.addEventListener('click', async () => {
            const query = testSearchInput?.value?.trim();
            if (!query) {
                showMessage('请输入搜索关键词', 'warning');
                return;
            }
            await this.testSearch(query);
        });

        // 日志管理
        const refreshLogButton = document.getElementById('drive115RefreshLog') as HTMLButtonElement;
        const clearLogButton = document.getElementById('drive115ClearLog') as HTMLButtonElement;
        const exportLogButton = document.getElementById('drive115ExportLog') as HTMLButtonElement;

        refreshLogButton?.addEventListener('click', () => this.refreshLog());
        clearLogButton?.addEventListener('click', () => this.clearLog());
        exportLogButton?.addEventListener('click', () => this.exportLog());
    }

    /**
     * 更新UI状态
     */
    private updateUI(): void {
        log.verbose('更新115设置UI，当前设置:', this.settings);

        // 更新启用状态
        const enabledCheckbox = document.getElementById('drive115Enabled') as HTMLInputElement;
        if (enabledCheckbox) {
            enabledCheckbox.checked = this.settings.enabled;
            log.verbose('✅ 设置启用状态成功:', this.settings.enabled, '元素:', enabledCheckbox);
        } else {
            log.error('❌ 找不到drive115Enabled元素，可能面板未显示或DOM未加载');
            // 尝试查找所有相关元素
            const allInputs = document.querySelectorAll('#drive115-settings input');
            log.verbose('115设置面板中的所有input元素:', allInputs);
        }

        // 更新下载目录
        const downloadDirInput = document.getElementById('drive115DownloadDir') as HTMLInputElement;
        if (downloadDirInput) {
            downloadDirInput.value = this.settings.downloadDir;
            log.verbose('设置下载目录:', this.settings.downloadDir);
        } else {
            log.warn('找不到drive115DownloadDir元素');
        }

        // 更新验证次数
        const verifyCountInput = document.getElementById('drive115VerifyCount') as HTMLInputElement;
        if (verifyCountInput) {
            verifyCountInput.value = this.settings.verifyCount.toString();
        }

        // 更新最大失败数
        const maxFailuresInput = document.getElementById('drive115MaxFailures') as HTMLInputElement;
        if (maxFailuresInput) {
            maxFailuresInput.value = this.settings.maxFailures.toString();
        }

        // 更新自动通知
        const autoNotifyCheckbox = document.getElementById('drive115AutoNotify') as HTMLInputElement;
        if (autoNotifyCheckbox) {
            autoNotifyCheckbox.checked = this.settings.autoNotify;
        }

        // 更新禁用状态
        const inputs = document.querySelectorAll('#drive115-settings input:not(#drive115Enabled), #drive115-settings button:not(#drive115HowToCidToggle)');
        inputs.forEach(input => {
            (input as HTMLInputElement | HTMLButtonElement).disabled = !this.settings.enabled;
        });

        // 更新容器的禁用状态
        const settingsContainer = document.querySelector('.drive115-settings-container') as HTMLElement;
        if (settingsContainer) {
            if (this.settings.enabled) {
                settingsContainer.classList.remove('disabled');
            } else {
                settingsContainer.classList.add('disabled');
            }
        }

        // 更新错误状态
        const downloadDirError = document.getElementById('drive115DownloadDirError') as HTMLParagraphElement;
        const downloadDirInput2 = document.getElementById('drive115DownloadDir') as HTMLInputElement;
        const showError = this.settings.enabled && !this.settings.downloadDir;
        if (downloadDirError) downloadDirError.style.display = showError ? 'block' : 'none';
        if (downloadDirInput2) downloadDirInput2.classList.toggle('input-invalid', showError);
    }

    /**
     * 自动保存设置
     */
    private autoSaveSettings(): void {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.updateAutoSaveStatus('saving');

        this.autoSaveTimeout = window.setTimeout(async () => {
            try {
                this.isAutoSaving = true;
                const currentSettings = await getSettings();
                const newSettings: ExtensionSettings = {
                    ...currentSettings,
                    drive115: this.settings
                };
                await saveSettings(newSettings);
                this.updateAutoSaveStatus('saved');
                
                // 2秒后恢复为idle状态
                setTimeout(() => {
                    if (!this.isAutoSaving) {
                        this.updateAutoSaveStatus('idle');
                    }
                }, 2000);
            } catch (error) {
                console.error('保存115设置失败:', error);
                this.updateAutoSaveStatus('error');
                showMessage('保存设置失败', 'error');
            } finally {
                this.isAutoSaving = false;
            }
        }, 1000);
    }

    /**
     * 更新自动保存状态
     */
    private updateAutoSaveStatus(status: 'idle' | 'saving' | 'saved' | 'error'): void {
        const statusEl = document.getElementById('drive115AutoSaveStatus') as HTMLSpanElement;
        if (!statusEl) return;

        const statusMap = {
            idle: { text: '设置修改后自动保存，无需手动操作', class: 'status-idle' },
            saving: { text: '正在保存...', class: 'status-saving' },
            saved: { text: '✓ 已保存', class: 'status-saved' },
            error: { text: '✗ 保存失败', class: 'status-error' }
        };

        const { text, class: className } = statusMap[status];
        statusEl.textContent = text;
        statusEl.className = `auto-save-status ${className}`;

        log.verbose('更新115自动保存状态:', status);
    }

    /**
     * 测试搜索功能
     */
    private async testSearch(query: string): Promise<void> {
        const button = document.getElementById('testDrive115Search') as HTMLButtonElement;
        const originalText = button?.textContent || '测试搜索';

        try {
            if (button) {
                button.disabled = true;
                button.textContent = '测试中...';
            }

            const drive115Service = getDrive115Service();
            const result = await drive115Service.testSearch(query);

            if (result.success) {
                showMessage(`搜索测试成功，找到 ${result.count || 0} 个结果`, 'success');
                this.displayTestResults(result.results || [], query);
            } else {
                showMessage(`搜索测试失败: ${result.error || '未知错误'}`, 'error');
                this.clearTestResults();
            }
        } catch (error) {
            console.error('115搜索测试失败:', error);
            showMessage('搜索测试失败，请检查网络连接和115登录状态', 'error');
            this.clearTestResults();
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    }

    /**
     * 显示测试结果
     */
    private displayTestResults(results: any[], query: string): void {
        const resultsContainer = document.getElementById('testResults');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="test-result-empty">
                    <p>未找到包含"${query}"的文件</p>
                </div>
            `;
            return;
        }

        // 只显示前5个结果
        const displayResults = results.slice(0, 5);

        resultsContainer.innerHTML = `
            <div class="test-result-header">
                <h5>搜索结果 (显示前${displayResults.length}个，共${results.length}个)</h5>
            </div>
            <div class="test-result-list">
                ${displayResults.map(file => `
                    <div class="test-result-item">
                        <div class="file-name">${this.escapeHtml(file.n || file.name || '未知文件')}</div>
                        <div class="file-info">
                            <span class="file-size">${this.formatFileSize(file.s || file.size || 0)}</span>
                            <span class="file-time">${this.formatTime(file.t || file.time || '')}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${results.length > 5 ? `<p class="test-result-more">还有 ${results.length - 5} 个结果未显示</p>` : ''}
        `;
    }

    /**
     * 清除测试结果
     */
    private clearTestResults(): void {
        const resultsContainer = document.getElementById('testResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
    }

    /**
     * HTML转义
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 格式化文件大小
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 格式化时间
     */
    private formatTime(timestamp: string | number): string {
        if (!timestamp) return '';
        const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
        return date.toLocaleDateString('zh-CN');
    }

    /**
     * 刷新日志
     */
    private async refreshLog(): Promise<void> {
        try {
            const drive115Service = getDrive115Service();
            const logs = await drive115Service.getLogs();
            this.displayLogs(logs);
        } catch (error) {
            console.error('刷新115日志失败:', error);
            showMessage('刷新日志失败', 'error');
        }
    }

    /**
     * 清空日志
     */
    private async clearLog(): Promise<void> {
        try {
            const drive115Service = getDrive115Service();
            await drive115Service.clearLogs();
            this.displayLogs([]);
            showMessage('日志已清空', 'success');
        } catch (error) {
            console.error('清空115日志失败:', error);
            showMessage('清空日志失败', 'error');
        }
    }

    /**
     * 导出日志
     */
    private async exportLog(): Promise<void> {
        try {
            const drive115Service = getDrive115Service();
            const logs = await drive115Service.getLogs();

            const logText = logs.map(log =>
                `[${new Date(log.timestamp).toLocaleString()}] ${log.level}: ${log.message}`
            ).join('\n');

            const blob = new Blob([logText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `115-logs-${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);

            showMessage('日志已导出', 'success');
        } catch (error) {
            console.error('导出115日志失败:', error);
            showMessage('导出日志失败', 'error');
        }
    }

    /**
     * 显示日志
     */
    private displayLogs(logs: any[]): void {
        const logContainer = document.getElementById('drive115LogContainer') as HTMLDivElement;
        if (!logContainer) return;

        if (logs.length === 0) {
            logContainer.innerHTML = '<p class="no-logs">暂无日志记录</p>';
            return;
        }

        const logHtml = logs.map(log => `
            <div class="log-entry log-${log.level}">
                <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                <span class="log-level">[${log.level.toUpperCase()}]</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');

        logContainer.innerHTML = logHtml;
    }



    /**
     * 重置设置
     */
    async reset(): Promise<void> {
        this.settings = { ...DEFAULT_DRIVE115_SETTINGS };
        this.updateUI();
        await this.save();
    }

    /**
     * 获取设置数据
     */
    getSettings(): Drive115Settings {
        return { ...this.settings };
    }

    /**
     * 设置数据
     */
    setSettings(settings: Partial<Drive115Settings>): void {
        this.settings = { ...this.settings, ...settings };
        this.updateUI();
    }

    /**
     * 解绑事件（BaseSettingsPanel要求的抽象方法）
     */
    protected unbindEvents(): void {
        // 清理事件监听器
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }
    }

    /**
     * 加载设置（BaseSettingsPanel要求的抽象方法）
     */
    protected async doLoadSettings(): Promise<void> {
        await this.loadSettings();
        log.verbose('doLoadSettings: 准备更新UI，当前设置:', this.settings);

        // 延迟更新UI，确保DOM元素已加载
        setTimeout(() => {
            log.verbose('延迟更新UI开始...');
            this.updateUI();
        }, 100);

        this.updateAutoSaveStatus('idle');
    }

    /**
     * 保存设置（BaseSettingsPanel要求的抽象方法）
     */
    protected async doSaveSettings(): Promise<{ success: boolean; message?: string }> {
        try {
            const currentSettings = await getSettings();
            const newSettings: ExtensionSettings = {
                ...currentSettings,
                drive115: this.settings
            };

            await saveSettings(newSettings);
            return { success: true };
        } catch (error) {
            console.error('保存115设置失败:', error);
            return {
                success: false,
                message: '保存设置时发生错误'
            };
        }
    }

    /**
     * 验证设置（BaseSettingsPanel要求的抽象方法）
     */
    protected doValidateSettings(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (this.settings.enabled) {
            if (!this.settings.downloadDir) {
                errors.push('启用115功能时必须设置下载目录ID');
            }

            if (this.settings.verifyCount < 1 || this.settings.verifyCount > 10) {
                errors.push('验证次数必须在1-10之间');
            }

            if (this.settings.maxFailures < 0 || this.settings.maxFailures > 20) {
                errors.push('最大失败数必须在0-20之间');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 获取当前设置（BaseSettingsPanel要求的抽象方法）
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        return {
            drive115: this.settings
        };
    }

    /**
     * 设置数据到UI（BaseSettingsPanel要求的抽象方法）
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        if (settings.drive115) {
            this.settings = { ...this.settings, ...settings.drive115 };
            this.updateUI();
        }
    }

    /**
     * 公共方法：强制刷新UI
     * 用于面板切换时重新应用设置
     */
    public refreshUI(): void {
        log.verbose('手动刷新115设置UI...');
        this.updateUI();
    }
}
