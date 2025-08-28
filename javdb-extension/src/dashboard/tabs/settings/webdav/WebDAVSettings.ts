/**
 * WebDAV设置面板
 * 通过WebDAV协议，将观看记录备份到兼容的云存储服务
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';

/**
 * WebDAV设置面板类
 */
export class WebDAVSettings extends BaseSettingsPanel {
    private webdavEnabled!: HTMLInputElement;
    private webdavUrl!: HTMLInputElement;
    private webdavUser!: HTMLInputElement;
    private webdavPass!: HTMLInputElement;
    private webdavAutoSync!: HTMLInputElement;
    private webdavSyncInterval!: HTMLInputElement;
    private saveWebdavSettingsBtn!: HTMLButtonElement;
    private testWebdavConnectionBtn!: HTMLButtonElement;
    private diagnoseWebdavConnectionBtn!: HTMLButtonElement;
    private toggleWebdavPasswordVisibilityBtn!: HTMLButtonElement;
    private lastSyncTime!: HTMLSpanElement;

    constructor() {
        super({
            panelId: 'webdav-settings',
            panelName: 'WebDAV设置',
            autoSave: false, // WebDAV设置需要手动保存
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        this.webdavEnabled = document.getElementById('webdavEnabled') as HTMLInputElement;
        this.webdavUrl = document.getElementById('webdavUrl') as HTMLInputElement;
        this.webdavUser = document.getElementById('webdavUser') as HTMLInputElement;
        this.webdavPass = document.getElementById('webdavPass') as HTMLInputElement;
        this.webdavAutoSync = document.getElementById('webdavAutoSync') as HTMLInputElement;
        this.webdavSyncInterval = document.getElementById('webdav-sync-interval') as HTMLInputElement;
        this.saveWebdavSettingsBtn = document.getElementById('saveWebdavSettings') as HTMLButtonElement;
        this.testWebdavConnectionBtn = document.getElementById('testWebdavConnection') as HTMLButtonElement;
        this.diagnoseWebdavConnectionBtn = document.getElementById('diagnoseWebdavConnection') as HTMLButtonElement;
        this.toggleWebdavPasswordVisibilityBtn = document.getElementById('toggleWebdavPasswordVisibility') as HTMLButtonElement;
        this.lastSyncTime = document.getElementById('last-sync-time') as HTMLSpanElement;

        if (!this.webdavEnabled || !this.webdavUrl || !this.webdavUser || !this.webdavPass ||
            !this.saveWebdavSettingsBtn || !this.testWebdavConnectionBtn || !this.diagnoseWebdavConnectionBtn ||
            !this.toggleWebdavPasswordVisibilityBtn) {
            throw new Error('WebDAV设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        this.saveWebdavSettingsBtn.addEventListener('click', this.handleSaveSettings.bind(this));
        this.webdavEnabled.addEventListener('change', this.handleWebDAVEnabledChange.bind(this));
        this.testWebdavConnectionBtn.addEventListener('click', this.handleTestWebDAV.bind(this));
        this.diagnoseWebdavConnectionBtn.addEventListener('click', this.handleDiagnoseWebDAV.bind(this));
        this.toggleWebdavPasswordVisibilityBtn.addEventListener('click', this.handleTogglePasswordVisibility.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.saveWebdavSettingsBtn?.removeEventListener('click', this.handleSaveSettings.bind(this));
        this.webdavEnabled?.removeEventListener('change', this.handleWebDAVEnabledChange.bind(this));
        this.testWebdavConnectionBtn?.removeEventListener('click', this.handleTestWebDAV.bind(this));
        this.diagnoseWebdavConnectionBtn?.removeEventListener('click', this.handleDiagnoseWebDAV.bind(this));
        this.toggleWebdavPasswordVisibilityBtn?.removeEventListener('click', this.handleTogglePasswordVisibility.bind(this));
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const webdav = settings?.webdav || {};

        this.webdavEnabled.checked = webdav.enabled || false;
        this.webdavUrl.value = webdav.url || '';
        this.webdavUser.value = webdav.username || '';
        this.webdavPass.value = webdav.password || '';
        this.webdavAutoSync.checked = webdav.autoSync || false;
        this.webdavSyncInterval.value = String(webdav.syncInterval || 30);
        this.lastSyncTime.textContent = webdav.lastSync ? new Date(webdav.lastSync).toLocaleString() : 'Never';

        // 更新UI状态
        this.updateWebDAVControlsState();
        this.updateFieldsVisibility();
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                webdav: {
                    enabled: this.webdavEnabled.checked,
                    url: this.webdavUrl.value.trim(),
                    username: this.webdavUser.value.trim(),
                    password: this.webdavPass.value,
                    autoSync: this.webdavAutoSync.checked,
                    syncInterval: parseInt(this.webdavSyncInterval.value, 10),
                    lastSync: STATE.settings?.webdav?.lastSync || ''
                }
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            // 设置定时器
            chrome.runtime.sendMessage({ type: 'setup-alarms' });

            return {
                success: true,
                savedSettings: { webdav: newSettings.webdav }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '保存失败'
            };
        }
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (this.webdavEnabled.checked) {
            if (!this.webdavUrl.value.trim()) {
                errors.push('WebDAV服务器地址不能为空');
            } else if (!this.webdavUrl.value.startsWith('http')) {
                errors.push('WebDAV服务器地址必须以http://或https://开头');
            }

            if (!this.webdavUser.value.trim()) {
                errors.push('WebDAV用户名不能为空');
            }

            if (!this.webdavPass.value) {
                errors.push('WebDAV密码不能为空');
            }

            const syncInterval = parseInt(this.webdavSyncInterval.value, 10);
            if (isNaN(syncInterval) || syncInterval < 5 || syncInterval > 1440) {
                errors.push('同步间隔必须在5-1440分钟之间');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }

    /**
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        return {
            webdav: {
                enabled: this.webdavEnabled.checked,
                url: this.webdavUrl.value.trim(),
                username: this.webdavUser.value.trim(),
                password: this.webdavPass.value,
                autoSync: this.webdavAutoSync.checked,
                syncInterval: parseInt(this.webdavSyncInterval.value, 10),
                lastSync: STATE.settings?.webdav?.lastSync || ''
            }
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const webdav = settings.webdav;
        if (webdav) {
            if (webdav.enabled !== undefined) {
                this.webdavEnabled.checked = webdav.enabled;
            }
            if (webdav.url !== undefined) {
                this.webdavUrl.value = webdav.url;
            }
            if (webdav.username !== undefined) {
                this.webdavUser.value = webdav.username;
            }
            if (webdav.password !== undefined) {
                this.webdavPass.value = webdav.password;
            }
            if (webdav.autoSync !== undefined) {
                this.webdavAutoSync.checked = webdav.autoSync;
            }
            if (webdav.syncInterval !== undefined) {
                this.webdavSyncInterval.value = String(webdav.syncInterval);
            }
            if (webdav.lastSync !== undefined) {
                this.lastSyncTime.textContent = webdav.lastSync ? new Date(webdav.lastSync).toLocaleString() : 'Never';
            }

            this.updateWebDAVControlsState();
            this.updateFieldsVisibility();
        }
    }

    /**
     * 处理保存设置按钮点击
     */
    private async handleSaveSettings(): Promise<void> {
        try {
            await this.saveSettings();
            // 基类的 saveSettings 方法会自动显示成功消息，这里不需要重复显示
        } catch (error) {
            console.error('保存WebDAV设置失败:', error);
            showMessage('保存失败，请重试', 'error');
        }
    }

    /**
     * 处理WebDAV启用状态变化
     */
    private handleWebDAVEnabledChange(): void {
        this.updateWebDAVControlsState();
        this.updateFieldsVisibility();
        this.emit('change');
    }

    /**
     * 更新WebDAV控件状态
     */
    private updateWebDAVControlsState(): void {
        const webdavSubControls = document.getElementById('webdavSubControls');
        if (webdavSubControls) {
            if (this.webdavEnabled.checked) {
                webdavSubControls.classList.add('enabled');
            } else {
                webdavSubControls.classList.remove('enabled');
            }
        }
    }

    /**
     * 更新字段显示/隐藏
     */
    private updateFieldsVisibility(): void {
        const fieldsContainer = document.getElementById('webdav-fields-container') as HTMLDivElement;
        if (fieldsContainer) {
            fieldsContainer.style.display = this.webdavEnabled.checked ? 'block' : 'none';
        }
    }

    /**
     * 处理测试WebDAV连接
     */
    private async handleTestWebDAV(): Promise<void> {
        logAsync('INFO', '用户点击了"测试 WebDAV 连接"按钮。');
        
        try {
            await this.saveSettings();
            logAsync('INFO', '用户开始测试WebDAV连接');
            showMessage('正在测试连接...', 'info');
            this.testWebdavConnectionBtn.textContent = '连接测试中...';
            this.testWebdavConnectionBtn.disabled = true;

            logAsync('INFO', '正在向后台发送WebDAV连接测试请求');

            chrome.runtime.sendMessage({ type: 'webdav-test' }, response => {
                if (response && response.success) {
                    showMessage('🎉 WebDAV连接测试成功！服务器响应正常', 'success');
                    logAsync('INFO', 'WebDAV连接测试成功，服务器认证通过');
                } else {
                    const errorMsg = response?.error || '未知错误';
                    const userFriendlyMsg = this.getErrorMessage(errorMsg);
                    showMessage(userFriendlyMsg, 'error');
                    logAsync('ERROR', `WebDAV连接测试失败：${errorMsg}`, {
                        originalError: errorMsg,
                        userMessage: userFriendlyMsg
                    });
                }

                this.testWebdavConnectionBtn.textContent = '测试连接';
                this.testWebdavConnectionBtn.disabled = false;
            });
        } catch (error) {
            showMessage('❌ 无法进行连接测试', 'error');
            logAsync('ERROR', `WebDAV连接测试失败：${error instanceof Error ? error.message : '未知错误'}`);
            this.testWebdavConnectionBtn.textContent = '测试连接';
            this.testWebdavConnectionBtn.disabled = false;
        }
    }

    /**
     * 处理诊断WebDAV连接
     */
    private async handleDiagnoseWebDAV(): Promise<void> {
        logAsync('INFO', '用户点击了"诊断 WebDAV 连接"按钮。');
        
        try {
            await this.saveSettings();
            logAsync('INFO', '用户开始诊断WebDAV连接');
            showMessage('正在进行详细诊断...', 'info');
            this.diagnoseWebdavConnectionBtn.textContent = '诊断中...';
            this.diagnoseWebdavConnectionBtn.disabled = true;

            logAsync('INFO', '正在向后台发送WebDAV诊断请求');

            chrome.runtime.sendMessage({ type: 'webdav-diagnose' }, response => {
                if (response && response.success) {
                    const resultMessage = this.formatDiagnosticResult(response.diagnostic);
                    alert(resultMessage);

                    if (response.diagnostic.success) {
                        showMessage('✅ 诊断完成，连接正常', 'success');
                        logAsync('INFO', 'WebDAV诊断成功', response.diagnostic);
                    } else {
                        showMessage('⚠️ 诊断完成，发现问题，请查看详细信息', 'warn');
                        logAsync('WARN', 'WebDAV诊断发现问题', response.diagnostic);
                    }
                } else {
                    const errorMsg = response?.error || '诊断失败';
                    showMessage(`❌ WebDAV诊断失败：${errorMsg}`, 'error');
                    logAsync('ERROR', `WebDAV诊断失败：${errorMsg}`);
                }

                this.diagnoseWebdavConnectionBtn.textContent = '诊断连接';
                this.diagnoseWebdavConnectionBtn.disabled = false;
            });
        } catch (error) {
            showMessage('❌ 无法进行诊断', 'error');
            logAsync('ERROR', `WebDAV诊断失败：${error instanceof Error ? error.message : '未知错误'}`);
            this.diagnoseWebdavConnectionBtn.textContent = '诊断连接';
            this.diagnoseWebdavConnectionBtn.disabled = false;
        }
    }

    /**
     * 获取友好的错误信息
     */
    private getErrorMessage(errorMsg: string): string {
        if (errorMsg.includes('401')) {
            return '❌ WebDAV连接失败：用户名或密码错误，请检查认证信息';
        } else if (errorMsg.includes('404')) {
            return '❌ WebDAV连接失败：服务器地址不存在，请检查URL是否正确';
        } else if (errorMsg.includes('403')) {
            return '❌ WebDAV连接失败：没有访问权限，请检查账户权限设置';
        } else if (errorMsg.includes('timeout') || errorMsg.includes('网络')) {
            return '❌ WebDAV连接失败：网络超时，请检查网络连接和服务器状态';
        } else if (errorMsg.includes('not fully configured')) {
            return '❌ WebDAV连接失败：配置信息不完整，请填写完整的服务器地址、用户名和密码';
        } else {
            return `❌ WebDAV连接失败：${errorMsg}`;
        }
    }

    /**
     * 格式化诊断结果
     */
    private formatDiagnosticResult(diagnostic: any): string {
        let resultMessage = '🔍 WebDAV连接诊断完成\n\n';

        if (diagnostic.serverType) {
            resultMessage += `📡 服务器类型: ${diagnostic.serverType}\n`;
        }

        if (diagnostic.supportedMethods && diagnostic.supportedMethods.length > 0) {
            resultMessage += `🛠️ 支持的方法: ${diagnostic.supportedMethods.join(', ')}\n`;
        }

        if (diagnostic.responseFormat) {
            resultMessage += `📄 响应格式: ${diagnostic.responseFormat}\n`;
        }

        if (diagnostic.issues && diagnostic.issues.length > 0) {
            resultMessage += `\n⚠️ 发现的问题:\n`;
            diagnostic.issues.forEach((issue: string, index: number) => {
                resultMessage += `${index + 1}. ${issue}\n`;
            });
        }

        if (diagnostic.recommendations && diagnostic.recommendations.length > 0) {
            resultMessage += `\n💡 建议:\n`;
            diagnostic.recommendations.forEach((rec: string, index: number) => {
                resultMessage += `${index + 1}. ${rec}\n`;
            });
        }

        return resultMessage;
    }

    /**
     * 处理密码可见性切换
     */
    private handleTogglePasswordVisibility(): void {
        const isPassword = this.webdavPass.type === 'password';
        this.webdavPass.type = isPassword ? 'text' : 'password';

        const icon = this.toggleWebdavPasswordVisibilityBtn.querySelector('i');
        if (icon) {
            icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }

        // 更新按钮标题
        this.toggleWebdavPasswordVisibilityBtn.title = isPassword ? '隐藏密码' : '显示密码';
    }
}
