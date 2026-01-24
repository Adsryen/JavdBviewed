/**
 * 隐私保护设置面板
 * 截图模式和私密模式配置，保护用户隐私
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { showMessage } from '../../../ui/toast';
import { getSettings, saveSettings } from '../../../../utils/storage';
import { getPrivacyManager, getPasswordService, getRecoveryService } from '../../../../services/privacy';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';

/**
 * 隐私保护设置面板类
 */
export class PrivacySettings extends BaseSettingsPanel {
    // 截图模式元素
    private screenshotEnabled!: HTMLInputElement;
    private blurIntensity!: HTMLInputElement;
    private blurIntensityValue!: HTMLSpanElement;
    private autoBlurTrigger!: HTMLSelectElement;
    private blurAreaCheckboxes!: NodeListOf<HTMLInputElement>;

    // 私密模式元素
    private privateModeEnabled!: HTMLInputElement;
    private requirePassword!: HTMLInputElement;
    private sessionTimeout!: HTMLInputElement;
    private lockOnTabLeave!: HTMLInputElement;
    private lockOnExtensionClose!: HTMLInputElement;

    // 按钮元素
    private setPasswordBtn!: HTMLButtonElement;
    private changePasswordBtn!: HTMLButtonElement;
    private removePasswordBtn!: HTMLButtonElement;
    private setupSecurityQuestionsBtn!: HTMLButtonElement;
    private generateBackupCodeBtn!: HTMLButtonElement;

    constructor() {
        super({
            panelId: 'privacy-settings',
            panelName: '隐私保护设置',
            autoSave: false, // 隐私设置需要特殊处理，不自动保存
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 截图模式元素
        this.screenshotEnabled = document.getElementById('screenshotModeEnabled') as HTMLInputElement;
        this.blurIntensity = document.getElementById('blurIntensity') as HTMLInputElement;
        this.blurIntensityValue = document.getElementById('blurIntensityValue') as HTMLSpanElement;
        this.autoBlurTrigger = document.getElementById('autoBlurTrigger') as HTMLSelectElement;
        this.blurAreaCheckboxes = document.querySelectorAll('[data-area]') as NodeListOf<HTMLInputElement>;

        // 私密模式元素
        this.privateModeEnabled = document.getElementById('privateModeEnabled') as HTMLInputElement;
        this.requirePassword = document.getElementById('requirePassword') as HTMLInputElement;
        this.sessionTimeout = document.getElementById('sessionTimeout') as HTMLInputElement;
        this.lockOnTabLeave = document.getElementById('lockOnTabLeave') as HTMLInputElement;
        this.lockOnExtensionClose = document.getElementById('lockOnExtensionClose') as HTMLInputElement;

        // 按钮元素
        this.setPasswordBtn = document.getElementById('setPasswordBtn') as HTMLButtonElement;
        this.changePasswordBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
        this.removePasswordBtn = document.getElementById('removePasswordBtn') as HTMLButtonElement;
        this.setupSecurityQuestionsBtn = document.getElementById('setupSecurityQuestionsBtn') as HTMLButtonElement;
        this.generateBackupCodeBtn = document.getElementById('generateBackupCodeBtn') as HTMLButtonElement;

        if (!this.screenshotEnabled || !this.privateModeEnabled) {
            throw new Error('隐私保护设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 截图模式事件
        this.screenshotEnabled?.addEventListener('change', this.handleScreenshotModeToggle.bind(this));
        this.blurIntensity?.addEventListener('input', this.handleBlurIntensityChange.bind(this));
        this.autoBlurTrigger?.addEventListener('change', this.handleAutoBlurTriggerChange.bind(this));
        
        // 模糊区域选择事件
        this.blurAreaCheckboxes?.forEach(checkbox => {
            checkbox.addEventListener('change', this.handleBlurAreaChange.bind(this));
        });

        // 私密模式事件
        this.privateModeEnabled?.addEventListener('change', this.handlePrivateModeToggle.bind(this));
        this.requirePassword?.addEventListener('change', this.handleRequirePasswordToggle.bind(this));
        this.sessionTimeout?.addEventListener('change', this.handlePrivateModeSettingsChange.bind(this));
        this.lockOnTabLeave?.addEventListener('change', this.handlePrivateModeSettingsChange.bind(this));
        this.lockOnExtensionClose?.addEventListener('change', this.handlePrivateModeSettingsChange.bind(this));

        // 按钮事件
        this.setPasswordBtn?.addEventListener('click', this.handleSetPassword.bind(this));
        this.changePasswordBtn?.addEventListener('click', this.handleChangePassword.bind(this));
        this.removePasswordBtn?.addEventListener('click', this.handleRemovePassword.bind(this));
        this.setupSecurityQuestionsBtn?.addEventListener('click', this.handleSetupSecurityQuestions.bind(this));
        this.generateBackupCodeBtn?.addEventListener('click', this.handleGenerateBackupCode.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        // 由于使用了bind，需要保存引用才能正确解绑
        // 为简化起见，暂时省略
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        try {
            const settings = await getSettings();
            const privacyConfig = settings.privacy;

            // 截图模式设置
            if (this.screenshotEnabled) this.screenshotEnabled.checked = privacyConfig.screenshotMode.enabled;
            if (this.blurIntensity) {
                this.blurIntensity.value = privacyConfig.screenshotMode.blurIntensity.toString();
                if (this.blurIntensityValue) this.blurIntensityValue.textContent = privacyConfig.screenshotMode.blurIntensity.toString();
            }
            if (this.autoBlurTrigger) this.autoBlurTrigger.value = privacyConfig.screenshotMode.autoBlurTrigger;
            
            // 加载模糊区域选择
            const enabledAreas = privacyConfig.screenshotMode.blurAreas || [];
            this.blurAreaCheckboxes?.forEach(checkbox => {
                const area = checkbox.getAttribute('data-area');
                if (area) {
                    checkbox.checked = enabledAreas.includes(area as any);
                }
            });

            // 私密模式设置
            if (this.privateModeEnabled) this.privateModeEnabled.checked = privacyConfig.privateMode.enabled;
            if (this.requirePassword) this.requirePassword.checked = privacyConfig.privateMode.requirePassword;
            if (this.sessionTimeout) {
                const idleTimeout = (privacyConfig.privateMode as any).idleTimeout || 10;
                this.sessionTimeout.value = idleTimeout.toString();
            }
            if (this.lockOnTabLeave) this.lockOnTabLeave.checked = privacyConfig.privateMode.lockOnTabLeave;
            if (this.lockOnExtensionClose) this.lockOnExtensionClose.checked = privacyConfig.privateMode.lockOnExtensionClose;

            // 更新密码状态显示
            this.updatePasswordStatus(privacyConfig.privateMode.passwordHash !== '');

            // 更新恢复选项状态
            await this.updateRecoveryOptionsStatus();

        } catch (error) {
            console.error('Failed to load privacy settings:', error);
            throw error;
        }
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            // 隐私设置通过专门的隐私管理器保存，不直接保存到settings
            return { success: true };
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

        // 验证模糊强度（1-10）
        if (this.blurIntensity) {
            const blurValue = parseInt(this.blurIntensity.value, 10);
            if (isNaN(blurValue) || blurValue < 1 || blurValue > 10) {
                errors.push('模糊强度必须在1-10之间');
            }
        }

        // 验证会话超时
        if (this.sessionTimeout) {
            const timeout = parseInt(this.sessionTimeout.value, 10);
            if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
                errors.push('会话超时时间必须在5-1440分钟之间');
            }
        }

        // 验证私密模式密码要求
        if (this.privateModeEnabled?.checked && this.requirePassword?.checked) {
            // 这里可以添加密码强度验证
            warnings.push('启用密码保护后，请确保设置了强密码');
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
        // 隐私设置通过隐私管理器获取，这里返回空对象
        return {};
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(_settings: Partial<ExtensionSettings>): void {
        // 隐私设置通过loadSettings方法处理
        this.loadSettings();
    }

    /**
     * 处理截图模式开关
     */
    private async handleScreenshotModeToggle(event: Event): Promise<void> {
        const checkbox = event.target as HTMLInputElement;
        
        try {
            const privacyManager = getPrivacyManager();
            
            if (checkbox.checked) {
                await privacyManager.enableScreenshotMode();
                showMessage('截图模式已启用', 'success');
            } else {
                await privacyManager.disableScreenshotMode();
                showMessage('截图模式已禁用', 'success');
            }
            
            this.emit('change');
        } catch (error) {
            console.error('Failed to toggle screenshot mode:', error);
            checkbox.checked = !checkbox.checked; // 回滚状态
            showMessage('切换截图模式失败', 'error');
        }
    }

    /**
     * 处理模糊强度变化
     */
    private async handleBlurIntensityChange(event: Event): Promise<void> {
        const slider = event.target as HTMLInputElement;
        const value = parseInt(slider.value, 10);
        
        if (this.blurIntensityValue) {
            this.blurIntensityValue.textContent = value.toString();
        }
        
        try {
            const privacyManager = getPrivacyManager();
            await privacyManager.updateScreenshotSettings({ blurIntensity: value });
            showMessage('模糊强度已更新', 'success');
            this.emit('change');
        } catch (error) {
            console.error('Failed to update blur intensity:', error);
            showMessage('更新模糊强度失败', 'error');
        }
    }

    /**
     * 处理自动模糊触发条件变化
     */
    private async handleAutoBlurTriggerChange(event: Event): Promise<void> {
        const select = event.target as HTMLSelectElement;
        
        try {
            const privacyManager = getPrivacyManager();
            await privacyManager.updateScreenshotSettings({ autoBlurTrigger: select.value });
            showMessage('自动模糊触发条件已更新', 'success');
            this.emit('change');
        } catch (error) {
            console.error('Failed to update auto blur trigger:', error);
            showMessage('更新自动模糊触发条件失败', 'error');
        }
    }

    /**
     * 处理模糊区域变化
     */
    private async handleBlurAreaChange(): Promise<void> {
        try {
            const enabledAreas: string[] = [];
            this.blurAreaCheckboxes?.forEach(checkbox => {
                if (checkbox.checked) {
                    const area = checkbox.getAttribute('data-area');
                    if (area) {
                        enabledAreas.push(area);
                    }
                }
            });
            
            const privacyManager = getPrivacyManager();
            await privacyManager.updateScreenshotSettings({
                blurAreas: enabledAreas as any
            });
            showMessage('模糊区域已更新', 'success');
            this.emit('change');
        } catch (error) {
            console.error('Failed to update blur areas:', error);
            showMessage('更新模糊区域失败', 'error');
        }
    }

    /**
     * 处理私密模式开关
     */
    private async handlePrivateModeToggle(event: Event): Promise<void> {
        const checkbox = event.target as HTMLInputElement;
        
        try {
            // 如果要开启私密模式，先检查是否设置了密码
            if (checkbox.checked) {
                const settings = await getSettings();
                if (!settings.privacy.privateMode.passwordHash) {
                    // 没有设置密码，提示用户先设置
                    checkbox.checked = false;
                    showMessage('请先设置密码才能启用私密模式', 'warning');
                    
                    // 自动打开设置密码对话框
                    setTimeout(() => {
                        this.handleSetPassword();
                    }, 500);
                    return;
                }
            }
            
            const privacyManager = getPrivacyManager();
            
            if (checkbox.checked) {
                await privacyManager.enablePrivateMode();
                showMessage('私密模式已启用', 'success');
            } else {
                await privacyManager.disablePrivateMode();
                showMessage('私密模式已禁用', 'success');
            }
            
            this.emit('change');
        } catch (error) {
            console.error('Failed to toggle private mode:', error);
            checkbox.checked = !checkbox.checked; // 回滚状态
            showMessage('切换私密模式失败', 'error');
        }
    }

    /**
     * 处理密码要求开关
     */
    private async handleRequirePasswordToggle(event: Event): Promise<void> {
        const checkbox = event.target as HTMLInputElement;
        
        try {
            const privacyManager = getPrivacyManager();
            await privacyManager.updatePrivateModeSettings({ requirePassword: checkbox.checked });
            
            showMessage(checkbox.checked ? '已启用密码保护' : '已禁用密码保护', 'success');
            
            // 更新密码按钮状态
            this.updatePasswordButtonsState();
            this.emit('change');
        } catch (error) {
            console.error('Failed to toggle password requirement:', error);
            checkbox.checked = !checkbox.checked; // 回滚状态
            showMessage('切换密码要求失败', 'error');
        }
    }

    /**
     * 处理私密模式设置变化
     */
    private async handlePrivateModeSettingsChange(): Promise<void> {
        try {
            const privacyManager = getPrivacyManager();
            const idleTimeout = parseInt(this.sessionTimeout?.value || '10', 10);
            
            await privacyManager.updatePrivateModeSettings({
                sessionTimeout: idleTimeout, // 现在sessionTimeout就是无操作超时
                idleTimeout: idleTimeout,
                lockOnTabLeave: this.lockOnTabLeave?.checked || false,
                lockOnExtensionClose: this.lockOnExtensionClose?.checked || false
            });
            showMessage('私密模式设置已更新', 'success');
            this.emit('change');
        } catch (error) {
            console.error('Failed to update private mode settings:', error);
            showMessage('更新私密模式设置失败', 'error');
        }
    }

    /**
     * 处理设置密码
     */
    private async handleSetPassword(): Promise<void> {
        try {
            const passwordService = getPasswordService();
            const success = await passwordService.showSetPasswordDialog();
            
            if (success) {
                showMessage('密码设置成功', 'success');
                this.updatePasswordStatus(true);
            }
        } catch (error) {
            console.error('Failed to set password:', error);
            showMessage('设置密码失败', 'error');
        }
    }

    /**
     * 处理修改密码
     */
    private async handleChangePassword(): Promise<void> {
        try {
            const passwordService = getPasswordService();
            const success = await passwordService.showChangePasswordDialog();
            
            if (success) {
                showMessage('密码修改成功', 'success');
            }
        } catch (error) {
            console.error('Failed to change password:', error);
            showMessage('修改密码失败', 'error');
        }
    }

    /**
     * 处理取消密码
     */
    private async handleRemovePassword(): Promise<void> {
        try {
            // 确认对话框
            const confirmed = confirm(
                '确定要取消密码吗？\n\n' +
                '取消密码后：\n' +
                '• 私密模式将自动关闭\n' +
                '• 所有密码保护功能将失效\n' +
                '• 恢复方式（安全问题、备份码）将被保留\n\n' +
                '此操作不可撤销，确定继续吗？'
            );
            
            if (!confirmed) {
                return;
            }
            
            const settings = await getSettings();
            
            // 清除密码
            settings.privacy.privateMode.passwordHash = '';
            settings.privacy.privateMode.passwordSalt = '';
            settings.privacy.privateMode.requirePassword = false;
            settings.privacy.privateMode.enabled = false; // 自动关闭私密模式
            
            await saveSettings(settings);
            
            // 更新UI
            this.updatePasswordStatus(false);
            if (this.privateModeEnabled) {
                this.privateModeEnabled.checked = false;
            }
            
            showMessage('密码已取消，私密模式已关闭', 'success');
            this.emit('change');
        } catch (error) {
            console.error('Failed to remove password:', error);
            showMessage('取消密码失败', 'error');
        }
    }

    /**
     * 处理设置安全问题
     */
    private async handleSetupSecurityQuestions(): Promise<void> {
        try {
            const recoveryService = getRecoveryService();
            const success = await recoveryService.showSecurityQuestionsDialog();
            
            if (success) {
                showMessage('安全问题设置成功', 'success');
                await this.updateRecoveryOptionsStatus();
            }
        } catch (error) {
            console.error('Failed to setup security questions:', error);
            showMessage('设置安全问题失败', 'error');
        }
    }

    /**
     * 处理生成备份码
     */
    private async handleGenerateBackupCode(): Promise<void> {
        try {
            const recoveryService = getRecoveryService();
            const backupCode = await recoveryService.generateBackupCode();
            
            if (backupCode) {
                // 一次性展示备份码，并尝试复制到剪贴板
                try {
                    await navigator.clipboard.writeText(backupCode);
                    showMessage('备份码已复制到剪贴板，请妥善保存', 'success');
                } catch {
                    // 复制失败则仅提示
                    showMessage('备份码生成成功，请妥善保存', 'success');
                }
                alert(`您的备份恢复码（仅显示一次）：\n\n${backupCode}\n\n请将其保存在安全的地方！`);

                // 刷新状态显示
                await this.updateRecoveryOptionsStatus();
            }
        } catch (error) {
            console.error('Failed to generate backup code:', error);
            showMessage('生成备份码失败', 'error');
        }
    }

    /**
     * 更新密码状态显示
     */
    private updatePasswordStatus(hasPassword: boolean): void {
        const passwordStatus = document.getElementById('passwordStatus');
        if (passwordStatus) {
            passwordStatus.textContent = hasPassword ? '已设置' : '未设置';
            passwordStatus.className = hasPassword ? 'status-success' : 'status-warning';
        }
        
        this.updatePasswordButtonsState();
    }

    /**
     * 更新密码按钮状态
     */
    private async updatePasswordButtonsState(): Promise<void> {
        const settings = await getSettings();
        const hasPassword = !!settings.privacy.privateMode.passwordHash;
        
        if (this.setPasswordBtn) {
            this.setPasswordBtn.style.display = hasPassword ? 'none' : 'inline-block';
        }
        
        if (this.changePasswordBtn) {
            this.changePasswordBtn.style.display = hasPassword ? 'inline-block' : 'none';
        }
        
        if (this.removePasswordBtn) {
            this.removePasswordBtn.style.display = hasPassword ? 'inline-block' : 'none';
        }
    }

    /**
     * 更新恢复选项状态
     */
    private async updateRecoveryOptionsStatus(): Promise<void> {
        try {
            const recoveryService = getRecoveryService();
            const hasSecurityQuestions = await recoveryService.hasSecurityQuestions();
            const hasBackupCode = await recoveryService.hasBackupCode();
            
            const securityQuestionsStatus = document.getElementById('securityQuestionsStatus');
            if (securityQuestionsStatus) {
                securityQuestionsStatus.textContent = hasSecurityQuestions ? '已设置' : '未设置';
                securityQuestionsStatus.className = hasSecurityQuestions ? 'status-success' : 'status-warning';
            }
            
            const backupCodeStatus = document.getElementById('backupCodeStatus');
            if (backupCodeStatus) {
                backupCodeStatus.textContent = hasBackupCode ? '已生成' : '未生成';
                backupCodeStatus.className = hasBackupCode ? 'status-success' : 'status-warning';
            }
        } catch (error) {
            console.error('Failed to update recovery options status:', error);
        }
    }
}
