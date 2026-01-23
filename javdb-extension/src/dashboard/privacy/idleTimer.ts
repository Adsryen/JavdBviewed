/**
 * 私密模式无操作倒计时显示
 */

import { getPrivacyManager } from '../../services/privacy';
import { log } from '../../utils/logController';

export class IdleTimerDisplay {
    private static instance: IdleTimerDisplay;
    private timerElement: HTMLElement | null = null;
    private timerTextElement: HTMLElement | null = null;
    private updateInterval: number | null = null;
    private isVisible = false;

    private constructor() {}

    public static getInstance(): IdleTimerDisplay {
        if (!IdleTimerDisplay.instance) {
            IdleTimerDisplay.instance = new IdleTimerDisplay();
        }
        return IdleTimerDisplay.instance;
    }

    /**
     * 初始化倒计时显示
     */
    initialize(): void {
        this.timerElement = document.getElementById('privacy-timer');
        this.timerTextElement = document.getElementById('privacy-timer-text');

        if (!this.timerElement || !this.timerTextElement) {
            console.warn('Privacy timer elements not found');
            return;
        }

        // 点击倒计时显示详细信息
        this.timerElement.addEventListener('click', () => {
            this.showTimerInfo();
        });

        // 检查是否需要显示倒计时
        this.checkAndStart();

        log.privacy('Idle timer display initialized');
    }

    /**
     * 检查并启动倒计时
     */
    private async checkAndStart(): Promise<void> {
        try {
            const privacyManager = getPrivacyManager();
            
            // 检查privacyManager是否已初始化
            if (!privacyManager) {
                console.warn('Privacy manager not initialized yet');
                // 延迟重试
                setTimeout(() => this.checkAndStart(), 1000);
                return;
            }

            const state = privacyManager.getState();

            // 只有在已认证且未锁定时才显示倒计时
            if (state.isAuthenticated && !state.isLocked) {
                this.start();
            } else {
                this.stop();
            }
        } catch (error) {
            console.error('Failed to check timer state:', error);
            // 延迟重试
            setTimeout(() => this.checkAndStart(), 1000);
        }
    }

    /**
     * 启动倒计时
     */
    start(): void {
        if (this.updateInterval) {
            return; // 已经在运行
        }

        this.show();
        this.updateTimer();

        // 每秒更新一次
        this.updateInterval = window.setInterval(() => {
            this.updateTimer();
        }, 1000);

        log.privacy('Idle timer started');
    }

    /**
     * 停止倒计时
     */
    stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.hide();
        log.privacy('Idle timer stopped');
    }

    /**
     * 更新倒计时显示
     */
    private updateTimer(): void {
        try {
            const privacyManager = getPrivacyManager();
            const sessionManager = privacyManager['sessionManager'];
            const sessionInfo = sessionManager.getSessionInfo();

            if (!sessionInfo.isValid) {
                this.stop();
                return;
            }

            // 计算距离上次活动的时间
            const now = Date.now();
            const idleTime = now - sessionInfo.lastActivity;
            const maxIdleTime = sessionManager['maxIdleTime'] * 60 * 1000; // 转换为毫秒
            const remainingTime = Math.max(0, maxIdleTime - idleTime);

            // 转换为分钟和秒
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);

            // 更新显示
            if (this.timerTextElement) {
                this.timerTextElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            // 如果剩余时间少于1分钟，添加警告样式
            if (this.timerElement) {
                if (remainingTime < 60000) {
                    this.timerElement.classList.add('warning');
                    this.timerElement.title = '即将自动锁定';
                } else {
                    this.timerElement.classList.remove('warning');
                    this.timerElement.title = `无操作超时倒计时\n点击查看详情`;
                }
            }
        } catch (error) {
            console.error('Failed to update timer:', error);
        }
    }

    /**
     * 显示倒计时
     */
    private show(): void {
        if (this.timerElement && !this.isVisible) {
            this.timerElement.style.display = 'flex';
            this.isVisible = true;
        }
    }

    /**
     * 隐藏倒计时
     */
    private hide(): void {
        if (this.timerElement && this.isVisible) {
            this.timerElement.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * 显示倒计时详细信息
     */
    private showTimerInfo(): void {
        try {
            const privacyManager = getPrivacyManager();
            const sessionManager = privacyManager['sessionManager'];
            const sessionInfo = sessionManager.getSessionInfo();

            const now = Date.now();
            const idleTime = now - sessionInfo.lastActivity;
            const maxIdleTime = sessionManager['maxIdleTime'] * 60 * 1000;
            const remainingTime = Math.max(0, maxIdleTime - idleTime);

            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);

            const message = `私密模式无操作倒计时\n\n` +
                `剩余时间：${minutes} 分 ${seconds} 秒\n` +
                `超时设置：${sessionManager['maxIdleTime']} 分钟\n\n` +
                `任何鼠标或键盘操作都会重置倒计时`;

            alert(message);
        } catch (error) {
            console.error('Failed to show timer info:', error);
        }
    }

    /**
     * 重置倒计时（当用户有活动时调用）
     */
    reset(): void {
        // 倒计时会自动根据 lastActivity 更新，这里只需要确保在运行
        if (!this.updateInterval) {
            this.checkAndStart();
        }
    }
}

/**
 * 获取倒计时显示实例
 */
export function getIdleTimerDisplay(): IdleTimerDisplay {
    return IdleTimerDisplay.getInstance();
}

/**
 * 初始化倒计时显示
 */
export function initializeIdleTimerDisplay(): void {
    const display = getIdleTimerDisplay();
    display.initialize();

    // 监听隐私状态变化
    const privacyManager = getPrivacyManager();
    
    privacyManager.addEventListener('authenticated', () => {
        display.start();
    });

    privacyManager.addEventListener('locked', () => {
        display.stop();
    });

    privacyManager.addEventListener('unlocked', () => {
        display.start();
    });
}
