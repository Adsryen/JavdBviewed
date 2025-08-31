/**
 * 115网盘设置面板
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { getSettings, saveSettings } from '../../../../utils/storage';
import { showMessage } from '../../../ui/toast';
import { log } from '../../../../utils/logController';
import type { ExtensionSettings } from '../../../../types';
import type { Drive115Settings } from '../../../../services/drive115/types';
import { DEFAULT_DRIVE115_SETTINGS } from '../../../../services/drive115/config';
import { Drive115TabsController } from './Drive115TabsController';
import { Drive115V1Pane } from './Drive115V1Pane';
import { Drive115V2Pane } from './Drive115V2Pane';
import { searchFiles } from '../../../../services/drive115Router';
import { getLogs, clearLogs } from '../../../../services/drive115Router';

export class Drive115SettingsPanel extends BaseSettingsPanel {
    private settings: Drive115Settings = { ...DEFAULT_DRIVE115_SETTINGS };
    protected autoSaveTimeout: number | undefined = undefined;
    private isAutoSaving = false;
    private tabsController: Drive115TabsController | null = null;

    constructor() {
        super({
            panelId: 'drive115-settings',
            panelName: '115网盘设置',
            autoSave: true,
            saveDelay: 1000,
            requireValidation: true
        });

        // 版本切换：标题右侧 segmented 按钮
        const verV1Btn = document.getElementById('drive115VerV1Btn') as HTMLButtonElement | null;
        const verV2Btn = document.getElementById('drive115VerV2Btn') as HTMLButtonElement | null;
        verV1Btn?.addEventListener('click', () => {
            // 切到 v1：更新持久化字段并同步关闭 enableV2
            this.settings.lastSelectedVersion = 'v1';
            this.settings.enableV2 = false;
            this.updateUI();
            this.autoSaveSettings();
            this.tabsController?.switchTo('v1');
        });
        verV2Btn?.addEventListener('click', () => {
            // 切到 v2：更新持久化字段并同步开启 enableV2
            this.settings.lastSelectedVersion = 'v2';
            this.settings.enableV2 = true;
            this.updateUI();
            this.autoSaveSettings();
            this.tabsController?.switchTo('v2');
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
     * 加载设置（私有：避免与基类的公开 loadSettings 冲突）
     */
    private async loadDrive115Settings(): Promise<void> {
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

        // 测试搜索
        const testSearchInput = document.getElementById('testSearchInput') as HTMLInputElement;
        const testSearchButton = document.getElementById('testDrive115Search') as HTMLButtonElement;
        testSearchButton?.addEventListener('click', async () => {
            const query = testSearchInput?.value?.trim();
            if (!query) {
                showMessage('请输入搜索关键词', 'warn');
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

        // 其余 v1/v2 表单事件由各自 Pane 负责绑定
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

        // v2: 更新新版 token 模式字段（enableV2 与 lastSelectedVersion 同步）
        if (!this.settings.lastSelectedVersion) {
            // 首次无记录默认 v2
            this.settings.lastSelectedVersion = 'v2';
            this.settings.enableV2 = true;
        }
        const enableV2Checkbox = document.getElementById('drive115EnableV2') as HTMLInputElement;
        if (enableV2Checkbox) {
            enableV2Checkbox.checked = !!this.settings.enableV2;
        }
        const v2ApiBaseUrlInput = document.getElementById('drive115V2ApiBaseUrl') as HTMLInputElement | null;
        if (v2ApiBaseUrlInput) {
            const val = (this.settings.v2ApiBaseUrl || DEFAULT_DRIVE115_SETTINGS.v2ApiBaseUrl || '').toString();
            v2ApiBaseUrlInput.value = val;
        }
        const v2AccessTokenInput = document.getElementById('drive115V2AccessToken') as HTMLInputElement;
        if (v2AccessTokenInput) {
            v2AccessTokenInput.value = this.settings.v2AccessToken || '';
        }
        const v2RefreshTokenInput = document.getElementById('drive115V2RefreshToken') as HTMLInputElement;
        if (v2RefreshTokenInput) {
            v2RefreshTokenInput.value = this.settings.v2RefreshToken || '';
        }

        // v2 自动刷新设置
        const v2AutoRefreshCheckbox = document.getElementById('drive115V2AutoRefresh') as HTMLInputElement | null;
        if (v2AutoRefreshCheckbox) {
            v2AutoRefreshCheckbox.checked = !!this.settings.v2AutoRefresh;
        }
        const v2AutoRefreshSkewInput = document.getElementById('drive115V2AutoRefreshSkewSec') as HTMLInputElement | null;
        if (v2AutoRefreshSkewInput) {
            const skew = typeof this.settings.v2AutoRefreshSkewSec === 'number' ? this.settings.v2AutoRefreshSkewSec : (DEFAULT_DRIVE115_SETTINGS as any).v2AutoRefreshSkewSec || 60;
            v2AutoRefreshSkewInput.value = String(Math.max(0, Math.floor(skew)));
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

        // 子页可见性：根据 lastSelectedVersion 切换 v1/v2 容器
        const v1Pane = document.getElementById('drive115V1Pane') as HTMLDivElement | null;
        const v2Pane = document.getElementById('drive115V2Pane') as HTMLDivElement | null;
        const v1Btn = document.getElementById('drive115VerV1Btn') as HTMLButtonElement | null;
        const v2Btn = document.getElementById('drive115VerV2Btn') as HTMLButtonElement | null;
        const isV2 = this.settings.lastSelectedVersion === 'v2';
        if (v1Pane) v1Pane.style.display = isV2 ? 'none' : 'block';
        if (v2Pane) v2Pane.style.display = isV2 ? 'block' : 'none';
        if (v1Btn) v1Btn.classList.toggle('active', !isV2);
        if (v2Btn) v2Btn.classList.toggle('active', isV2);
        if (v1Btn && v2Btn) {
            // 最小样式同步，避免依赖额外CSS
            v1Btn.style.background = !isV2 ? '#e3f2fd' : '#f7f7f7';
            v2Btn.style.background = isV2 ? '#e3f2fd' : '#f7f7f7';
        }

        // 更新错误状态
        const downloadDirError = document.getElementById('drive115DownloadDirError') as HTMLParagraphElement;
        const downloadDirInput2 = document.getElementById('drive115DownloadDir') as HTMLInputElement;
        // 启用旧版模式时需要下载目录；v2 模式不强制
        const showError = this.settings.enabled && !this.settings.enableV2 && !this.settings.downloadDir;
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

            // 通过统一路由执行搜索
            const results = await searchFiles(query);
            const count = Array.isArray(results) ? results.length : 0;
            showMessage(`搜索测试成功，找到 ${count} 个结果`, 'success');
            this.displayTestResults(Array.isArray(results) ? results : [], query);
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
            const logs = await getLogs();
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
            await clearLogs();
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
            const logs = await getLogs();

            const logText = logs.map((log: any) =>
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

        const logHtml = logs.map((log: any) => `
            <div class="log-entry log-${log.level}">
                <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                <span class="log-level">[${(log.level || '').toString().toUpperCase()}]</span>
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
        await this.saveSettings();
    }

    /**
     * 获取设置数据
     */
    getSettings(): Partial<ExtensionSettings> {
        return { drive115: { ...this.settings } };
    }

    /**
     * 设置数据
     */
    setSettings(settings: Partial<ExtensionSettings>): void {
        if (settings.drive115) {
            this.settings = { ...this.settings, ...settings.drive115 } as Drive115Settings;
            this.updateUI();
        }
    }

    /**
     * 解绑事件（BaseSettingsPanel要求的抽象方法）
     */
    protected unbindEvents(): void {
        // 清理事件监听器
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = undefined;
        }
    }

    /**
     * 加载设置（BaseSettingsPanel要求的抽象方法）
     */
    protected async doLoadSettings(): Promise<void> {
        await this.loadDrive115Settings();
        log.verbose('doLoadSettings: 准备更新UI，当前设置:', this.settings);

        // 延迟更新UI，确保DOM元素已加载
        setTimeout(() => {
            log.verbose('延迟更新UI开始...');
            this.updateUI();
            // 初始化并同步 tabs 控制器
            if (!this.tabsController) {
                const ctx = {
                    update: (patch: Partial<any>) => {
                        this.settings = { ...(this.settings as any), ...(patch as any) } as any;
                    },
                    updateUI: () => this.updateUI(),
                    save: () => this.autoSaveSettings()
                };
                const v1 = new Drive115V1Pane('drive115V1Pane', ctx);
                const v2 = new Drive115V2Pane('drive115V2Pane', ctx);
                this.tabsController = new Drive115TabsController({
                    v1Pane: v1,
                    v2Pane: v2,
                    getCurrentVersion: () => (this.settings.lastSelectedVersion || (this.settings.enableV2 ? 'v2' : 'v1')) as 'v1' | 'v2',
                    onVersionChange: (ver) => {
                        // 可选：当由控制器驱动切换时，同步设置（目前按钮/复选框已做同步，此处兜底）
                        this.settings.lastSelectedVersion = ver;
                        this.settings.enableV2 = ver === 'v2';
                        this.autoSaveSettings();
                    }
                });
                this.tabsController.init();
            }
            this.tabsController?.switchTo(this.settings.enableV2 ? 'v2' : 'v1', { silent: true });
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
        // 优先委托给子面板校验（已拆分逻辑）
        if (this.tabsController) {
            const errors = this.tabsController.validateAll();
            return { isValid: errors.length === 0, errors };
        }

        // 回退：控制器未初始化时使用旧逻辑（保证安全）
        const fallbackErrors: string[] = [];
        if (this.settings.enabled) {
            if (!this.settings.enableV2 && !this.settings.downloadDir) {
                fallbackErrors.push('启用115旧版模式时必须设置下载目录ID');
            }
            if (this.settings.verifyCount < 1 || this.settings.verifyCount > 10) {
                fallbackErrors.push('验证次数必须在1-10之间');
            }
            if (this.settings.maxFailures < 0 || this.settings.maxFailures > 50) {
                fallbackErrors.push('最大失败数必须在0-50之间');
            }
            if (this.settings.enableV2) {
                const at = this.settings.v2AccessToken || '';
                const rt = this.settings.v2RefreshToken || '';
                if (at && at.length < 8) fallbackErrors.push('access_token 看起来不正确（长度过短）');
                if (rt && rt.length < 8) fallbackErrors.push('refresh_token 看起来不正确（长度过短）');
            }
        }
        return { isValid: fallbackErrors.length === 0, errors: fallbackErrors };
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
