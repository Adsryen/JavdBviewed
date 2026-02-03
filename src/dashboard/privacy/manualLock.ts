/**
 * 手动锁定按钮管理
 */

import { getPrivacyManager } from '../../services/privacy';
import { getSettings } from '../../utils/storage';
import { log } from '../../utils/logController';

export class ManualLockButton {
    private static instance: ManualLockButton;
    private buttonElement: HTMLElement | null = null;

    private constructor() {}

    public static getInstance(): ManualLockButton {
        if (!ManualLockButton.instance) {
            ManualLockButton.instance = new ManualLockButton();
        }
        return ManualLockButton.instance;
    }

    /**
     * 初始化手动锁定按钮
     */
    async initialize(): Promise<void> {
        this.buttonElement = document.getElementById('manual-lock-btn');

        if (!this.buttonElement) {
            console.warn('Manual lock button element not found');
            return;
        }

        console.log('Manual lock button element found');

        // 绑定点击事件
        this.buttonElement.addEventListener('click', () => {
            this.handleLock();
        });

        // 延迟检查，确保privacyManager已初始化
        setTimeout(() => {
            this.updateVisibility();
        }, 2000);

        // 监听设置变化
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes.settings) {
                this.updateVisibility();
            }
        });

        log.privacy('Manual lock button initialized');
    }

    /**
     * 更新按钮可见性
     */
    private async updateVisibility(): Promise<void> {
        console.log('Updating manual lock button visibility...');
        
        try {
            const settings = await getSettings();
            console.log('Settings loaded:', {
                privateModeEnabled: settings.privacy.privateMode.enabled
            });

            const privacyManager = getPrivacyManager();
            if (!privacyManager) {
                console.warn('Privacy manager not available yet');
                return;
            }

            const state = privacyManager.getState();
            console.log('Privacy state:', {
                isAuthenticated: state.isAuthenticated,
                isLocked: state.isLocked
            });

            // 只有在私密模式启用且已认证时才显示
            const shouldShow = settings.privacy.privateMode.enabled && 
                             state.isAuthenticated && 
                             !state.isLocked;

            console.log('Should show manual lock button:', shouldShow);

            if (this.buttonElement) {
                this.buttonElement.style.display = shouldShow ? 'inline-flex' : 'none';
                log.privacy('Manual lock button visibility updated:', shouldShow);
            }
        } catch (error) {
            console.error('Failed to update manual lock button visibility:', error);
        }
    }

    /**
     * 处理锁定
     */
    private async handleLock(): Promise<void> {
        try {
            const privacyManager = getPrivacyManager();
            await privacyManager.lock();
            log.privacy('Manual lock triggered');
        } catch (error) {
            console.error('Failed to manually lock:', error);
            alert('锁定失败，请重试');
        }
    }

    /**
     * 显示按钮
     */
    show(): void {
        if (this.buttonElement) {
            this.buttonElement.style.display = 'inline-flex';
        }
    }

    /**
     * 隐藏按钮
     */
    hide(): void {
        if (this.buttonElement) {
            this.buttonElement.style.display = 'none';
        }
    }
}

/**
 * 获取手动锁定按钮实例
 */
export function getManualLockButton(): ManualLockButton {
    return ManualLockButton.getInstance();
}

/**
 * 初始化手动锁定按钮
 */
export async function initializeManualLockButton(): Promise<void> {
    console.log('Initializing manual lock button...');
    const button = getManualLockButton();
    await button.initialize();

    // 监听隐私状态变化
    try {
        const privacyManager = getPrivacyManager();
        
        privacyManager.addEventListener('authenticated', () => {
            console.log('Privacy authenticated event - showing button');
            button.show();
        });

        privacyManager.addEventListener('locked', () => {
            console.log('Privacy locked event - hiding button');
            button.hide();
        });

        privacyManager.addEventListener('unlocked', () => {
            console.log('Privacy unlocked event - showing button');
            button.show();
        });
    } catch (error) {
        console.error('Failed to add privacy event listeners:', error);
    }
}
