/**
 * 私密模式锁定屏幕
 * 全屏密码输入界面，完全遮挡内容
 */

import { getPrivacyManager } from './index';
import { showMessage } from '../../dashboard/ui/toast';
import { log } from '../../utils/logController';

export class LockScreen {
    private static instance: LockScreen;
    private lockScreenElement: HTMLElement | null = null;
    private isVisible = false;
    private attemptCount = 0;
    private maxAttempts = 5;
    private lockoutTime = 5 * 60 * 1000; // 5分钟锁定
    private lockoutEndTime = 0;

    private constructor() {}

    public static getInstance(): LockScreen {
        if (!LockScreen.instance) {
            LockScreen.instance = new LockScreen();
        }
        return LockScreen.instance;
    }

    /**
     * 显示锁定屏幕
     */
    show(): void {
        if (this.isVisible) {
            console.log('[LockScreen] Already visible, skipping');
            return;
        }

        console.log('[LockScreen] Showing lock screen...');
        console.log('[LockScreen] document.body exists:', !!document.body);
        log.privacy('Showing lock screen');

        // 确保 body 存在
        if (!document.body) {
            console.error('[LockScreen] document.body not available yet');
            // 等待 DOM 加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.show());
                return;
            }
        }

        // 先注入样式
        this.injectStyles();

        // 创建锁定屏幕元素
        this.lockScreenElement = this.createLockScreenElement();
        console.log('[LockScreen] Lock screen element created:', !!this.lockScreenElement);
        
        document.body.appendChild(this.lockScreenElement);
        console.log('[LockScreen] Lock screen element appended to body');
        console.log('[LockScreen] Element in DOM:', document.getElementById('privacy-lock-screen') !== null);
        
        this.isVisible = true;

        // 聚焦到密码输入框
        setTimeout(() => {
            const passwordInput = this.lockScreenElement?.querySelector('#lockscreen-password') as HTMLInputElement;
            if (passwordInput) {
                passwordInput.focus();
                console.log('[LockScreen] Password input focused');
            } else {
                console.warn('[LockScreen] Password input not found');
            }
        }, 100);
    }

    /**
     * 隐藏锁定屏幕
     */
    hide(): void {
        if (!this.isVisible || !this.lockScreenElement) {
            return;
        }

        log.privacy('Hiding lock screen');

        this.lockScreenElement.remove();
        this.lockScreenElement = null;
        this.isVisible = false;
        this.attemptCount = 0;
    }

    /**
     * 检查是否显示中
     */
    isShowing(): boolean {
        return this.isVisible;
    }

    /**
     * 创建锁定屏幕元素
     */
    private createLockScreenElement(): HTMLElement {
        console.log('[LockScreen] Creating lock screen element...');
        
        const container = document.createElement('div');
        container.id = 'privacy-lock-screen';
        container.innerHTML = `
            <div class="lock-screen-overlay"></div>
            <div class="lock-screen-content">
                <div class="lock-screen-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/>
                    </svg>
                </div>
                <h2 class="lock-screen-title">私密模式已锁定</h2>
                <p class="lock-screen-description">请输入密码以解锁</p>
                
                <form class="lock-screen-form" id="lockscreen-form">
                    <div class="lock-screen-input-group">
                        <input 
                            type="password" 
                            id="lockscreen-password" 
                            class="lock-screen-input" 
                            placeholder="请输入密码"
                            autocomplete="off"
                        />
                        <button type="button" class="lock-screen-toggle-password" id="toggle-password">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <div class="lock-screen-error" id="lockscreen-error"></div>
                    <div class="lock-screen-attempts" id="lockscreen-attempts"></div>
                    <button type="submit" class="lock-screen-submit" id="lockscreen-submit">
                        解锁
                    </button>
                </form>

                <div class="lock-screen-footer">
                    <a href="#" class="lock-screen-link" id="forgot-password">忘记密码？</a>
                </div>
            </div>
        `;

        console.log('[LockScreen] Lock screen HTML created');

        // 绑定事件
        this.bindEvents(container);
        console.log('[LockScreen] Events bound');

        return container;
    }

    /**
     * 绑定事件
     */
    private bindEvents(container: HTMLElement): void {
        const form = container.querySelector('#lockscreen-form') as HTMLFormElement;
        const passwordInput = container.querySelector('#lockscreen-password') as HTMLInputElement;
        const togglePasswordBtn = container.querySelector('#toggle-password') as HTMLButtonElement;
        const forgotPasswordLink = container.querySelector('#forgot-password') as HTMLAnchorElement;

        // 表单提交
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUnlock(passwordInput.value);
        });

        // 切换密码可见性
        togglePasswordBtn?.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            // 更新图标
            const eyeOpenSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>`;
            const eyeClosedSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/></svg>`;
            
            togglePasswordBtn.innerHTML = type === 'password' ? eyeOpenSVG : eyeClosedSVG;
        });

        // 忘记密码
        forgotPasswordLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // 阻止背景点击
        container.addEventListener('click', (e) => {
            if (e.target === container) {
                e.stopPropagation();
            }
        });
    }

    /**
     * 处理解锁
     */
    private async handleUnlock(password: string): Promise<void> {
        const errorElement = this.lockScreenElement?.querySelector('#lockscreen-error') as HTMLElement;
        const attemptsElement = this.lockScreenElement?.querySelector('#lockscreen-attempts') as HTMLElement;
        const submitButton = this.lockScreenElement?.querySelector('#lockscreen-submit') as HTMLButtonElement;
        const passwordInput = this.lockScreenElement?.querySelector('#lockscreen-password') as HTMLInputElement;

        // 检查是否在锁定期
        if (this.lockoutEndTime > Date.now()) {
            const remainingSeconds = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
            errorElement.textContent = `尝试次数过多，请等待 ${remainingSeconds} 秒后重试`;
            errorElement.style.display = 'block';
            return;
        }

        if (!password) {
            errorElement.textContent = '请输入密码';
            errorElement.style.display = 'block';
            return;
        }

        // 禁用按钮
        submitButton.disabled = true;
        submitButton.textContent = '验证中...';
        errorElement.style.display = 'none';

        try {
            const privacyManager = getPrivacyManager();
            const result = await privacyManager.authenticate(password);

            if (result.success) {
                // 解锁成功
                log.privacy('Unlock successful');
                showMessage('解锁成功', 'success');
                this.hide();
            } else {
                // 解锁失败
                this.attemptCount++;
                const remainingAttempts = this.maxAttempts - this.attemptCount;

                if (remainingAttempts <= 0) {
                    // 超过最大尝试次数，锁定
                    this.lockoutEndTime = Date.now() + this.lockoutTime;
                    errorElement.textContent = `尝试次数过多，已锁定 ${this.lockoutTime / 60000} 分钟`;
                    this.attemptCount = 0;
                } else {
                    errorElement.textContent = result.error || '密码错误';
                    attemptsElement.textContent = `剩余尝试次数：${remainingAttempts}`;
                    attemptsElement.style.display = 'block';
                }

                errorElement.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Unlock error:', error);
            errorElement.textContent = '解锁失败，请重试';
            errorElement.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '解锁';
        }
    }

    /**
     * 处理忘记密码
     */
    private handleForgotPassword(): void {
        showMessage('密码恢复功能开发中，请联系管理员', 'info');
        // TODO: 实现密码恢复功能
    }

    /**
     * 注入样式
     */
    private injectStyles(): void {
        const styleId = 'privacy-lock-screen-styles';
        if (document.getElementById(styleId)) {
            console.log('[LockScreen] Styles already injected');
            return;
        }

        console.log('[LockScreen] Injecting styles...');

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            #privacy-lock-screen {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .lock-screen-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                opacity: 1;
            }

            .lock-screen-content {
                position: relative;
                background: white;
                border-radius: 16px;
                padding: 48px 40px;
                max-width: 420px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                text-align: center;
                animation: lockScreenFadeIn 0.3s ease;
            }

            @keyframes lockScreenFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .lock-screen-icon {
                color: #667eea;
                margin-bottom: 24px;
            }

            .lock-screen-title {
                font-size: 28px;
                font-weight: 600;
                color: #2d3748;
                margin: 0 0 12px 0;
            }

            .lock-screen-description {
                font-size: 16px;
                color: #718096;
                margin: 0 0 32px 0;
            }

            .lock-screen-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .lock-screen-input-group {
                position: relative;
            }

            .lock-screen-input {
                width: 100%;
                padding: 14px 48px 14px 16px;
                font-size: 16px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                outline: none;
                transition: all 0.2s;
                box-sizing: border-box;
            }

            .lock-screen-input:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .lock-screen-toggle-password {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #718096;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s;
            }

            .lock-screen-toggle-password:hover {
                color: #667eea;
            }

            .lock-screen-error {
                display: none;
                color: #e53e3e;
                font-size: 14px;
                text-align: left;
                padding: 8px 12px;
                background: #fff5f5;
                border-radius: 6px;
                border-left: 3px solid #e53e3e;
            }

            .lock-screen-attempts {
                display: none;
                color: #d69e2e;
                font-size: 14px;
                text-align: left;
                padding: 8px 12px;
                background: #fffaf0;
                border-radius: 6px;
                border-left: 3px solid #d69e2e;
            }

            .lock-screen-submit {
                width: 100%;
                padding: 14px;
                font-size: 16px;
                font-weight: 600;
                color: white;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .lock-screen-submit:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .lock-screen-submit:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .lock-screen-footer {
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #e2e8f0;
            }

            .lock-screen-link {
                color: #667eea;
                text-decoration: none;
                font-size: 14px;
                transition: color 0.2s;
            }

            .lock-screen-link:hover {
                color: #764ba2;
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);
        console.log('[LockScreen] Styles injected successfully');
    }
}

/**
 * 获取锁定屏幕实例
 */
export function getLockScreen(): LockScreen {
    return LockScreen.getInstance();
}
