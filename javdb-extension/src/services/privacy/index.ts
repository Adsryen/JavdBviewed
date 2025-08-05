/**
 * 隐私保护服务入口
 */

// 导出核心服务
export { PrivacyManager, getPrivacyManager } from './PrivacyManager';
export { PasswordService, getPasswordService } from './PasswordService';
export { SessionManager, getSessionManager } from './SessionManager';
export { BlurController, getBlurController } from './BlurController';
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

        const { getPrivacyManager } = await import('./PrivacyManager');
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
    const { getPrivacyManager } = await import('./PrivacyManager');
    const privacyManager = getPrivacyManager();
    await privacyManager.enableScreenshotMode();
}

/**
 * 快速禁用截图模式
 */
export async function disableScreenshotMode(): Promise<void> {
    const { getPrivacyManager } = await import('./PrivacyManager');
    const privacyManager = getPrivacyManager();
    await privacyManager.disableScreenshotMode();
}

/**
 * 快速切换模糊效果
 */
export async function toggleBlur(): Promise<void> {
    const { getPrivacyManager } = await import('./PrivacyManager');
    const privacyManager = getPrivacyManager();
    await privacyManager.toggleBlur();
}

/**
 * 快速锁定
 */
export async function lockPrivacy(): Promise<void> {
    const { getPrivacyManager } = await import('./PrivacyManager');
    const privacyManager = getPrivacyManager();
    await privacyManager.lock();
}

/**
 * 快速验证密码
 */
export async function authenticatePassword(password: string) {
    const { getPrivacyManager } = await import('./PrivacyManager');
    const privacyManager = getPrivacyManager();
    return await privacyManager.authenticate(password);
}

/**
 * 检查功能是否受限
 */
export async function isFeatureRestricted(feature: string): Promise<boolean> {
    const { getPrivacyManager } = await import('./PrivacyManager');
    const privacyManager = getPrivacyManager();
    return privacyManager.isFeatureRestricted(feature as any);
}

/**
 * 获取隐私状态
 */
export async function getPrivacyState() {
    const { getPrivacyManager } = await import('./PrivacyManager');
    const privacyManager = getPrivacyManager();
    return privacyManager.getState();
}
