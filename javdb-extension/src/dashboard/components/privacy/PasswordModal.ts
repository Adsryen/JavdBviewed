/**
 * 密码验证弹窗组件
 */

import { getPrivacyManager, getRecoveryService } from '../../../services/privacy';
import { showMessage } from '../../ui/toast';

export class PasswordModal {
    private modal: HTMLElement | null = null;
    private isVisible = false;
    private onSuccess?: () => void;
    private onCancel?: () => void;

    constructor() {
        this.createModal();
    }

    /**
     * 显示密码验证弹窗
     */
    show(options?: {
        title?: string;
        message?: string;
        onSuccess?: () => void;
        onCancel?: () => void;
    }): void {
        if (this.isVisible) {
            return;
        }

        this.onSuccess = options?.onSuccess;
        this.onCancel = options?.onCancel;

        // 更新标题和消息
        const titleElement = this.modal?.querySelector('.modal-title') as HTMLElement;
        const messageElement = this.modal?.querySelector('.modal-message') as HTMLElement;
        
        if (titleElement) {
            titleElement.textContent = options?.title || '密码验证';
        }
        
        if (messageElement) {
            messageElement.textContent = options?.message || '请输入密码以继续';
        }

        // 显示弹窗
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.isVisible = true;
            
            // 聚焦到密码输入框
            const passwordInput = this.modal.querySelector('#passwordInput') as HTMLInputElement;
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    /**
     * 隐藏弹窗
     */
    hide(): void {
        if (!this.isVisible) {
            return;
        }

        if (this.modal) {
            this.modal.style.display = 'none';
            this.isVisible = false;
        }

        // 清除回调
        this.onSuccess = undefined;
        this.onCancel = undefined;
    }

    /**
     * 创建弹窗HTML
     */
    private createModal(): void {
        this.modal = document.createElement('div');
        this.modal.className = 'privacy-modal-overlay';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        this.modal.innerHTML = `
            <div class="privacy-modal-content" style="
                background: white;
                border-radius: 8px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                position: relative;
            ">
                <h3 class="modal-title" style="
                    margin: 0 0 10px 0;
                    color: #333;
                    font-size: 18px;
                    font-weight: 600;
                ">密码验证</h3>
                
                <p class="modal-message" style="
                    margin: 0 0 20px 0;
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                ">请输入密码以继续</p>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <input type="password" id="passwordInput" placeholder="请输入密码" style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 14px;
                        box-sizing: border-box;
                        outline: none;
                        transition: border-color 0.3s ease;
                    ">
                </div>
                
                <div class="error-message" style="
                    color: #F44336;
                    font-size: 12px;
                    margin-bottom: 15px;
                    min-height: 16px;
                "></div>

                <div class="recovery-section" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                ">
                    <a href="#" class="forgot-link" style="
                        font-size: 12px;
                        color: #007bff;
                        text-decoration: none;
                    ">忘记密码？</a>
                    <div class="recovery-options" style="display: none; gap: 8px;">
                        <a href="#" class="recover-backup-link" style="font-size: 12px; color: #007bff; text-decoration: none;">使用备份码</a>
                        <span style="font-size: 12px; color: #999;">|</span>
                        <a href="#" class="recover-questions-link" style="font-size: 12px; color: #007bff; text-decoration: none;">回答安全问题</a>
                    </div>
                </div>
                
                <div class="modal-buttons" style="
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                ">
                    <button class="cancel-btn" style="
                        padding: 10px 20px;
                        border: 1px solid #ddd;
                        background: white;
                        color: #666;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s ease;
                    ">取消</button>
                    
                    <button class="confirm-btn" style="
                        padding: 10px 20px;
                        border: none;
                        background: #007bff;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s ease;
                    ">确认</button>
                </div>
            </div>
        `;

        // 绑定事件
        this.bindEvents();

        // 添加到页面
        document.body.appendChild(this.modal);
    }

    /**
     * 绑定事件
     */
    private bindEvents(): void {
        if (!this.modal) return;

        const passwordInput = this.modal.querySelector('#passwordInput') as HTMLInputElement;
        const cancelBtn = this.modal.querySelector('.cancel-btn') as HTMLButtonElement;
        const confirmBtn = this.modal.querySelector('.confirm-btn') as HTMLButtonElement;
        const overlay = this.modal;
        const forgotLink = this.modal.querySelector('.forgot-link') as HTMLAnchorElement;
        const recoverBackupLink = this.modal.querySelector('.recover-backup-link') as HTMLAnchorElement;
        const recoverQuestionsLink = this.modal.querySelector('.recover-questions-link') as HTMLAnchorElement;

        // 密码输入框事件
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleConfirm();
            } else if (e.key === 'Escape') {
                this.handleCancel();
            }
        });

        passwordInput.addEventListener('input', () => {
            this.clearError();
        });

        // 按钮事件
        cancelBtn.addEventListener('click', () => {
            this.handleCancel();
        });

        confirmBtn.addEventListener('click', () => {
            this.handleConfirm();
        });

        // 恢复相关
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleRecoveryOptions();
            });
        }
        if (recoverBackupLink) {
            recoverBackupLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleRecoverWithBackupCode();
            });
        }
        if (recoverQuestionsLink) {
            recoverQuestionsLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleRecoverWithSecurityQuestions();
            });
        }

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.handleCancel();
            }
        });

        // 添加按钮悬停效果
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = '#f5f5f5';
        });

        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'white';
        });

        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.background = '#0056b3';
        });

        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.background = '#007bff';
        });
    }

    /**
     * 处理确认
     */
    private async handleConfirm(): Promise<void> {
        const passwordInput = this.modal?.querySelector('#passwordInput') as HTMLInputElement;
        const password = passwordInput?.value;

        if (!password) {
            this.showError('请输入密码');
            return;
        }

        try {
            // 显示加载状态
            this.setLoading(true);

            const privacyManager = getPrivacyManager();
            const result = await privacyManager.authenticate(password);

            if (result.success) {
                this.hide();
                this.onSuccess?.();
                showMessage('验证成功', 'success');
            } else {
                this.showError(result.error || '密码错误');
                
                if (result.remainingAttempts !== undefined) {
                    this.showError(`密码错误，剩余尝试次数：${result.remainingAttempts}`);
                }
            }
        } catch (error) {
            console.error('Password verification failed:', error);
            this.showError('验证过程中发生错误');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 处理取消
     */
    private handleCancel(): void {
        this.hide();
        this.onCancel?.();
    }

    /**
     * 显示错误信息
     */
    private showError(message: string): void {
        const errorElement = this.modal?.querySelector('.error-message') as HTMLElement;
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    /**
     * 清除错误信息
     */
    private clearError(): void {
        const errorElement = this.modal?.querySelector('.error-message') as HTMLElement;
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    /**
     * 设置加载状态
     */
    private setLoading(loading: boolean): void {
        const confirmBtn = this.modal?.querySelector('.confirm-btn') as HTMLButtonElement;
        const passwordInput = this.modal?.querySelector('#passwordInput') as HTMLInputElement;

        if (confirmBtn) {
            confirmBtn.disabled = loading;
            confirmBtn.textContent = loading ? '验证中...' : '确认';
        }

        if (passwordInput) {
            passwordInput.disabled = loading;
        }
    }

    /**
     * 切换恢复选项显隐
     */
    private toggleRecoveryOptions(): void {
        const options = this.modal?.querySelector('.recovery-options') as HTMLElement;
        if (options) {
            options.style.display = options.style.display === 'none' ? 'flex' : 'none';
        }
    }

    /**
     * 使用备份码恢复
     */
    private async handleRecoverWithBackupCode(): Promise<void> {
        try {
            const code = prompt('请输入备份恢复码：') || '';
            if (!code) return;
            const recovery = getRecoveryService();
            const result = await recovery.performPasswordRecovery('backup-code', { code });
            if (!result.success) {
                this.showError(result.error || '备份码验证失败');
                return;
            }

            // 恢复成功后，引导重设密码
            await this.setNewPasswordFlow();
        } catch (e) {
            console.error('Recover with backup code failed:', e);
            this.showError('恢复失败，请重试');
        }
    }

    /**
     * 通过安全问题恢复
     */
    private async handleRecoverWithSecurityQuestions(): Promise<void> {
        try {
            const recovery = getRecoveryService();
            const questions = await recovery.getSecurityQuestions();
            if (!questions || questions.length === 0) {
                this.showError('未设置安全问题，请使用备份码');
                return;
            }

            const answers = [] as { id: string; answer: string }[];
            for (const q of questions) {
                const ans = prompt(`安全问题：${q.question}`) || '';
                if (!ans) {
                    this.showError('答案不能为空');
                    return;
                }
                answers.push({ id: q.id, answer: ans });
            }

            const result = await recovery.performPasswordRecovery('security-questions', { answers });
            if (!result.success) {
                this.showError(result.error || '安全问题验证失败');
                return;
            }

            // 恢复成功后，引导重设密码
            await this.setNewPasswordFlow();
        } catch (e) {
            console.error('Recover with security questions failed:', e);
            this.showError('恢复失败，请重试');
        }
    }

    /**
     * 恢复成功后重设密码并自动登录
     */
    private async setNewPasswordFlow(): Promise<void> {
        const newPwd = prompt('请输入新密码（至少6位）：') || '';
        if (!newPwd) return;
        const confirmPwd = prompt('请再次输入新密码以确认：') || '';
        if (newPwd !== confirmPwd) {
            this.showError('两次输入不一致');
            return;
        }

        try {
            const pm = getPrivacyManager();
            const ret = await pm.setPassword(newPwd);
            if (!ret.success) {
                this.showError(ret.error || '设置新密码失败');
                return;
            }

            // 自动使用新密码登录
            const auth = await pm.authenticate(newPwd);
            if (auth.success) {
                this.hide();
                this.onSuccess?.();
                showMessage('密码已重置并登录成功', 'success');
            } else {
                showMessage('密码已重置，请使用新密码登录', 'info');
            }
        } catch (e) {
            console.error('Set new password failed:', e);
            this.showError('设置新密码失败');
        }
    }

    /**
     * 销毁弹窗
     */
    destroy(): void {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
        this.isVisible = false;
        this.onSuccess = undefined;
        this.onCancel = undefined;
    }
}

// 全局实例
let globalPasswordModal: PasswordModal | null = null;

/**
 * 显示密码验证弹窗（Promise版本）
 */
export function showPasswordModal(
    mode: 'verify' | 'setup' = 'verify',
    options?: {
        title?: string;
        message?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        if (!globalPasswordModal) {
            globalPasswordModal = new PasswordModal();
        }
        
        globalPasswordModal.show({
            title: options?.title,
            message: options?.message,
            onSuccess: () => {
                resolve({ success: true });
            },
            onCancel: () => {
                resolve({ success: false, error: '用户取消' });
            }
        });
    });
}

/**
 * 隐藏密码验证弹窗
 */
export function hidePasswordModal(): void {
    if (globalPasswordModal) {
        globalPasswordModal.hide();
    }
}
