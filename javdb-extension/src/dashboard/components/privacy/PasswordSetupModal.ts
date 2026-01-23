/**
 * 密码设置弹窗组件
 * 用于设置密码、修改密码、设置安全问题等
 */

import { getPrivacyManager, getPasswordService, getRecoveryService } from '../../../services/privacy';
import { showMessage } from '../../ui/toast';

type ModalMode = 'set-password' | 'change-password' | 'security-questions';

export class PasswordSetupModal {
    private modal: HTMLElement | null = null;
    private isVisible = false;
    private currentMode: ModalMode = 'set-password';
    private onSuccess?: () => void;
    private onCancel?: () => void;

    constructor() {
        this.createModal();
    }

    /**
     * 显示设置密码弹窗
     */
    showSetPassword(options?: {
        onSuccess?: () => void;
        onCancel?: () => void;
    }): void {
        this.currentMode = 'set-password';
        this.onSuccess = options?.onSuccess;
        this.onCancel = options?.onCancel;
        this.renderSetPasswordForm();
        this.show();
    }

    /**
     * 显示修改密码弹窗
     */
    showChangePassword(options?: {
        onSuccess?: () => void;
        onCancel?: () => void;
    }): void {
        this.currentMode = 'change-password';
        this.onSuccess = options?.onSuccess;
        this.onCancel = options?.onCancel;
        this.renderChangePasswordForm();
        this.show();
    }

    /**
     * 显示设置安全问题弹窗
     */
    showSecurityQuestions(options?: {
        onSuccess?: () => void;
        onCancel?: () => void;
    }): void {
        this.currentMode = 'security-questions';
        this.onSuccess = options?.onSuccess;
        this.onCancel = options?.onCancel;
        this.renderSecurityQuestionsForm();
        this.show();
    }

    /**
     * 显示弹窗
     */
    private show(): void {
        if (this.isVisible || !this.modal) {
            return;
        }

        this.modal.style.display = 'flex';
        this.isVisible = true;

        // 聚焦到第一个输入框
        setTimeout(() => {
            const firstInput = this.modal?.querySelector('input') as HTMLInputElement;
            firstInput?.focus();
        }, 100);
    }

    /**
     * 隐藏弹窗
     */
    hide(): void {
        if (!this.isVisible || !this.modal) {
            return;
        }

        this.modal.style.display = 'none';
        this.isVisible = false;
        this.clearForm();
    }

    /**
     * 创建弹窗容器
     */
    private createModal(): void {
        this.modal = document.createElement('div');
        this.modal.className = 'password-setup-modal-overlay';
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
            <div class="password-setup-modal-content" style="
                background: white;
                border-radius: 12px;
                padding: 32px;
                max-width: 480px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                position: relative;
            ">
                <div class="modal-form-container"></div>
            </div>
        `;

        // 绑定遮罩点击事件
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.handleCancel();
            }
        });

        document.body.appendChild(this.modal);
    }

    /**
     * 渲染设置密码表单
     */
    private renderSetPasswordForm(): void {
        const container = this.modal?.querySelector('.modal-form-container') as HTMLElement;
        if (!container) return;

        container.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 20px; font-weight: 600;">设置密码</h3>
            <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">请设置一个安全的密码来保护您的隐私数据</p>
            
            <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 500;">新密码</label>
                <input type="password" id="newPassword" placeholder="至少6位字符" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    outline: none;
                    transition: border-color 0.3s ease;
                ">
                <div class="password-strength" style="margin-top: 8px; font-size: 12px; color: #666;"></div>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 500;">确认密码</label>
                <input type="password" id="confirmPassword" placeholder="再次输入密码" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    outline: none;
                    transition: border-color 0.3s ease;
                ">
            </div>
            
            <div class="error-message" style="
                color: #F44336;
                font-size: 13px;
                margin-bottom: 16px;
                min-height: 18px;
            "></div>
            
            <div class="modal-buttons" style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="cancel-btn" style="
                    padding: 10px 24px;
                    border: 2px solid #e0e0e0;
                    background: white;
                    color: #666;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">取消</button>
                
                <button class="confirm-btn" style="
                    padding: 10px 24px;
                    border: none;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">确认设置</button>
            </div>
        `;

        this.bindSetPasswordEvents();
    }

    /**
     * 渲染修改密码表单
     */
    private renderChangePasswordForm(): void {
        const container = this.modal?.querySelector('.modal-form-container') as HTMLElement;
        if (!container) return;

        container.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 20px; font-weight: 600;">修改密码</h3>
            <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">请输入当前密码并设置新密码</p>
            
            <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 500;">当前密码</label>
                <input type="password" id="currentPassword" placeholder="请输入当前密码" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    outline: none;
                    transition: border-color 0.3s ease;
                ">
            </div>
            
            <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 500;">新密码</label>
                <input type="password" id="newPassword" placeholder="至少6位字符" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    outline: none;
                    transition: border-color 0.3s ease;
                ">
                <div class="password-strength" style="margin-top: 8px; font-size: 12px; color: #666;"></div>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 500;">确认新密码</label>
                <input type="password" id="confirmPassword" placeholder="再次输入新密码" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    outline: none;
                    transition: border-color 0.3s ease;
                ">
            </div>
            
            <div class="error-message" style="
                color: #F44336;
                font-size: 13px;
                margin-bottom: 16px;
                min-height: 18px;
            "></div>
            
            <div class="modal-buttons" style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="cancel-btn" style="
                    padding: 10px 24px;
                    border: 2px solid #e0e0e0;
                    background: white;
                    color: #666;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">取消</button>
                
                <button class="confirm-btn" style="
                    padding: 10px 24px;
                    border: none;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">确认修改</button>
            </div>
        `;

        this.bindChangePasswordEvents();
    }

    /**
     * 渲染设置安全问题表单
     */
    private renderSecurityQuestionsForm(): void {
        const container = this.modal?.querySelector('.modal-form-container') as HTMLElement;
        if (!container) return;

        container.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 20px; font-weight: 600;">设置安全问题</h3>
            <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">设置2-3个安全问题，用于密码找回</p>
            
            <div id="questions-container"></div>
            
            <div class="error-message" style="
                color: #F44336;
                font-size: 13px;
                margin-bottom: 16px;
                min-height: 18px;
            "></div>
            
            <div class="modal-buttons" style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="cancel-btn" style="
                    padding: 10px 24px;
                    border: 2px solid #e0e0e0;
                    background: white;
                    color: #666;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">取消</button>
                
                <button class="confirm-btn" style="
                    padding: 10px 24px;
                    border: none;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">确认设置</button>
            </div>
        `;

        // 添加2个问题表单
        this.addQuestionForm(1);
        this.addQuestionForm(2);

        this.bindSecurityQuestionsEvents();
    }

    /**
     * 添加问题表单
     */
    private addQuestionForm(index: number): void {
        const questionsContainer = this.modal?.querySelector('#questions-container') as HTMLElement;
        if (!questionsContainer) return;

        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-group';
        questionDiv.style.cssText = 'margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;';
        
        questionDiv.innerHTML = `
            <h4 style="margin: 0 0 12px 0; color: #333; font-size: 15px; font-weight: 600;">安全问题 ${index}</h4>
            
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 6px; color: #555; font-size: 13px;">问题</label>
                <textarea class="question-input" placeholder="例如：我最喜欢的电影是什么？" style="
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    outline: none;
                    background: white;
                    min-height: 60px;
                    resize: vertical;
                    font-family: inherit;
                "></textarea>
            </div>
            
            <div class="form-group">
                <label style="display: block; margin-bottom: 6px; color: #555; font-size: 13px;">答案</label>
                <textarea class="answer-input" placeholder="请输入答案" style="
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    outline: none;
                    background: white;
                    min-height: 60px;
                    resize: vertical;
                    font-family: inherit;
                "></textarea>
            </div>
        `;

        questionsContainer.appendChild(questionDiv);
    }

    /**
     * 绑定设置密码事件
     */
    private bindSetPasswordEvents(): void {
        const newPasswordInput = this.modal?.querySelector('#newPassword') as HTMLInputElement;
        const confirmPasswordInput = this.modal?.querySelector('#confirmPassword') as HTMLInputElement;
        const cancelBtn = this.modal?.querySelector('.cancel-btn') as HTMLButtonElement;
        const confirmBtn = this.modal?.querySelector('.confirm-btn') as HTMLButtonElement;

        // 密码强度检测
        newPasswordInput?.addEventListener('input', () => {
            this.updatePasswordStrength(newPasswordInput.value);
            this.clearError();
        });

        confirmPasswordInput?.addEventListener('input', () => {
            this.clearError();
        });

        // Enter 键提交
        confirmPasswordInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSetPassword();
            }
        });

        cancelBtn?.addEventListener('click', () => this.handleCancel());
        confirmBtn?.addEventListener('click', () => this.handleSetPassword());
    }

    /**
     * 绑定修改密码事件
     */
    private bindChangePasswordEvents(): void {
        const currentPasswordInput = this.modal?.querySelector('#currentPassword') as HTMLInputElement;
        const newPasswordInput = this.modal?.querySelector('#newPassword') as HTMLInputElement;
        const confirmPasswordInput = this.modal?.querySelector('#confirmPassword') as HTMLInputElement;
        const cancelBtn = this.modal?.querySelector('.cancel-btn') as HTMLButtonElement;
        const confirmBtn = this.modal?.querySelector('.confirm-btn') as HTMLButtonElement;

        // 密码强度检测
        newPasswordInput?.addEventListener('input', () => {
            this.updatePasswordStrength(newPasswordInput.value);
            this.clearError();
        });

        [currentPasswordInput, confirmPasswordInput].forEach(input => {
            input?.addEventListener('input', () => this.clearError());
        });

        // Enter 键提交
        confirmPasswordInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleChangePassword();
            }
        });

        cancelBtn?.addEventListener('click', () => this.handleCancel());
        confirmBtn?.addEventListener('click', () => this.handleChangePassword());
    }

    /**
     * 绑定安全问题事件
     */
    private bindSecurityQuestionsEvents(): void {
        const cancelBtn = this.modal?.querySelector('.cancel-btn') as HTMLButtonElement;
        const confirmBtn = this.modal?.querySelector('.confirm-btn') as HTMLButtonElement;

        const inputs = this.modal?.querySelectorAll('input');
        inputs?.forEach(input => {
            input.addEventListener('input', () => this.clearError());
        });

        cancelBtn?.addEventListener('click', () => this.handleCancel());
        confirmBtn?.addEventListener('click', () => this.handleSetSecurityQuestions());
    }

    /**
     * 处理设置密码
     */
    private async handleSetPassword(): Promise<void> {
        const newPasswordInput = this.modal?.querySelector('#newPassword') as HTMLInputElement;
        const confirmPasswordInput = this.modal?.querySelector('#confirmPassword') as HTMLInputElement;

        const newPassword = newPasswordInput?.value || '';
        const confirmPassword = confirmPasswordInput?.value || '';

        if (!newPassword) {
            this.showError('请输入密码');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('密码至少需要6位字符');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('两次输入的密码不一致');
            return;
        }

        // 检查密码强度
        const passwordService = getPasswordService();
        const strength = passwordService.validatePasswordStrength(newPassword);
        if (strength.score < 40) {
            this.showError('密码强度不足，请使用更复杂的密码（混合大小写、数字、符号）');
            return;
        }

        try {
            this.setLoading(true);

            const privacyManager = getPrivacyManager();
            const result = await privacyManager.setPassword(newPassword);

            if (result.success) {
                this.hide();
                this.onSuccess?.();
                showMessage('密码设置成功', 'success');
            } else {
                this.showError(result.error || '设置密码失败');
            }
        } catch (error) {
            console.error('Set password failed:', error);
            this.showError('设置密码失败，请重试');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 处理修改密码
     */
    private async handleChangePassword(): Promise<void> {
        const currentPasswordInput = this.modal?.querySelector('#currentPassword') as HTMLInputElement;
        const newPasswordInput = this.modal?.querySelector('#newPassword') as HTMLInputElement;
        const confirmPasswordInput = this.modal?.querySelector('#confirmPassword') as HTMLInputElement;

        const currentPassword = currentPasswordInput?.value || '';
        const newPassword = newPasswordInput?.value || '';
        const confirmPassword = confirmPasswordInput?.value || '';

        if (!currentPassword) {
            this.showError('请输入当前密码');
            return;
        }

        if (!newPassword) {
            this.showError('请输入新密码');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('新密码至少需要6位字符');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('两次输入的新密码不一致');
            return;
        }

        // 检查密码强度
        const passwordService = getPasswordService();
        const strength = passwordService.validatePasswordStrength(newPassword);
        if (strength.score < 40) {
            this.showError('密码强度不足，请使用更复杂的密码（混合大小写、数字、符号）');
            return;
        }

        try {
            this.setLoading(true);

            const result = await passwordService.changePasswordWithVerification(currentPassword, newPassword);

            if (result.success) {
                this.hide();
                this.onSuccess?.();
                showMessage('密码修改成功', 'success');
            } else {
                this.showError(result.error || '修改密码失败');
            }
        } catch (error) {
            console.error('Change password failed:', error);
            this.showError('修改密码失败，请重试');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 处理设置安全问题
     */
    private async handleSetSecurityQuestions(): Promise<void> {
        const questionGroups = this.modal?.querySelectorAll('.question-group');
        if (!questionGroups) return;

        const questionsData: Array<{ question: string; answer: string }> = [];

        for (const group of Array.from(questionGroups)) {
            const questionInput = group.querySelector('.question-input') as HTMLTextAreaElement;
            const answerInput = group.querySelector('.answer-input') as HTMLTextAreaElement;

            const question = questionInput?.value.trim() || '';
            const answer = answerInput?.value.trim() || '';

            if (!question || !answer) {
                this.showError('请填写所有问题和答案');
                return;
            }

            questionsData.push({ question, answer });
        }

        try {
            this.setLoading(true);

            const recoveryService = getRecoveryService();
            
            // 将问题和答案转换为 SecurityQuestion 类型（加密答案）
            const securityQuestions = [];
            for (const data of questionsData) {
                const sq = await recoveryService.createSecurityQuestion(data.question, data.answer);
                securityQuestions.push(sq);
            }
            
            await recoveryService.setupSecurityQuestions(securityQuestions);

            this.hide();
            this.onSuccess?.();
            showMessage('安全问题设置成功', 'success');
        } catch (error) {
            console.error('Setup security questions failed:', error);
            this.showError('设置安全问题失败，请重试');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 更新密码强度显示
     */
    private updatePasswordStrength(password: string): void {
        const strengthElement = this.modal?.querySelector('.password-strength') as HTMLElement;
        if (!strengthElement) return;

        if (!password) {
            strengthElement.textContent = '';
            return;
        }

        const passwordService = getPasswordService();
        const strength = passwordService.validatePasswordStrength(password);

        let color = '#F44336';
        let text = '弱';

        if (strength.score >= 70) {
            color = '#4CAF50';
            text = '强';
        } else if (strength.score >= 40) {
            color = '#FF9800';
            text = '中';
        }

        strengthElement.innerHTML = `密码强度：<span style="color: ${color}; font-weight: 600;">${text}</span>`;
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
        const inputs = this.modal?.querySelectorAll('input, textarea');

        if (confirmBtn) {
            confirmBtn.disabled = loading;
            const originalText = confirmBtn.textContent || '';
            if (loading) {
                confirmBtn.setAttribute('data-original-text', originalText);
                confirmBtn.textContent = '处理中...';
            } else {
                confirmBtn.textContent = confirmBtn.getAttribute('data-original-text') || originalText;
            }
        }

        inputs?.forEach(input => {
            (input as HTMLInputElement | HTMLTextAreaElement).disabled = loading;
        });
    }

    /**
     * 清除表单
     */
    private clearForm(): void {
        const inputs = this.modal?.querySelectorAll('input, textarea');
        inputs?.forEach(input => {
            (input as HTMLInputElement | HTMLTextAreaElement).value = '';
        });
        this.clearError();
    }

    /**
     * 处理取消
     */
    private handleCancel(): void {
        this.hide();
        this.onCancel?.();
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
let globalPasswordSetupModal: PasswordSetupModal | null = null;

/**
 * 获取全局实例
 */
function getGlobalModal(): PasswordSetupModal {
    if (!globalPasswordSetupModal) {
        globalPasswordSetupModal = new PasswordSetupModal();
    }
    return globalPasswordSetupModal;
}

/**
 * 显示设置密码弹窗
 */
export function showSetPasswordModal(options?: {
    onSuccess?: () => void;
    onCancel?: () => void;
}): void {
    getGlobalModal().showSetPassword(options);
}

/**
 * 显示修改密码弹窗
 */
export function showChangePasswordModal(options?: {
    onSuccess?: () => void;
    onCancel?: () => void;
}): void {
    getGlobalModal().showChangePassword(options);
}

/**
 * 显示设置安全问题弹窗
 */
export function showSecurityQuestionsModal(options?: {
    onSuccess?: () => void;
    onCancel?: () => void;
}): void {
    getGlobalModal().showSecurityQuestions(options);
}
