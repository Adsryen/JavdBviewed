/**
 * 隐私设置页面
 */

import { getSettings, saveSettings } from '../../utils/storage';
import { getPrivacyManager, getPasswordService, getRecoveryService } from '../../services/privacy';
import { showToast } from '../components/toast';

export function initPrivacySettings(): void {
    console.log('Initializing privacy settings...');

    // 加载设置
    loadPrivacySettings();

    // 绑定事件
    bindPrivacyEvents();
}

/**
 * 加载隐私设置
 */
async function loadPrivacySettings(): Promise<void> {
    try {
        const settings = await getSettings();
        const privacyConfig = settings.privacy;

        // 截图模式设置
        const screenshotEnabled = document.getElementById('screenshotModeEnabled') as HTMLInputElement;
        const blurIntensity = document.getElementById('blurIntensity') as HTMLInputElement;
        const blurIntensityValue = document.getElementById('blurIntensityValue') as HTMLSpanElement;
        const autoBlurTrigger = document.getElementById('autoBlurTrigger') as HTMLSelectElement;
        const showEyeIcon = document.getElementById('showEyeIcon') as HTMLInputElement;
        const temporaryViewDuration = document.getElementById('temporaryViewDuration') as HTMLInputElement;

        if (screenshotEnabled) screenshotEnabled.checked = privacyConfig.screenshotMode.enabled;
        if (blurIntensity) {
            blurIntensity.value = privacyConfig.screenshotMode.blurIntensity.toString();
            if (blurIntensityValue) blurIntensityValue.textContent = privacyConfig.screenshotMode.blurIntensity.toString();
        }
        if (autoBlurTrigger) autoBlurTrigger.value = privacyConfig.screenshotMode.autoBlurTrigger;
        if (showEyeIcon) showEyeIcon.checked = privacyConfig.screenshotMode.showEyeIcon;
        if (temporaryViewDuration) temporaryViewDuration.value = privacyConfig.screenshotMode.temporaryViewDuration.toString();

        // 私密模式设置
        const privateModeEnabled = document.getElementById('privateModeEnabled') as HTMLInputElement;
        const requirePassword = document.getElementById('requirePassword') as HTMLInputElement;
        const sessionTimeout = document.getElementById('sessionTimeout') as HTMLInputElement;
        const lockOnTabLeave = document.getElementById('lockOnTabLeave') as HTMLInputElement;
        const lockOnExtensionClose = document.getElementById('lockOnExtensionClose') as HTMLInputElement;

        if (privateModeEnabled) privateModeEnabled.checked = privacyConfig.privateMode.enabled;
        if (requirePassword) requirePassword.checked = privacyConfig.privateMode.requirePassword;
        if (sessionTimeout) sessionTimeout.value = privacyConfig.privateMode.sessionTimeout.toString();
        if (lockOnTabLeave) lockOnTabLeave.checked = privacyConfig.privateMode.lockOnTabLeave;
        if (lockOnExtensionClose) lockOnExtensionClose.checked = privacyConfig.privateMode.lockOnExtensionClose;

        // 更新密码状态显示
        updatePasswordStatus(privacyConfig.privateMode.passwordHash !== '');

        // 更新恢复选项状态
        await updateRecoveryOptionsStatus();

    } catch (error) {
        console.error('Failed to load privacy settings:', error);
        showToast('加载隐私设置失败', 'error');
    }
}

/**
 * 绑定隐私设置事件
 */
function bindPrivacyEvents(): void {
    // 截图模式开关
    const screenshotEnabled = document.getElementById('screenshotModeEnabled') as HTMLInputElement;
    screenshotEnabled?.addEventListener('change', handleScreenshotModeToggle);

    // 模糊强度滑块
    const blurIntensity = document.getElementById('blurIntensity') as HTMLInputElement;
    blurIntensity?.addEventListener('input', handleBlurIntensityChange);

    // 自动模糊触发条件
    const autoBlurTrigger = document.getElementById('autoBlurTrigger') as HTMLSelectElement;
    autoBlurTrigger?.addEventListener('change', handleAutoBlurTriggerChange);

    // 其他截图模式设置
    const showEyeIcon = document.getElementById('showEyeIcon') as HTMLInputElement;
    const temporaryViewDuration = document.getElementById('temporaryViewDuration') as HTMLInputElement;
    showEyeIcon?.addEventListener('change', handleScreenshotSettingsChange);
    temporaryViewDuration?.addEventListener('change', handleScreenshotSettingsChange);

    // 私密模式开关
    const privateModeEnabled = document.getElementById('privateModeEnabled') as HTMLInputElement;
    privateModeEnabled?.addEventListener('change', handlePrivateModeToggle);

    // 密码相关
    const requirePassword = document.getElementById('requirePassword') as HTMLInputElement;
    requirePassword?.addEventListener('change', handleRequirePasswordToggle);

    const setPasswordBtn = document.getElementById('setPasswordBtn') as HTMLButtonElement;
    setPasswordBtn?.addEventListener('click', handleSetPassword);

    const changePasswordBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
    changePasswordBtn?.addEventListener('click', handleChangePassword);

    // 会话设置
    const sessionTimeout = document.getElementById('sessionTimeout') as HTMLInputElement;
    const lockOnTabLeave = document.getElementById('lockOnTabLeave') as HTMLInputElement;
    const lockOnExtensionClose = document.getElementById('lockOnExtensionClose') as HTMLInputElement;
    sessionTimeout?.addEventListener('change', handlePrivateModeSettingsChange);
    lockOnTabLeave?.addEventListener('change', handlePrivateModeSettingsChange);
    lockOnExtensionClose?.addEventListener('change', handlePrivateModeSettingsChange);

    // 恢复选项
    const setupSecurityQuestionsBtn = document.getElementById('setupSecurityQuestionsBtn') as HTMLButtonElement;
    setupSecurityQuestionsBtn?.addEventListener('click', handleSetupSecurityQuestions);

    const generateBackupCodeBtn = document.getElementById('generateBackupCodeBtn') as HTMLButtonElement;
    generateBackupCodeBtn?.addEventListener('click', handleGenerateBackupCode);

    // 测试按钮
    const testBlurBtn = document.getElementById('testBlurBtn') as HTMLButtonElement;
    testBlurBtn?.addEventListener('click', handleTestBlur);
}

/**
 * 处理截图模式开关
 */
async function handleScreenshotModeToggle(event: Event): Promise<void> {
    const checkbox = event.target as HTMLInputElement;
    
    try {
        const privacyManager = getPrivacyManager();
        
        if (checkbox.checked) {
            await privacyManager.enableScreenshotMode();
            showToast('截图模式已启用', 'success');
        } else {
            await privacyManager.disableScreenshotMode();
            showToast('截图模式已禁用', 'success');
        }
    } catch (error) {
        console.error('Failed to toggle screenshot mode:', error);
        checkbox.checked = !checkbox.checked; // 回滚状态
        showToast('切换截图模式失败', 'error');
    }
}

/**
 * 处理模糊强度变化
 */
async function handleBlurIntensityChange(event: Event): Promise<void> {
    const slider = event.target as HTMLInputElement;
    const value = parseInt(slider.value);
    
    // 更新显示值
    const valueDisplay = document.getElementById('blurIntensityValue') as HTMLSpanElement;
    if (valueDisplay) {
        valueDisplay.textContent = value.toString();
    }

    // 保存设置
    try {
        const settings = await getSettings();
        settings.privacy.screenshotMode.blurIntensity = value;
        await saveSettings(settings);

        // 如果当前启用了模糊，立即应用新强度
        const privacyManager = getPrivacyManager();
        const state = privacyManager.getState();
        if (state.isBlurred) {
            // 重新应用模糊效果
            await privacyManager.disableScreenshotMode();
            await privacyManager.enableScreenshotMode();
        }
    } catch (error) {
        console.error('Failed to update blur intensity:', error);
    }
}

/**
 * 处理自动模糊触发条件变化
 */
async function handleAutoBlurTriggerChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    
    try {
        const settings = await getSettings();
        settings.privacy.screenshotMode.autoBlurTrigger = select.value as any;
        await saveSettings(settings);
        showToast('自动模糊设置已更新', 'success');
    } catch (error) {
        console.error('Failed to update auto blur trigger:', error);
        showToast('更新设置失败', 'error');
    }
}

/**
 * 处理截图模式其他设置变化
 */
async function handleScreenshotSettingsChange(): Promise<void> {
    try {
        const settings = await getSettings();
        
        const showEyeIcon = document.getElementById('showEyeIcon') as HTMLInputElement;
        const temporaryViewDuration = document.getElementById('temporaryViewDuration') as HTMLInputElement;
        
        if (showEyeIcon) {
            settings.privacy.screenshotMode.showEyeIcon = showEyeIcon.checked;
        }
        
        if (temporaryViewDuration) {
            settings.privacy.screenshotMode.temporaryViewDuration = parseInt(temporaryViewDuration.value);
        }
        
        await saveSettings(settings);
        showToast('截图模式设置已更新', 'success');
    } catch (error) {
        console.error('Failed to update screenshot settings:', error);
        showToast('更新设置失败', 'error');
    }
}

/**
 * 处理私密模式开关
 */
async function handlePrivateModeToggle(event: Event): Promise<void> {
    const checkbox = event.target as HTMLInputElement;
    
    try {
        const privacyManager = getPrivacyManager();
        
        if (checkbox.checked) {
            await privacyManager.enablePrivateMode();
            showToast('私密模式已启用', 'success');
        } else {
            await privacyManager.disablePrivateMode();
            showToast('私密模式已禁用', 'success');
        }
    } catch (error) {
        console.error('Failed to toggle private mode:', error);
        checkbox.checked = !checkbox.checked; // 回滚状态
        showToast(error.message || '切换私密模式失败', 'error');
    }
}

/**
 * 处理密码要求开关
 */
async function handleRequirePasswordToggle(event: Event): Promise<void> {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
        // 如果启用密码要求但没有设置密码，提示设置
        const settings = await getSettings();
        if (!settings.privacy.privateMode.passwordHash) {
            showToast('请先设置密码', 'warning');
            checkbox.checked = false;
            return;
        }
    }
    
    try {
        const settings = await getSettings();
        settings.privacy.privateMode.requirePassword = checkbox.checked;
        await saveSettings(settings);
        
        updatePasswordStatus(checkbox.checked && settings.privacy.privateMode.passwordHash !== '');
        showToast('密码要求设置已更新', 'success');
    } catch (error) {
        console.error('Failed to update password requirement:', error);
        showToast('更新设置失败', 'error');
    }
}

/**
 * 处理设置密码
 */
async function handleSetPassword(): Promise<void> {
    const password = prompt('请输入新密码（至少8位，包含大小写字母、数字）：');
    if (!password) return;

    const confirmPassword = prompt('请再次输入密码确认：');
    if (password !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    try {
        const privacyManager = getPrivacyManager();
        const result = await privacyManager.setPassword(password);
        
        if (result.success) {
            updatePasswordStatus(true);
            showToast('密码设置成功', 'success');
        } else {
            showToast(result.error || '密码设置失败', 'error');
        }
    } catch (error) {
        console.error('Failed to set password:', error);
        showToast('密码设置失败', 'error');
    }
}

/**
 * 处理更改密码
 */
async function handleChangePassword(): Promise<void> {
    const oldPassword = prompt('请输入当前密码：');
    if (!oldPassword) return;

    const newPassword = prompt('请输入新密码：');
    if (!newPassword) return;

    const confirmPassword = prompt('请再次输入新密码确认：');
    if (newPassword !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    try {
        const passwordService = getPasswordService();
        const settings = await getSettings();
        
        const result = await passwordService.changePassword(
            oldPassword,
            newPassword,
            settings.privacy.privateMode.passwordHash,
            settings.privacy.privateMode.passwordSalt
        );
        
        if (result.success && result.newHash && result.newSalt) {
            settings.privacy.privateMode.passwordHash = result.newHash;
            settings.privacy.privateMode.passwordSalt = result.newSalt;
            await saveSettings(settings);
            showToast('密码更改成功', 'success');
        } else {
            showToast(result.error || '密码更改失败', 'error');
        }
    } catch (error) {
        console.error('Failed to change password:', error);
        showToast('密码更改失败', 'error');
    }
}

/**
 * 处理私密模式其他设置变化
 */
async function handlePrivateModeSettingsChange(): Promise<void> {
    try {
        const settings = await getSettings();
        
        const sessionTimeout = document.getElementById('sessionTimeout') as HTMLInputElement;
        const lockOnTabLeave = document.getElementById('lockOnTabLeave') as HTMLInputElement;
        const lockOnExtensionClose = document.getElementById('lockOnExtensionClose') as HTMLInputElement;
        
        if (sessionTimeout) {
            settings.privacy.privateMode.sessionTimeout = parseInt(sessionTimeout.value);
        }
        
        if (lockOnTabLeave) {
            settings.privacy.privateMode.lockOnTabLeave = lockOnTabLeave.checked;
        }
        
        if (lockOnExtensionClose) {
            settings.privacy.privateMode.lockOnExtensionClose = lockOnExtensionClose.checked;
        }
        
        await saveSettings(settings);
        showToast('私密模式设置已更新', 'success');
    } catch (error) {
        console.error('Failed to update private mode settings:', error);
        showToast('更新设置失败', 'error');
    }
}

/**
 * 处理设置安全问题
 */
async function handleSetupSecurityQuestions(): Promise<void> {
    // 这里可以打开一个模态框来设置安全问题
    // 暂时使用简单的prompt实现
    showToast('安全问题设置功能开发中...', 'info');
}

/**
 * 处理生成备份恢复码
 */
async function handleGenerateBackupCode(): Promise<void> {
    try {
        const recoveryService = getRecoveryService();
        const backupCode = await recoveryService.generateBackupCode();
        
        // 显示备份码
        alert(`备份恢复码：${backupCode}\n\n请妥善保存此恢复码，它只会显示一次！`);
        
        await updateRecoveryOptionsStatus();
        showToast('备份恢复码已生成', 'success');
    } catch (error) {
        console.error('Failed to generate backup code:', error);
        showToast('生成备份恢复码失败', 'error');
    }
}

/**
 * 处理测试模糊效果
 */
async function handleTestBlur(): Promise<void> {
    try {
        const privacyManager = getPrivacyManager();
        await privacyManager.toggleBlur();
        
        const state = privacyManager.getState();
        showToast(state.isBlurred ? '模糊效果已应用' : '模糊效果已移除', 'info');
    } catch (error) {
        console.error('Failed to test blur:', error);
        showToast('测试模糊效果失败', 'error');
    }
}

/**
 * 更新密码状态显示
 */
function updatePasswordStatus(hasPassword: boolean): void {
    const passwordStatus = document.getElementById('passwordStatus') as HTMLElement;
    const setPasswordBtn = document.getElementById('setPasswordBtn') as HTMLButtonElement;
    const changePasswordBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
    
    if (passwordStatus) {
        passwordStatus.textContent = hasPassword ? '已设置' : '未设置';
        passwordStatus.className = hasPassword ? 'status-success' : 'status-warning';
    }
    
    if (setPasswordBtn) {
        setPasswordBtn.style.display = hasPassword ? 'none' : 'inline-block';
    }
    
    if (changePasswordBtn) {
        changePasswordBtn.style.display = hasPassword ? 'inline-block' : 'none';
    }
}

/**
 * 更新恢复选项状态
 */
async function updateRecoveryOptionsStatus(): Promise<void> {
    try {
        const recoveryService = getRecoveryService();
        const options = await recoveryService.getRecoveryOptions();
        
        const securityQuestionsStatus = document.getElementById('securityQuestionsStatus') as HTMLElement;
        const backupCodeStatus = document.getElementById('backupCodeStatus') as HTMLElement;
        
        if (securityQuestionsStatus) {
            securityQuestionsStatus.textContent = options.hasSecurityQuestions ? 
                `已设置 (${options.questionCount}个问题)` : '未设置';
            securityQuestionsStatus.className = options.hasSecurityQuestions ? 'status-success' : 'status-warning';
        }
        
        if (backupCodeStatus) {
            if (options.backupCodeUsed) {
                backupCodeStatus.textContent = '已使用';
                backupCodeStatus.className = 'status-warning';
            } else if (options.hasBackupCode) {
                backupCodeStatus.textContent = '已生成';
                backupCodeStatus.className = 'status-success';
            } else {
                backupCodeStatus.textContent = '未生成';
                backupCodeStatus.className = 'status-warning';
            }
        }
    } catch (error) {
        console.error('Failed to update recovery options status:', error);
    }
}
