/**
 * 隐私保护服务入口
 */

// 导出核心服务
export { PrivacyManager, getPrivacyManager } from './PrivacyManager';
import { getPrivacyManager } from './PrivacyManager';
export { PasswordService, getPasswordService } from './PasswordService';
export { SessionManager, getSessionManager } from './SessionManager';
export { BlurController, getBlurController } from './BlurController';
export { LockScreen, getLockScreen } from './LockScreen';
export { RecoveryService, getRecoveryService } from './RecoveryService';

// 导出工具函数
export { getPrivacyStorage } from '../../utils/privacy/storage';
export { getPasswordValidator, InputValidator, SessionValidator } from '../../utils/privacy/validation';
export * from '../../utils/privacy/crypto';

// 导出类型定义
export * from '../../types/privacy';

/**
 * 初始化隐私保护系统
 */
export async function initializePrivacySystem(): Promise<void> {
    try {
        // 初始化隐私系统
        const privacyManager = getPrivacyManager();
        await privacyManager.initialize();

        // 暴露到全局以便调试和手动控制
        (window as any).privacyManager = privacyManager;
        // 隐私管理器已暴露到全局
        // 隐私系统初始化完成
    } catch (error) {
        console.error('Failed to initialize privacy system:', error);
        throw error;
    }
}

/**
 * 快速启用截图模式
 */
export async function enableScreenshotMode(): Promise<void> {
    const privacyManager = getPrivacyManager();
    await privacyManager.enableScreenshotMode();
}

/**
 * 快速禁用截图模式
 */
export async function disableScreenshotMode(): Promise<void> {
    const privacyManager = getPrivacyManager();
    await privacyManager.disableScreenshotMode();
}

/**
 * 快速切换模糊效果
 */
export async function toggleBlur(): Promise<void> {
    const privacyManager = getPrivacyManager();
    await privacyManager.toggleBlur();
}

/**
 * 快速锁定
 */
export async function lockPrivacy(): Promise<void> {
    const privacyManager = getPrivacyManager();
    await privacyManager.lock();
}

/**
 * 快速验证密码
 */
export async function authenticatePassword(password: string) {
    const privacyManager = getPrivacyManager();
    return await privacyManager.authenticate(password);
}

/**
 * 检查功能是否受限
 */
export async function isFeatureRestricted(feature: string): Promise<boolean> {
    const privacyManager = getPrivacyManager();
    return await privacyManager.isFeatureRestricted(feature as any);
}

/**
 * 获取隐私状态
 */
export async function getPrivacyState() {
    const privacyManager = getPrivacyManager();
    return privacyManager.getState();
}

/**
 * 统一受限功能拦截：如果功能不受限直接执行，否则弹出密码验证，通过后执行
 */
export async function requireAuthIfRestricted(
    feature: import('../../types/privacy').RestrictedFeature,
    action: () => Promise<void> | void,
    uiOptions?: { title?: string; message?: string }
): Promise<boolean> {
    const privacyManager = getPrivacyManager();
    const restricted = await privacyManager.isFeatureRestricted(feature as any);

    if (!restricted) {
        await action();
        return true;
    }

    // 动态引入 PasswordModal，仅在需要时加载
    try {
        const { showPasswordModal } = await import('../../dashboard/components/privacy/PasswordModal');
        return await new Promise<boolean>((resolve) => {
            showPasswordModal({
                title: uiOptions?.title || '需要密码验证',
                message: uiOptions?.message || '此操作受私密模式保护，请完成密码验证以继续。',
                onSuccess: async () => {
                    try {
                        await action();
                        resolve(true);
                    } catch (e) {
                        console.error('Restricted action failed after auth:', e);
                        resolve(false);
                    }
                },
                onCancel: () => resolve(false)
            });
        });
    } catch (e) {
        console.error('Failed to load PasswordModal for auth:', e);
        try {
            alert('需要密码验证，但验证弹窗加载失败。请前往设置页完成解锁后重试。');
        } catch {}
        return false;
    }
}
