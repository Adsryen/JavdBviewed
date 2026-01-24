/**
 * 密码恢复模态框
 * 提供安全问题验证和备份码验证两种恢复方式
 */

import { getRecoveryService } from '../../../services/privacy';
import { showMessage } from '../../ui/toast';

interface RecoveryResult {
    success: boolean;
    method?: 'security-questions' | 'backup-code';
    newBackupCode?: string;
}

/**
 * 显示密码恢复模态框
 */
export async function showPasswordRecoveryModal(): Promise<RecoveryResult> {
    return new Promise(async (resolve) => {
        console.log('[PasswordRecoveryModal] Starting password recovery...');
        const recoveryService = getRecoveryService();
        
        // 检查可用的恢复选项
        console.log('[PasswordRecoveryModal] Checking recovery options...');
        const options = await recoveryService.getRecoveryOptions();
        console.log('[PasswordRecoveryModal] Recovery options:', options);
        
        if (!options.hasSecurityQuestions && !options.hasBackupCode) {
            console.warn('[PasswordRecoveryModal] No recovery options available');
            
            // 显示没有恢复选项的提示模态框
            showNoRecoveryOptionsModal(resolve);
            return;
        }

        // 创建模态框
        console.log('[PasswordRecoveryModal] Creating modal...');
        const modal = createRecoveryModal(options);
        document.body.appendChild(modal);
        console.log('[PasswordRecoveryModal] Modal appended to body');

        // 绑定事件
        bindRecoveryEvents(modal, options, resolve);
    });
}

/**
 * 显示没有恢复选项的提示模态框
 */
function showNoRecoveryOptionsModal(resolve: (result: RecoveryResult) => void): void {
    const modal = document.createElement('div');
    modal.className = 'password-recovery-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width: 650px; width: 90%;">
            <div class="modal-header">
                <h2>无法恢复密码</h2>
                <button class="modal-close" id="no-recovery-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 24px 0;">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" style="color: #f59e0b; margin-bottom: 24px;">
                        <path d="M12 2L2 22h20L12 2zm0 3.5L19.5 20h-15L12 5.5zM11 10v5h2v-5h-2zm0 6v2h2v-2h-2z" fill="currentColor"/>
                    </svg>
                    <h3 style="margin: 0 0 20px 0; color: #2d3748; font-size: 22px; font-weight: 600;">未设置密码恢复方式</h3>
                    <p style="color: #718096; margin: 0 0 28px 0; line-height: 1.8; font-size: 16px;">
                        您还没有设置任何密码恢复方式（安全问题或备份码）。<br>
                        如果忘记密码，将无法恢复访问权限。
                    </p>
                </div>

                <div style="background: #fff5f5; border-left: 4px solid #e53e3e; padding: 20px; border-radius: 8px; margin-bottom: 28px;">
                    <h4 style="margin: 0 0 16px 0; color: #c53030; font-size: 17px; display: flex; align-items: center; gap: 10px; font-weight: 600;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        可用选项
                    </h4>
                    <ul style="margin: 0; padding-left: 24px; color: #744210; line-height: 1.8; font-size: 15px;">
                        <li style="margin-bottom: 12px;"><strong>重置所有数据</strong>：清除所有扩展数据（包括观看记录、设置等），此操作不可逆</li>
                        <li><strong>记住密码</strong>：尝试回忆您设置的密码，或者联系管理员</li>
                    </ul>
                </div>

                <div style="background: #f7fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                    <h4 style="margin: 0 0 14px 0; color: #2d3748; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 24px;">💡</span>
                        重要建议
                    </h4>
                    <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.8;">
                        解锁后，请立即前往<strong style="color: #2d3748;">设置 → 隐私保护</strong>，设置安全问题或生成备份码，以便将来能够恢复密码。这样可以避免再次遇到此问题。
                    </p>
                </div>
            </div>
            <div class="modal-footer" style="padding: 24px;">
                <button class="btn-secondary" id="no-recovery-cancel" style="padding: 12px 28px; font-size: 15px;">取消</button>
                <button class="btn-danger" id="no-recovery-reset" style="padding: 12px 28px; font-size: 15px;">重置所有数据</button>
            </div>
        </div>
    `;

    // 注入样式
    injectRecoveryStyles();

    document.body.appendChild(modal);

    // 绑定事件
    const closeBtn = modal.querySelector('#no-recovery-close');
    const cancelBtn = modal.querySelector('#no-recovery-cancel');
    const resetBtn = modal.querySelector('#no-recovery-reset');

    const closeModal = () => {
        modal.remove();
        resolve({ success: false });
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    resetBtn?.addEventListener('click', async () => {
        const recoveryService = getRecoveryService();
        try {
            await recoveryService.resetAllData();
            modal.remove();
            resolve({ success: false });
        } catch (error) {
            console.error('Reset failed:', error);
        }
    });
}

/**
 * 创建恢复模态框
 */
function createRecoveryModal(options: any): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'password-recovery-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>密码恢复</h2>
                <button class="modal-close" id="recovery-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="recovery-tabs">
                    ${options.hasSecurityQuestions ? '<button class="recovery-tab active" data-tab="security">安全问题</button>' : ''}
                    ${options.hasBackupCode ? '<button class="recovery-tab" data-tab="backup">备份码</button>' : ''}
                </div>

                ${options.hasSecurityQuestions ? `
                <div class="recovery-panel" id="security-panel">
                    <p class="recovery-description">请回答您设置的安全问题</p>
                    <div id="security-questions-container"></div>
                    <button class="btn-primary" id="verify-security-btn">验证答案</button>
                </div>
                ` : ''}

                ${options.hasBackupCode ? `
                <div class="recovery-panel" id="backup-panel" style="display: none;">
                    <p class="recovery-description">请输入您的备份恢复码</p>
                    <input 
                        type="text" 
                        id="backup-code-input" 
                        class="recovery-input" 
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        maxlength="19"
                    />
                    <p class="recovery-hint">备份码格式：XXXX-XXXX-XXXX-XXXX</p>
                    <button class="btn-primary" id="verify-backup-btn">验证备份码</button>
                </div>
                ` : ''}

                <div class="recovery-warning">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 22h20L12 2zm0 3.5L19.5 20h-15L12 5.5zM11 10v5h2v-5h-2zm0 6v2h2v-2h-2z" fill="currentColor"/>
                    </svg>
                    <span>如果所有恢复方式都无法使用，您可能需要重置所有数据</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="recovery-cancel">取消</button>
                <button class="btn-danger" id="reset-all-data">重置所有数据</button>
            </div>
        </div>
    `;

    // 注入样式
    injectRecoveryStyles();

    return modal;
}

/**
 * 绑定恢复事件
 */
function bindRecoveryEvents(modal: HTMLElement, options: any, resolve: (result: RecoveryResult) => void): void {
    const recoveryService = getRecoveryService();

    // 关闭按钮
    const closeBtn = modal.querySelector('#recovery-close');
    const cancelBtn = modal.querySelector('#recovery-cancel');
    
    const closeModal = () => {
        modal.remove();
        resolve({ success: false });
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // 标签切换
    const tabs = modal.querySelectorAll('.recovery-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // 更新标签状态
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 切换面板
            modal.querySelectorAll('.recovery-panel').forEach(panel => {
                (panel as HTMLElement).style.display = 'none';
            });
            
            const targetPanel = modal.querySelector(`#${tabName}-panel`);
            if (targetPanel) {
                (targetPanel as HTMLElement).style.display = 'block';
            }
        });
    });

    // 加载安全问题
    if (options.hasSecurityQuestions) {
        loadSecurityQuestions(modal);
        
        const verifyBtn = modal.querySelector('#verify-security-btn');
        verifyBtn?.addEventListener('click', async () => {
            await handleSecurityQuestionsVerification(modal, resolve);
        });
    }

    // 备份码验证
    if (options.hasBackupCode) {
        const backupInput = modal.querySelector('#backup-code-input') as HTMLInputElement;
        const verifyBtn = modal.querySelector('#verify-backup-btn');

        // 格式化输入
        backupInput?.addEventListener('input', (e) => {
            const input = e.target as HTMLInputElement;
            let value = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            
            // 添加连字符
            if (value.length > 0) {
                value = value.match(/.{1,4}/g)?.join('-') || value;
            }
            
            input.value = value;
        });

        verifyBtn?.addEventListener('click', async () => {
            await handleBackupCodeVerification(modal, backupInput.value, resolve);
        });
    }

    // 重置所有数据
    const resetBtn = modal.querySelector('#reset-all-data');
    resetBtn?.addEventListener('click', async () => {
        try {
            await recoveryService.resetAllData();
            modal.remove();
            resolve({ success: false });
        } catch (error) {
            console.error('Reset failed:', error);
        }
    });
}

/**
 * 加载安全问题
 */
async function loadSecurityQuestions(modal: HTMLElement): Promise<void> {
    try {
        const recoveryService = getRecoveryService();
        const questions = await recoveryService.getSecurityQuestions();
        
        const container = modal.querySelector('#security-questions-container');
        if (!container) return;

        container.innerHTML = questions.map((q, index) => `
            <div class="security-question-item">
                <label class="security-question-label">${index + 1}. ${q.question}</label>
                <input 
                    type="text" 
                    class="recovery-input security-answer" 
                    data-question-id="${q.id}"
                    placeholder="请输入答案"
                />
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load security questions:', error);
        showMessage('加载安全问题失败', 'error');
    }
}

/**
 * 处理安全问题验证
 */
async function handleSecurityQuestionsVerification(
    modal: HTMLElement, 
    resolve: (result: RecoveryResult) => void
): Promise<void> {
    try {
        const recoveryService = getRecoveryService();
        const answerInputs = modal.querySelectorAll('.security-answer') as NodeListOf<HTMLInputElement>;
        
        const answers = Array.from(answerInputs).map(input => ({
            id: input.getAttribute('data-question-id') || '',
            answer: input.value.trim()
        }));

        // 验证是否所有问题都已回答
        if (answers.some(a => !a.answer)) {
            showMessage('请回答所有安全问题', 'warning');
            return;
        }

        // 验证答案
        const result = await recoveryService.performPasswordRecovery('security-questions', { answers });
        
        if (result.success) {
            showMessage('验证成功！', 'success');
            
            // 显示新的备份码
            if (result.newBackupCode) {
                alert(`验证成功！\n\n新的备份恢复码：\n${result.newBackupCode}\n\n请妥善保存此备份码！`);
            }
            
            modal.remove();
            resolve(result);
        } else {
            showMessage(result.error || '验证失败，请检查答案是否正确', 'error');
        }
    } catch (error) {
        console.error('Security questions verification failed:', error);
        showMessage('验证过程出错', 'error');
    }
}

/**
 * 处理备份码验证
 */
async function handleBackupCodeVerification(
    modal: HTMLElement,
    code: string,
    resolve: (result: RecoveryResult) => void
): Promise<void> {
    try {
        const recoveryService = getRecoveryService();
        
        if (!code || code.length < 16) {
            showMessage('请输入完整的备份码', 'warning');
            return;
        }

        // 验证备份码
        const result = await recoveryService.performPasswordRecovery('backup-code', { code });
        
        if (result.success) {
            showMessage('验证成功！', 'success');
            
            // 显示新的备份码
            if (result.newBackupCode) {
                alert(`验证成功！\n\n新的备份恢复码：\n${result.newBackupCode}\n\n请妥善保存此备份码！`);
            }
            
            modal.remove();
            resolve(result);
        } else {
            showMessage(result.error || '备份码无效或已使用', 'error');
        }
    } catch (error) {
        console.error('Backup code verification failed:', error);
        showMessage('验证过程出错', 'error');
    }
}

/**
 * 注入样式
 */
function injectRecoveryStyles(): void {
    const styleId = 'password-recovery-modal-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .password-recovery-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .password-recovery-modal .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
        }

        .password-recovery-modal .modal-content {
            position: relative;
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .password-recovery-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
        }

        .password-recovery-modal .modal-header h2 {
            margin: 0;
            font-size: 24px;
            color: #2d3748;
        }

        .password-recovery-modal .modal-close {
            background: none;
            border: none;
            font-size: 32px;
            color: #718096;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .password-recovery-modal .modal-close:hover {
            background: #f7fafc;
            color: #2d3748;
        }

        .password-recovery-modal .modal-body {
            padding: 24px;
        }

        .password-recovery-modal .recovery-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            border-bottom: 2px solid #e2e8f0;
        }

        .password-recovery-modal .recovery-tab {
            padding: 12px 24px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            color: #718096;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .password-recovery-modal .recovery-tab:hover {
            color: #667eea;
        }

        .password-recovery-modal .recovery-tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }

        .password-recovery-modal .recovery-panel {
            animation: panelFadeIn 0.3s ease;
        }

        @keyframes panelFadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        .password-recovery-modal .recovery-description {
            color: #718096;
            margin: 0 0 20px 0;
            font-size: 14px;
        }

        .password-recovery-modal .security-question-item {
            margin-bottom: 20px;
        }

        .password-recovery-modal .security-question-label {
            display: block;
            font-weight: 500;
            color: #2d3748;
            margin-bottom: 8px;
        }

        .password-recovery-modal .recovery-input {
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            outline: none;
            transition: all 0.2s;
            box-sizing: border-box;
        }

        .password-recovery-modal .recovery-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .password-recovery-modal .recovery-hint {
            font-size: 12px;
            color: #a0aec0;
            margin: 8px 0 16px 0;
        }

        .password-recovery-modal .recovery-warning {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: #fffaf0;
            border-left: 3px solid #d69e2e;
            border-radius: 6px;
            margin-top: 24px;
            color: #744210;
            font-size: 14px;
        }

        .password-recovery-modal .recovery-warning svg {
            flex-shrink: 0;
            margin-top: 2px;
        }

        .password-recovery-modal .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 24px;
            border-top: 1px solid #e2e8f0;
        }

        .password-recovery-modal .btn-primary,
        .password-recovery-modal .btn-secondary,
        .password-recovery-modal .btn-danger {
            padding: 10px 20px;
            font-size: 16px;
            font-weight: 500;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .password-recovery-modal .btn-primary {
            width: 100%;
            margin-top: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .password-recovery-modal .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .password-recovery-modal .btn-secondary {
            background: #e2e8f0;
            color: #2d3748;
        }

        .password-recovery-modal .btn-secondary:hover {
            background: #cbd5e0;
        }

        .password-recovery-modal .btn-danger {
            background: #fc8181;
            color: white;
        }

        .password-recovery-modal .btn-danger:hover {
            background: #f56565;
        }
    `;
    document.head.appendChild(style);
}
