/**
 * 隐私状态监听器
 */

import { getPrivacyManager } from '../../services/privacy';
import { getElementProtector } from './elementProtector';
import { PrivacyEvent, PrivacyEventType } from '../../types/privacy';

export class PrivacyStateListener {
    private static instance: PrivacyStateListener;
    private isListening = false;
    private eventHandlers: Map<PrivacyEventType, ((event: PrivacyEvent) => void)[]> = new Map();

    private constructor() {}

    public static getInstance(): PrivacyStateListener {
        if (!PrivacyStateListener.instance) {
            PrivacyStateListener.instance = new PrivacyStateListener();
        }
        return PrivacyStateListener.instance;
    }

    /**
     * 开始监听隐私状态变化
     */
    startListening(): void {
        if (this.isListening) {
            return;
        }

        try {
            const privacyManager = getPrivacyManager();
            
            // 监听各种隐私事件
            privacyManager.addEventListener('blur-applied', this.handleBlurApplied.bind(this));
            privacyManager.addEventListener('blur-removed', this.handleBlurRemoved.bind(this));
            privacyManager.addEventListener('locked', this.handleLocked.bind(this));
            privacyManager.addEventListener('unlocked', this.handleUnlocked.bind(this));
            privacyManager.addEventListener('authenticated', this.handleAuthenticated.bind(this));
            privacyManager.addEventListener('session-expired', this.handleSessionExpired.bind(this));
            privacyManager.addEventListener('password-changed', this.handlePasswordChanged.bind(this));

            // 监听页面事件
            this.setupPageEventListeners();

            this.isListening = true;
            console.log('Privacy state listener started');
        } catch (error) {
            console.error('Failed to start privacy state listener:', error);
        }
    }

    /**
     * 停止监听
     */
    stopListening(): void {
        if (!this.isListening) {
            return;
        }

        // 移除页面事件监听器
        this.removePageEventListeners();

        this.isListening = false;
        console.log('Privacy state listener stopped');
    }

    /**
     * 处理模糊应用事件
     */
    private handleBlurApplied(event: PrivacyEvent): void {
        console.log('Blur applied:', event.data);
        
        // 通知页面其他组件
        this.notifyPageComponents('privacy-blur-applied', event.data);
        
        // 更新页面样式
        document.body.classList.add('privacy-blur-active');
        
        // 触发自定义事件处理器
        this.triggerEventHandlers('blur-applied', event);
    }

    /**
     * 处理模糊移除事件
     */
    private handleBlurRemoved(event: PrivacyEvent): void {
        console.log('Blur removed:', event.data);
        
        // 通知页面其他组件
        this.notifyPageComponents('privacy-blur-removed', event.data);
        
        // 更新页面样式
        document.body.classList.remove('privacy-blur-active');
        
        // 触发自定义事件处理器
        this.triggerEventHandlers('blur-removed', event);
    }

    /**
     * 处理锁定事件
     */
    private handleLocked(event: PrivacyEvent): void {
        console.log('Privacy locked:', event.data);
        
        // 添加锁定样式
        document.body.classList.add('privacy-locked');
        
        // 禁用某些交互
        this.disableInteractions();
        
        // 显示锁定提示
        this.showLockNotification();
        
        // 触发自定义事件处理器
        this.triggerEventHandlers('locked', event);
    }

    /**
     * 处理解锁事件
     */
    private handleUnlocked(event: PrivacyEvent): void {
        console.log('Privacy unlocked:', event.data);
        
        // 移除锁定样式
        document.body.classList.remove('privacy-locked');
        
        // 恢复交互
        this.enableInteractions();
        
        // 隐藏锁定提示
        this.hideLockNotification();
        
        // 触发自定义事件处理器
        this.triggerEventHandlers('unlocked', event);
    }

    /**
     * 处理认证成功事件
     */
    private handleAuthenticated(event: PrivacyEvent): void {
        console.log('Authentication successful:', event.data);
        
        // 添加认证样式
        document.body.classList.add('privacy-authenticated');
        
        // 显示成功提示
        this.showNotification('认证成功', 'success');
        
        // 触发自定义事件处理器
        this.triggerEventHandlers('authenticated', event);
    }

    /**
     * 处理会话过期事件
     */
    private handleSessionExpired(event: PrivacyEvent): void {
        console.log('Session expired:', event.data);
        
        // 移除认证样式
        document.body.classList.remove('privacy-authenticated');
        
        // 显示过期提示
        this.showNotification('会话已过期，请重新验证', 'warning');
        
        // 触发自定义事件处理器
        this.triggerEventHandlers('session-expired', event);
    }

    /**
     * 处理密码更改事件
     */
    private handlePasswordChanged(event: PrivacyEvent): void {
        console.log('Password changed:', event.data);
        
        // 显示成功提示
        this.showNotification('密码已更新', 'success');
        
        // 触发自定义事件处理器
        this.triggerEventHandlers('password-changed', event);
    }

    /**
     * 设置页面事件监听器
     */
    private setupPageEventListeners(): void {
        // 监听键盘快捷键
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 监听右键菜单
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * 移除页面事件监听器
     */
    private removePageEventListeners(): void {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * 处理键盘事件
     */
    private async handleKeyDown(event: KeyboardEvent): Promise<void> {
        // Ctrl+Shift+P: 切换隐私模式
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
            event.preventDefault();
            try {
                const privacyManager = getPrivacyManager();
                await privacyManager.toggleBlur();
            } catch (error) {
                console.error('Failed to toggle privacy mode:', error);
            }
        }
        
        // Ctrl+Shift+L: 锁定
        if (event.ctrlKey && event.shiftKey && event.key === 'L') {
            event.preventDefault();
            try {
                const privacyManager = getPrivacyManager();
                await privacyManager.lock();
            } catch (error) {
                console.error('Failed to lock privacy:', error);
            }
        }
    }

    /**
     * 处理右键菜单
     */
    private handleContextMenu(event: MouseEvent): void {
        const privacyManager = getPrivacyManager();
        const state = privacyManager.getState();
        
        // 如果处于锁定状态，禁用右键菜单
        if (state.isLocked) {
            event.preventDefault();
        }
    }

    /**
     * 处理页面可见性变化
     */
    private async handleVisibilityChange(): Promise<void> {
        // 这个逻辑已经在 PrivacyManager 中处理了
        // 这里可以添加额外的页面级处理
    }

    /**
     * 禁用交互
     */
    private disableInteractions(): void {
        // 禁用选择
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        
        // 禁用拖拽
        document.body.style.webkitUserDrag = 'none';
        
        // 添加禁用样式
        const style = document.createElement('style');
        style.id = 'privacy-disable-interactions';
        style.textContent = `
            .privacy-locked * {
                pointer-events: none !important;
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
            }
            .privacy-locked input,
            .privacy-locked button,
            .privacy-locked a {
                pointer-events: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 恢复交互
     */
    private enableInteractions(): void {
        // 恢复选择
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.webkitUserDrag = '';
        
        // 移除禁用样式
        const style = document.getElementById('privacy-disable-interactions');
        if (style) {
            style.remove();
        }
    }

    /**
     * 显示锁定通知
     */
    private showLockNotification(): void {
        const notification = document.createElement('div');
        notification.id = 'privacy-lock-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            ">
                🔒 隐私模式已锁定
            </div>
        `;
        document.body.appendChild(notification);
    }

    /**
     * 隐藏锁定通知
     */
    private hideLockNotification(): void {
        const notification = document.getElementById('privacy-lock-notification');
        if (notification) {
            notification.remove();
        }
    }

    /**
     * 显示通知
     */
    private showNotification(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    /**
     * 通知页面组件
     */
    private notifyPageComponents(eventType: string, data: any): void {
        const customEvent = new CustomEvent(eventType, { detail: data });
        document.dispatchEvent(customEvent);
    }

    /**
     * 添加事件处理器
     */
    addEventListener(type: PrivacyEventType, handler: (event: PrivacyEvent) => void): void {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, []);
        }
        this.eventHandlers.get(type)!.push(handler);
    }

    /**
     * 移除事件处理器
     */
    removeEventListener(type: PrivacyEventType, handler: (event: PrivacyEvent) => void): void {
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * 触发自定义事件处理器
     */
    private triggerEventHandlers(type: PrivacyEventType, event: PrivacyEvent): void {
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error('Event handler error:', error);
                }
            });
        }
    }
}

/**
 * 获取隐私状态监听器实例
 */
export function getPrivacyStateListener(): PrivacyStateListener {
    return PrivacyStateListener.getInstance();
}
