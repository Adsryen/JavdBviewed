/**
 * 更新检查设置面板类
 * 基于BaseSettingsPanel实现更新检查相关的设置功能
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { SettingsPanelConfig, SettingsSaveResult, SettingsValidationResult } from '../base/interfaces';
import { getSettings, saveSettings } from '../../../../utils/storage';
import { showMessage } from '../../../ui/toast';
import { checkForUpdates, getCurrentVersion } from '../../../../services/update/checker';
import { log } from '../../../../utils/logController';
import type { ExtensionSettings } from '../../../../types';

export class UpdateSettings extends BaseSettingsPanel {
    private settings: any = {};
    private isCheckingUpdate = false;

    constructor() {
        const config: SettingsPanelConfig = {
            panelId: 'update-settings',
            panelName: '检查更新',
            requireValidation: false,
            autoSave: false
        };
        super(config);
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 验证必需的DOM元素是否存在
        const requiredElements = [
            'autoUpdateCheck',
            'updateCheckInterval',
            'includePrerelease',
            'checkUpdateNow',
            'viewChangelog',
            'downloadUpdate',
            'currentVersion',
            'latestVersion',
            'lastUpdateCheck',
            'updateNotification',
            'updateMessage'
        ];

        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`[UpdateSettings] DOM元素未找到: ${elementId}`);
            }
        }

        log.verbose('[UpdateSettings] DOM元素初始化完成');
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 自动检查更新开关
        const autoUpdateCheckToggle = document.getElementById('autoUpdateCheck') as HTMLInputElement;
        if (autoUpdateCheckToggle) {
            autoUpdateCheckToggle.addEventListener('change', this.handleAutoUpdateCheckToggle.bind(this));
        }

        // 检查间隔选择
        const updateCheckIntervalSelect = document.getElementById('updateCheckInterval') as HTMLSelectElement;
        if (updateCheckIntervalSelect) {
            updateCheckIntervalSelect.addEventListener('change', this.handleUpdateCheckIntervalChange.bind(this));
        }

        // 包含预发布版本
        const includePrereleaseToggle = document.getElementById('includePrerelease') as HTMLInputElement;
        if (includePrereleaseToggle) {
            includePrereleaseToggle.addEventListener('change', this.handleIncludePrereleaseToggle.bind(this));
        }

        // 立即检查按钮
        const checkUpdateNowBtn = document.getElementById('checkUpdateNow') as HTMLButtonElement;
        if (checkUpdateNowBtn) {
            checkUpdateNowBtn.addEventListener('click', this.handleCheckUpdateNow.bind(this));
        }

        // 查看更新日志按钮
        const viewChangelogBtn = document.getElementById('viewChangelog') as HTMLButtonElement;
        if (viewChangelogBtn) {
            viewChangelogBtn.addEventListener('click', this.handleViewChangelog.bind(this));
        }

        // 下载更新按钮
        const downloadUpdateBtn = document.getElementById('downloadUpdate') as HTMLButtonElement;
        if (downloadUpdateBtn) {
            downloadUpdateBtn.addEventListener('click', this.handleDownloadUpdate.bind(this));
        }

        log.verbose('[UpdateSettings] 事件监听器绑定完成');
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        // 自动检查更新开关
        const autoUpdateCheckToggle = document.getElementById('autoUpdateCheck') as HTMLInputElement;
        if (autoUpdateCheckToggle) {
            autoUpdateCheckToggle.removeEventListener('change', this.handleAutoUpdateCheckToggle.bind(this));
        }

        // 检查间隔选择
        const updateCheckIntervalSelect = document.getElementById('updateCheckInterval') as HTMLSelectElement;
        if (updateCheckIntervalSelect) {
            updateCheckIntervalSelect.removeEventListener('change', this.handleUpdateCheckIntervalChange.bind(this));
        }

        // 包含预发布版本
        const includePrereleaseToggle = document.getElementById('includePrerelease') as HTMLInputElement;
        if (includePrereleaseToggle) {
            includePrereleaseToggle.removeEventListener('change', this.handleIncludePrereleaseToggle.bind(this));
        }

        // 立即检查按钮
        const checkUpdateNowBtn = document.getElementById('checkUpdateNow') as HTMLButtonElement;
        if (checkUpdateNowBtn) {
            checkUpdateNowBtn.removeEventListener('click', this.handleCheckUpdateNow.bind(this));
        }

        // 查看更新日志按钮
        const viewChangelogBtn = document.getElementById('viewChangelog') as HTMLButtonElement;
        if (viewChangelogBtn) {
            viewChangelogBtn.removeEventListener('click', this.handleViewChangelog.bind(this));
        }

        // 下载更新按钮
        const downloadUpdateBtn = document.getElementById('downloadUpdate') as HTMLButtonElement;
        if (downloadUpdateBtn) {
            downloadUpdateBtn.removeEventListener('click', this.handleDownloadUpdate.bind(this));
        }

        log.verbose('[UpdateSettings] 事件监听器解绑完成');
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        try {
            this.settings = await getSettings();

            // 自动检查更新开关
            const autoUpdateCheckToggle = document.getElementById('autoUpdateCheck') as HTMLInputElement;
            if (autoUpdateCheckToggle) {
                autoUpdateCheckToggle.checked = this.settings.autoUpdateCheck !== false; // 默认启用
            }

            // 检查更新间隔
            const updateCheckIntervalSelect = document.getElementById('updateCheckInterval') as HTMLSelectElement;
            if (updateCheckIntervalSelect) {
                updateCheckIntervalSelect.value = this.settings.updateCheckInterval || '24';
            }

            // 包含预发布版本
            const includePrereleaseToggle = document.getElementById('includePrerelease') as HTMLInputElement;
            if (includePrereleaseToggle) {
                includePrereleaseToggle.checked = this.settings.includePrerelease === true;
            }

            // 更新版本信息
            this.updateVersionInfo();

            // 自动检查最新版本（延迟执行，避免阻塞UI加载）
            setTimeout(() => {
                this.autoCheckLatestVersion();
            }, 1000);

            log.verbose('[UpdateSettings] 设置加载完成');
        } catch (error) {
            console.error('[UpdateSettings] 加载设置失败:', error);
            throw error;
        }
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        // 更新设置不需要特殊验证
        return { isValid: true };
    }

    /**
     * 获取设置数据
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        return {
            autoUpdateCheck: this.settings.autoUpdateCheck,
            updateCheckInterval: this.settings.updateCheckInterval,
            includePrerelease: this.settings.includePrerelease
        };
    }

    /**
     * 设置数据
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const s = settings as any;
        if (s.autoUpdateCheck !== undefined) {
            this.settings.autoUpdateCheck = s.autoUpdateCheck;
        }
        if (s.updateCheckInterval !== undefined) {
            this.settings.updateCheckInterval = s.updateCheckInterval;
        }
        if (s.includePrerelease !== undefined) {
            this.settings.includePrerelease = s.includePrerelease;
        }
    }

    /**
     * 更新版本信息
     */
    private updateVersionInfo(): void {
        // 显示当前版本
        const currentVersionElement = document.getElementById('currentVersion');
        if (currentVersionElement) {
            currentVersionElement.textContent = getCurrentVersion();
        }

        // 显示上次检查时间
        const lastUpdateCheckElement = document.getElementById('lastUpdateCheck');
        if (lastUpdateCheckElement) {
            const lastCheck = localStorage.getItem('lastUpdateCheck');
            if (lastCheck) {
                const date = new Date(lastCheck);
                lastUpdateCheckElement.textContent = date.toLocaleString('zh-CN');
            } else {
                lastUpdateCheckElement.textContent = '从未检查';
            }
        }
    }

    /**
     * 自动检查最新版本（页面加载时调用）
     */
    private async autoCheckLatestVersion(): Promise<void> {
        const latestVersionElement = document.getElementById('latestVersion');
        if (!latestVersionElement) return;

        try {
            // 设置检查中状态
            latestVersionElement.textContent = '检查中...';
            latestVersionElement.className = 'version-value checking';

            log.verbose('[UpdateSettings] 自动检查最新版本...');

            // 检查更新
            const result = await checkForUpdates(this.settings.includePrerelease === true);

            if (result.error) {
                // 检查失败
                latestVersionElement.textContent = '检查失败';
                latestVersionElement.className = 'version-value error';
                console.warn('[UpdateSettings] 自动检查更新失败:', result.error);
            } else {
                // 检查成功
                latestVersionElement.textContent = result.latestVersion || result.currentVersion;
                latestVersionElement.className = 'version-value';

                // 保存最后检查时间
                localStorage.setItem('lastUpdateCheck', new Date().toISOString());
                this.updateVersionInfo();

                log.verbose('[UpdateSettings] 自动检查更新完成', result);

                // 如果有更新，显示通知
                if (result.hasUpdate) {
                    this.showUpdateNotification(result);
                }
            }
        } catch (error) {
            console.error('[UpdateSettings] 自动检查更新异常:', error);
            latestVersionElement.textContent = '检查失败';
            latestVersionElement.className = 'version-value error';
        }
    }

    /**
     * 显示更新通知
     */
    private showUpdateNotification(result: any): void {
        const updateNotificationSection = document.getElementById('updateNotification');
        const updateMessageElement = document.getElementById('updateMessage');
        const downloadUpdateBtn = document.getElementById('downloadUpdate') as HTMLButtonElement;

        if (updateNotificationSection && updateMessageElement) {
            updateNotificationSection.style.display = 'block';

            if (result.hasUpdate) {
                updateMessageElement.innerHTML = `
                    <i class="fas fa-exclamation-circle" style="color: #f39c12;"></i>
                    发现新版本 ${result.latestVersion}！建议更新以获得最新功能和修复。
                `;

                // 显示下载按钮
                if (downloadUpdateBtn && result.releaseUrl) {
                    downloadUpdateBtn.style.display = 'inline-block';
                    downloadUpdateBtn.onclick = () => window.open(result.releaseUrl, '_blank');
                }
            }
        }
    }

    /**
     * 处理自动检查更新开关
     */
    private async handleAutoUpdateCheckToggle(event: Event): Promise<void> {
        const toggle = event.target as HTMLInputElement;
        
        try {
            this.settings.autoUpdateCheck = toggle.checked;
            await saveSettings(this.settings);

            log.verbose(`[UpdateSettings] 自动检查更新 ${toggle.checked ? '已启用' : '已禁用'}`);
            showMessage(`自动检查更新已${toggle.checked ? '启用' : '禁用'}`, 'success');
            
            // 触发自动更新检查设置变更事件
            const customEvent = new CustomEvent('autoUpdateCheckChanged', {
                detail: { enabled: toggle.checked }
            });
            window.dispatchEvent(customEvent);
        } catch (error) {
            console.error('[UpdateSettings] 保存自动检查更新设置失败:', error);
            toggle.checked = !toggle.checked; // 回滚
            showMessage('保存设置失败', 'error');
        }
    }

    /**
     * 处理更新检查间隔变更
     */
    private async handleUpdateCheckIntervalChange(event: Event): Promise<void> {
        const select = event.target as HTMLSelectElement;
        
        try {
            this.settings.updateCheckInterval = select.value;
            await saveSettings(this.settings);

            log.verbose(`[UpdateSettings] 更新检查间隔已设置为 ${select.value} 小时`);
            showMessage(`检查间隔已设置为 ${select.value} 小时`, 'success');
            
            // 触发更新检查间隔变更事件
            const customEvent = new CustomEvent('updateCheckIntervalChanged', {
                detail: { interval: select.value }
            });
            window.dispatchEvent(customEvent);
        } catch (error) {
            console.error('[UpdateSettings] 保存更新检查间隔失败:', error);
            showMessage('保存设置失败', 'error');
        }
    }

    /**
     * 处理包含预发布版本开关
     */
    private async handleIncludePrereleaseToggle(event: Event): Promise<void> {
        const toggle = event.target as HTMLInputElement;
        
        try {
            this.settings.includePrerelease = toggle.checked;
            await saveSettings(this.settings);

            log.verbose(`[UpdateSettings] 包含预发布版本 ${toggle.checked ? '已启用' : '已禁用'}`);
            showMessage(`${toggle.checked ? '将' : '不'}包含预发布版本`, 'success');
        } catch (error) {
            console.error('[UpdateSettings] 保存预发布版本设置失败:', error);
            toggle.checked = !toggle.checked; // 回滚
            showMessage('保存设置失败', 'error');
        }
    }

    /**
     * 处理立即检查更新
     */
    private async handleCheckUpdateNow(): Promise<void> {
        if (this.isCheckingUpdate) {
            return;
        }

        const btn = document.getElementById('checkUpdateNow') as HTMLButtonElement;
        const latestVersionElement = document.getElementById('latestVersion');
        const updateNotificationSection = document.getElementById('updateNotification');
        const updateMessageElement = document.getElementById('updateMessage');
        const downloadUpdateBtn = document.getElementById('downloadUpdate') as HTMLButtonElement;

        if (!btn) return;

        try {
            this.isCheckingUpdate = true;
            btn.disabled = true;
            btn.textContent = '检查中...';

            if (latestVersionElement) {
                latestVersionElement.textContent = '检查中...';
                latestVersionElement.className = 'version-value checking';
            }

            log.verbose('[UpdateSettings] 开始检查更新...');

            // 检查更新
            const result = await checkForUpdates(this.settings.includePrerelease === true);

            // 保存最后检查时间
            localStorage.setItem('lastUpdateCheck', new Date().toISOString());
            this.updateVersionInfo();

            if (result.error) {
                throw new Error(result.error);
            }

            // 更新最新版本显示
            if (latestVersionElement) {
                latestVersionElement.textContent = result.latestVersion || result.currentVersion;
                latestVersionElement.className = 'version-value';
            }

            // 显示更新通知
            if (updateNotificationSection && updateMessageElement) {
                updateNotificationSection.style.display = 'block';
                
                if (result.hasUpdate) {
                    updateMessageElement.innerHTML = `
                        <i class="fas fa-exclamation-circle" style="color: #f39c12;"></i>
                        发现新版本 ${result.latestVersion}！建议更新以获得最新功能和修复。
                    `;
                    
                    // 显示下载按钮
                    if (downloadUpdateBtn && result.releaseUrl) {
                        downloadUpdateBtn.style.display = 'inline-block';
                        downloadUpdateBtn.onclick = () => window.open(result.releaseUrl, '_blank');
                    }
                    
                    showMessage(`发现新版本 ${result.latestVersion}`, 'info');
                } else {
                    updateMessageElement.innerHTML = `
                        <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                        当前已是最新版本 ${result.currentVersion}。
                    `;
                    
                    // 隐藏下载按钮
                    if (downloadUpdateBtn) {
                        downloadUpdateBtn.style.display = 'none';
                    }
                    
                    showMessage('当前已是最新版本', 'success');
                }
            }

            btn.textContent = '检查完成';
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = '立即检查';
            }, 2000);

            log.verbose('[UpdateSettings] 更新检查完成', result);
        } catch (error) {
            console.error('[UpdateSettings] 检查更新失败:', error);

            if (latestVersionElement) {
                latestVersionElement.textContent = '检查失败';
                latestVersionElement.className = 'version-value error';
            }

            if (updateNotificationSection && updateMessageElement) {
                updateNotificationSection.style.display = 'block';
                updateMessageElement.innerHTML = `
                    <i class="fas fa-times-circle" style="color: #e74c3c;"></i>
                    检查更新失败: ${error instanceof Error ? error.message : '未知错误'}
                `;
            }

            btn.disabled = false;
            btn.textContent = '检查失败';
            setTimeout(() => {
                btn.textContent = '立即检查';
            }, 2000);

            showMessage('检查更新失败', 'error');
        } finally {
            this.isCheckingUpdate = false;
        }
    }

    /**
     * 处理查看更新日志
     */
    private handleViewChangelog(): void {
        log.verbose('[UpdateSettings] 打开更新日志...');
        
        // 打开GitHub Releases页面
        const changelogUrl = 'https://github.com/Adsryen/JavdBviewed/releases';
        window.open(changelogUrl, '_blank');
    }

    /**
     * 处理下载更新
     */
    private handleDownloadUpdate(): void {
        log.verbose('[UpdateSettings] 跳转到下载页面...');
        
        // 打开GitHub Releases页面
        const downloadUrl = 'https://github.com/Adsryen/JavdBviewed/releases/latest';
        window.open(downloadUrl, '_blank');
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            await saveSettings(this.settings);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : '保存失败' 
            };
        }
    }



    /**
     * 销毁面板
     */
    destroy(): void {
        log.verbose('[UpdateSettings] 销毁更新设置面板');
        super.destroy();
    }
}
