/**
 * 隐私管理器 - 核心管理类
 */

import { 
    IPrivacyManager, 
    PrivacyState, 
    PrivacyConfig,
    PasswordVerificationResult,
    RestrictedFeature,
    PrivacyEvent,
    PrivacyEventType
} from '../../types/privacy';
import { getSettings, saveSettings } from '../../utils/storage';
import { getPasswordService } from './PasswordService';
import { getSessionManager } from './SessionManager';
import { getBlurController } from './BlurController';
import { getRecoveryService } from './RecoveryService';
import { log } from '../../utils/logController';
import { getPrivacyStorage } from '../../utils/privacy/storage';

export class PrivacyManager implements IPrivacyManager {
    private static instance: PrivacyManager;
    private passwordService = getPasswordService();
    private sessionManager = getSessionManager();
    private blurController = getBlurController();
    private recoveryService = getRecoveryService();
    private storage = getPrivacyStorage();
    
    private currentState: PrivacyState = {
        isBlurred: false,
        isLocked: false,
        isAuthenticated: false,
        sessionStartTime: 0,
        lastActivity: Date.now(),
        temporaryViewActive: false,
        temporaryViewEndTime: 0
    };

    private eventListeners: Map<PrivacyEventType, ((event: PrivacyEvent) => void)[]> = new Map();
    private isInitialized = false;

    private constructor() {}

    public static getInstance(): PrivacyManager {
        if (!PrivacyManager.instance) {
            PrivacyManager.instance = new PrivacyManager();
        }
        return PrivacyManager.instance;
    }

    /**
     * 初始化隐私管理器
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            log.privacy('Initializing Privacy Manager...');

            // 加载隐私状态
            await this.loadPrivacyState();

            // 设置事件监听
            this.setupEventListeners();

            // 恢复会话（如果有效）
            const sessionRestored = await this.sessionManager.restoreSession();
            if (sessionRestored) {
                this.currentState.isAuthenticated = true;
                this.currentState.sessionStartTime = this.sessionManager.getSessionInfo().startTime;
            }

            // 根据配置应用初始状态
            await this.applyInitialState();

            this.isInitialized = true;
            log.privacy('Privacy Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Privacy Manager:', error);
            throw new Error('隐私管理器初始化失败');
        }
    }

    /**
     * 启用截图模式
     */
    async enableScreenshotMode(): Promise<void> {
        try {
            const settings = await getSettings();
            settings.privacy.screenshotMode.enabled = true;
            await saveSettings(settings);

            log.privacy('Enabling screenshot mode with elements:', settings.privacy.screenshotMode.protectedElements);
            await this.blurController.applyBlur(settings.privacy.screenshotMode.protectedElements);

            this.currentState.isBlurred = true;
            await this.savePrivacyState();

            this.emitEvent('blur-applied', { mode: 'screenshot' });
            log.privacy('Screenshot mode enabled');
        } catch (error) {
            console.error('Failed to enable screenshot mode:', error);
            throw new Error('启用截图模式失败');
        }
    }

    /**
     * 禁用截图模式
     */
    async disableScreenshotMode(): Promise<void> {
        try {
            const settings = await getSettings();
            settings.privacy.screenshotMode.enabled = false;
            await saveSettings(settings);

            await this.blurController.removeBlur();

            this.currentState.isBlurred = false;
            await this.savePrivacyState();

            this.emitEvent('blur-removed', { mode: 'screenshot' });
            log.privacy('Screenshot mode disabled');
        } catch (error) {
            console.error('Failed to disable screenshot mode:', error);
            throw new Error('禁用截图模式失败');
        }
    }

    /**
     * 强制重新应用截图模式（用于修复遗漏的元素）
     */
    async forceReapplyScreenshotMode(): Promise<void> {
        try {
            const settings = await getSettings();
            if (!settings.privacy.screenshotMode.enabled) {
                log.privacy('Screenshot mode not enabled, skipping force reapply');
                return;
            }

            log.privacy('Force reapplying screenshot mode...');
            await this.blurController.forceReapplyBlur(settings.privacy.screenshotMode.protectedElements);

            this.currentState.isBlurred = true;
            await this.savePrivacyState();

            this.emitEvent('blur-applied', { mode: 'screenshot-force' });
            log.privacy('Screenshot mode force reapplied successfully');
        } catch (error) {
            console.error('Failed to force reapply screenshot mode:', error);
            throw new Error('强制重新应用截图模式失败');
        }
    }

    /**
     * 更新截图模式设置
     */
    async updateScreenshotSettings(updates: Partial<{
        blurIntensity: number;
        autoBlurTrigger: string;
        showEyeIcon: boolean;
        temporaryViewDuration: number;
    }>): Promise<void> {
        try {
            const settings = await getSettings();

            // 更新设置
            if (updates.blurIntensity !== undefined) {
                settings.privacy.screenshotMode.blurIntensity = updates.blurIntensity;
                // 立即更新模糊控制器的强度
                this.blurController.setBlurIntensity(updates.blurIntensity);
            }

            if (updates.autoBlurTrigger !== undefined) {
                settings.privacy.screenshotMode.autoBlurTrigger = updates.autoBlurTrigger as any;
            }

            if (updates.showEyeIcon !== undefined) {
                settings.privacy.screenshotMode.showEyeIcon = updates.showEyeIcon;
            }

            if (updates.temporaryViewDuration !== undefined) {
                settings.privacy.screenshotMode.temporaryViewDuration = updates.temporaryViewDuration;
            }

            // 保存设置
            await saveSettings(settings);

            // 如果截图模式已启用，重新应用模糊效果以使用新设置
            if (settings.privacy.screenshotMode.enabled && this.currentState.isBlurred) {
                await this.blurController.forceReapplyBlur(settings.privacy.screenshotMode.protectedElements);
            }

            log.privacy('Screenshot settings updated:', updates);
        } catch (error) {
            console.error('Failed to update screenshot settings:', error);
            throw new Error('更新截图设置失败');
        }
    }

    /**
     * 切换模糊效果
     */
    async toggleBlur(): Promise<void> {
        if (this.currentState.isBlurred) {
            await this.disableScreenshotMode();
        } else {
            await this.enableScreenshotMode();
        }
    }

    /**
     * 启用私密模式
     */
    async enablePrivateMode(): Promise<void> {
        try {
            const settings = await getSettings();
            
            // 检查是否设置了密码
            if (settings.privacy.privateMode.requirePassword && !settings.privacy.privateMode.passwordHash) {
                throw new Error('请先设置密码');
            }

            settings.privacy.privateMode.enabled = true;
            await saveSettings(settings);

            // 如果需要密码验证且未认证，则锁定
            if (settings.privacy.privateMode.requirePassword && !this.currentState.isAuthenticated) {
                await this.lock();
            } else {
                // 启用截图模式
                await this.enableScreenshotMode();
            }

            log.privacy('Private mode enabled');
        } catch (error) {
            console.error('Failed to enable private mode:', error);
            throw error;
        }
    }

    /**
     * 禁用私密模式
     */
    async disablePrivateMode(): Promise<void> {
        try {
            const settings = await getSettings();
            settings.privacy.privateMode.enabled = false;
            await saveSettings(settings);

            // 解锁并移除模糊
            this.currentState.isLocked = false;
            await this.disableScreenshotMode();
            await this.savePrivacyState();

            this.emitEvent('unlocked', { mode: 'private' });
            log.privacy('Private mode disabled');
        } catch (error) {
            console.error('Failed to disable private mode:', error);
            throw new Error('禁用私密模式失败');
        }
    }

    /**
     * 更新私密模式设置
     */
    async updatePrivateModeSettings(updates: Partial<{
        sessionTimeout: number;
        lockOnTabLeave: boolean;
        lockOnExtensionClose: boolean;
    }>): Promise<void> {
        try {
            const settings = await getSettings();

            // 更新设置
            if (updates.sessionTimeout !== undefined) {
                settings.privacy.privateMode.sessionTimeout = updates.sessionTimeout;
                // 如果会话正在运行，重新启动会话以应用新的超时时间
                if (this.currentState.isAuthenticated) {
                    await this.sessionManager.startSession(updates.sessionTimeout);
                }
            }

            if (updates.lockOnTabLeave !== undefined) {
                settings.privacy.privateMode.lockOnTabLeave = updates.lockOnTabLeave;
            }

            if (updates.lockOnExtensionClose !== undefined) {
                settings.privacy.privateMode.lockOnExtensionClose = updates.lockOnExtensionClose;
            }

            // 保存设置
            await saveSettings(settings);

            log.privacy('Private mode settings updated:', updates);
        } catch (error) {
            console.error('Failed to update private mode settings:', error);
            throw new Error('更新私密模式设置失败');
        }
    }

    /**
     * 密码验证
     */
    async authenticate(password: string): Promise<PasswordVerificationResult> {
        try {
            const settings = await getSettings();
            const privateMode = settings.privacy.privateMode;

            if (!privateMode.passwordHash || !privateMode.passwordSalt) {
                return {
                    success: false,
                    error: '未设置密码'
                };
            }

            const result = await this.passwordService.verifyPasswordWithLimits(
                password,
                privateMode.passwordHash,
                privateMode.passwordSalt
            );

            if (result.success) {
                // 启动会话
                await this.sessionManager.startSession(privateMode.sessionTimeout);
                
                this.currentState.isAuthenticated = true;
                this.currentState.isLocked = false;
                this.currentState.sessionStartTime = Date.now();
                
                await this.savePrivacyState();

                // 移除模糊效果（如果不是截图模式）
                if (!settings.privacy.screenshotMode.enabled) {
                    await this.blurController.removeBlur();
                    this.currentState.isBlurred = false;
                }

                this.emitEvent('authenticated', {});
                log.privacy('Authentication successful');
            }

            return result;
        } catch (error) {
            console.error('Authentication failed:', error);
            return {
                success: false,
                error: '验证过程中发生错误'
            };
        }
    }

    /**
     * 锁定
     */
    async lock(): Promise<void> {
        try {
            // 结束会话
            await this.sessionManager.endSession();

            // 应用模糊效果
            await this.blurController.applyBlur();

            this.currentState.isLocked = true;
            this.currentState.isAuthenticated = false;
            this.currentState.isBlurred = true;
            this.currentState.sessionStartTime = 0;

            await this.savePrivacyState();

            this.emitEvent('locked', {});
            // 隐私已锁定
        } catch (error) {
            console.error('Failed to lock:', error);
            throw new Error('锁定失败');
        }
    }

    /**
     * 获取当前状态
     */
    getState(): PrivacyState {
        return { ...this.currentState };
    }

    /**
     * 检查功能是否受限
     */
    isFeatureRestricted(feature: RestrictedFeature): boolean {
        // 如果未启用私密模式，不限制任何功能
        if (!this.isPrivateModeEnabled()) {
            return false;
        }

        // 如果已认证，不限制功能
        if (this.currentState.isAuthenticated) {
            return false;
        }

        // 检查功能是否在受限列表中
        return this.getRestrictedFeatures().includes(feature);
    }

    /**
     * 添加事件监听器
     */
    addEventListener(type: PrivacyEventType, listener: (event: PrivacyEvent) => void): void {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, []);
        }
        this.eventListeners.get(type)!.push(listener);
    }

    /**
     * 移除事件监听器
     */
    removeEventListener(type: PrivacyEventType, listener: (event: PrivacyEvent) => void): void {
        const listeners = this.eventListeners.get(type);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 设置密码
     */
    async setPassword(password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const strength = this.passwordService.validatePasswordStrength(password);
            if (strength.score < 40) {
                return {
                    success: false,
                    error: '密码强度不足'
                };
            }

            const { hash, salt } = await this.passwordService.hashPassword(password);
            
            const settings = await getSettings();
            settings.privacy.privateMode.passwordHash = hash;
            settings.privacy.privateMode.passwordSalt = salt;
            settings.privacy.privateMode.requirePassword = true;
            
            await saveSettings(settings);

            this.emitEvent('password-changed', {});
            log.privacy('Password set successfully');

            return { success: true };
        } catch (error) {
            console.error('Failed to set password:', error);
            return {
                success: false,
                error: '设置密码失败'
            };
        }
    }

    /**
     * 加载隐私状态
     */
    private async loadPrivacyState(): Promise<void> {
        try {
            const state = await this.storage.loadPrivacyState();
            if (state) {
                this.currentState = { ...this.currentState, ...state };
            }
        } catch (error) {
            console.error('Failed to load privacy state:', error);
        }
    }

    /**
     * 保存隐私状态
     */
    private async savePrivacyState(): Promise<void> {
        try {
            this.currentState.lastActivity = Date.now();
            await this.storage.savePrivacyState(this.currentState);
        } catch (error) {
            console.error('Failed to save privacy state:', error);
        }
    }

    /**
     * 设置事件监听
     */
    private setupEventListeners(): void {
        // 监听会话过期
        this.sessionManager.addEventListener('session-expired', () => {
            this.lock();
        });

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // 监听窗口焦点变化
        window.addEventListener('blur', () => {
            this.handleWindowBlur();
        });

        window.addEventListener('focus', () => {
            this.handleWindowFocus();
        });
    }

    /**
     * 应用初始状态
     */
    private async applyInitialState(): Promise<void> {
        // 延迟一点时间确保DOM完全加载
        await new Promise(resolve => setTimeout(resolve, 500));

        const settings = await getSettings();

        log.privacy('Applying initial privacy state:', {
            screenshotModeEnabled: settings.privacy.screenshotMode.enabled,
            privateModeEnabled: settings.privacy.privateMode.enabled,
            requirePassword: settings.privacy.privateMode.requirePassword,
            isAuthenticated: this.currentState.isAuthenticated,
            protectedElements: settings.privacy.screenshotMode.protectedElements
        });

        // 如果启用了私密模式且需要密码但未认证，则锁定
        if (settings.privacy.privateMode.enabled &&
            settings.privacy.privateMode.requirePassword &&
            !this.currentState.isAuthenticated) {
            log.privacy('Locking due to private mode requirements');
            await this.lock();
        }
        // 如果启用了截图模式，应用模糊
        else if (settings.privacy.screenshotMode.enabled) {
            // 应用初始截图模式

            // 确保使用最新的配置
            await this.blurController.applyBlur(settings.privacy.screenshotMode.protectedElements);
            this.currentState.isBlurred = true;
            await this.savePrivacyState();

            // 初始截图模式应用完成
        } else {
            // 未启用隐私模式
        }
    }

    /**
     * 处理页面可见性变化
     */
    private async handleVisibilityChange(): Promise<void> {
        const settings = await getSettings();
        
        if (document.hidden) {
            // 页面隐藏时的处理
            if (settings.privacy.screenshotMode.autoBlurTrigger === 'tab-leave') {
                await this.enableScreenshotMode();
            }
            
            if (settings.privacy.privateMode.lockOnTabLeave && settings.privacy.privateMode.enabled) {
                await this.lock();
            }
        }
    }

    /**
     * 处理窗口失去焦点
     */
    private async handleWindowBlur(): Promise<void> {
        // 可以在这里添加失去焦点时的处理逻辑
    }

    /**
     * 处理窗口获得焦点
     */
    private async handleWindowFocus(): Promise<void> {
        // 可以在这里添加获得焦点时的处理逻辑
    }

    /**
     * 检查是否启用私密模式
     */
    private async isPrivateModeEnabled(): Promise<boolean> {
        const settings = await getSettings();
        return settings.privacy.privateMode.enabled;
    }

    /**
     * 获取受限功能列表
     */
    private async getRestrictedFeatures(): Promise<RestrictedFeature[]> {
        const settings = await getSettings();
        return settings.privacy.privateMode.restrictedFeatures;
    }

    /**
     * 触发事件
     */
    private emitEvent(type: PrivacyEventType, data?: any): void {
        const listeners = this.eventListeners.get(type);
        if (listeners) {
            const event: PrivacyEvent = {
                type,
                timestamp: Date.now(),
                data
            };

            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Event listener error:', error);
                }
            });
        }
    }
}

/**
 * 获取隐私管理器实例
 */
export function getPrivacyManager(): PrivacyManager {
    return PrivacyManager.getInstance();
}
