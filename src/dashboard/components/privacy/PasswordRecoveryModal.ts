/**
 * 密码恢复模态框
 * 提供安全问题验证和备份码验证两种恢复方式
 */

import { getRecoveryService } from '../../../features/privacy';
import { showMessage } from '../../ui/toast';

interface RecoveryResult {
    success: boolean;
    method?: 'security-questions' | 'backup-code' | 'email' | 'data-reset';
    newBackupCode?: string;
    error?: string;
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
            
            // 显示没有恢复选项的提示模态框（但仍可通过备份文件恢复）
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
                    ${options.hasBackupCode ? `<button class="recovery-tab${!options.hasSecurityQuestions ? ' active' : ''}" data-tab="backup">备份码</button>` : ''}
                    <button class="recovery-tab${!options.hasSecurityQuestions && !options.hasBackupCode ? ' active' : ''}" data-tab="file">备份文件</button>
                </div>

                ${options.hasSecurityQuestions ? `
                <div class="recovery-panel" id="security-panel">
                    <p class="recovery-description">请回答您设置的安全问题</p>
                    <div id="security-questions-container"></div>
                    <button class="btn-primary" id="verify-security-btn">验证答案</button>
                </div>
                ` : ''}

                ${options.hasBackupCode ? `
                <div class="recovery-panel" id="backup-panel" style="display: ${!options.hasSecurityQuestions ? 'block' : 'none'};">
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

                <div class="recovery-panel" id="file-panel" style="display: ${!options.hasSecurityQuestions && !options.hasBackupCode ? 'block' : 'none'};">
                    <p class="recovery-description">上传包含备份码的 WebDAV 备份文件</p>
                    
                    <div class="file-upload-hint">
                        <p><strong>💡 提示：</strong>备份文件中包含加密的备份码，系统会自动解密并验证。</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <input 
                            type="file" 
                            id="backup-file-input" 
                            accept=".json,.zip"
                            style="display: none;"
                        />
                        <button class="file-select-btn" id="select-backup-file-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            选择备份文件
                        </button>
                        <p id="selected-file-name" style="margin-top: 12px; color: #666; font-size: 14px; text-align: center;"></p>
                    </div>
                    <button class="btn-primary" id="verify-file-btn" disabled>验证备份文件</button>
                </div>

                <!-- 无法恢复的帮助区域 -->
                <div class="recovery-help-section">
                    <button class="recovery-help-toggle" id="show-reset-option">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        无法通过以上方式恢复？
                    </button>
                    
                    <div class="reset-data-section" id="reset-data-section" style="display: none;">
                        <div class="reset-warning-box">
                            <div class="reset-warning-icon">⚠️</div>
                            <div class="reset-warning-content">
                                <h4>重置所有数据</h4>
                                <p>此操作将清除所有扩展数据，包括：</p>
                                <ul>
                                    <li>所有观看记录和收藏</li>
                                    <li>所有设置和配置</li>
                                    <li>密码和恢复方式</li>
                                </ul>
                                <p class="reset-warning-note"><strong>此操作不可逆，请谨慎操作！</strong></p>
                            </div>
                        </div>
                        
                        <div class="reset-confirm-section">
                            <label class="reset-confirm-checkbox">
                                <input type="checkbox" id="reset-confirm-checkbox">
                                <span>我已了解风险，确认要重置所有数据</span>
                            </label>
                            <button class="btn-danger-outline" id="reset-all-data" disabled>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                重置所有数据
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="recovery-cancel">取消</button>
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

    // 备份文件验证
    const fileInput = modal.querySelector('#backup-file-input') as HTMLInputElement;
    const selectFileBtn = modal.querySelector('#select-backup-file-btn');
    const verifyFileBtn = modal.querySelector('#verify-file-btn') as HTMLButtonElement;
    const fileNameDisplay = modal.querySelector('#selected-file-name');

    selectFileBtn?.addEventListener('click', () => {
        fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            if (fileNameDisplay) {
                fileNameDisplay.textContent = `已选择: ${file.name}`;
            }
            verifyFileBtn.disabled = false;
        } else {
            if (fileNameDisplay) {
                fileNameDisplay.textContent = '';
            }
            verifyFileBtn.disabled = true;
        }
    });

    verifyFileBtn?.addEventListener('click', async () => {
        const file = fileInput?.files?.[0];
        if (file) {
            await handleBackupFileVerification(modal, file, resolve);
        }
    });

    // 显示/隐藏重置选项
    const showResetBtn = modal.querySelector('#show-reset-option');
    const resetSection = modal.querySelector('#reset-data-section');
    const resetConfirmCheckbox = modal.querySelector('#reset-confirm-checkbox') as HTMLInputElement;
    const resetBtn = modal.querySelector('#reset-all-data') as HTMLButtonElement;

    showResetBtn?.addEventListener('click', () => {
        if (resetSection) {
            const isVisible = (resetSection as HTMLElement).style.display !== 'none';
            (resetSection as HTMLElement).style.display = isVisible ? 'none' : 'block';
            
            // 切换按钮文字
            if (showResetBtn.textContent?.includes('无法通过')) {
                showResetBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"/>
                    </svg>
                    收起重置选项
                `;
            } else {
                showResetBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    无法通过以上方式恢复？
                `;
            }
        }
    });

    // 确认复选框控制重置按钮
    resetConfirmCheckbox?.addEventListener('change', () => {
        if (resetBtn) {
            resetBtn.disabled = !resetConfirmCheckbox.checked;
        }
    });

    // 重置所有数据
    resetBtn?.addEventListener('click', async () => {
        if (!resetConfirmCheckbox?.checked) {
            showMessage('请先确认了解风险', 'warning');
            return;
        }

        // 二次确认
        const confirmed = confirm('最后确认：您确定要重置所有数据吗？\n\n此操作将清除所有扩展数据且不可恢复！');
        if (!confirmed) {
            return;
        }

        try {
            showMessage('正在重置数据...', 'info');
            await recoveryService.resetAllData();
            showMessage('数据已重置', 'success');
            modal.remove();
            resolve({ success: false });
        } catch (error) {
            console.error('Reset failed:', error);
            showMessage('重置失败：' + (error as Error).message, 'error');
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
 * 处理备份文件验证
 */
async function handleBackupFileVerification(
    modal: HTMLElement,
    file: File,
    resolve: (result: RecoveryResult) => void
): Promise<void> {
    try {
        showMessage('正在读取备份文件...', 'info');
        
        let backupData: any;
        
        // 根据文件扩展名判断文件类型
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.zip')) {
            // 处理 ZIP 文件
            try {
                // 动态导入 JSZip
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(file);
                
                // 查找 JSON 文件
                let jsonFile: any = null;
                zipContent.forEach((relativePath, file) => {
                    if (relativePath.endsWith('.json') && !jsonFile) {
                        jsonFile = file;
                    }
                });
                
                if (!jsonFile) {
                    showMessage('ZIP 文件中未找到 JSON 备份文件', 'error');
                    return;
                }
                
                // 读取 JSON 内容
                const jsonContent = await jsonFile.async('string');
                backupData = JSON.parse(jsonContent);
            } catch (error) {
                console.error('Failed to extract ZIP file:', error);
                showMessage('ZIP 文件解压失败', 'error');
                return;
            }
        } else if (fileName.endsWith('.json')) {
            // 处理 JSON 文件
            const fileContent = await readFileAsText(file);
            backupData = JSON.parse(fileContent);
        } else {
            showMessage('不支持的文件格式，请选择 .json 或 .zip 文件', 'error');
            return;
        }
        
        // 验证备份文件格式
        if (!backupData.storageAll) {
            showMessage('备份文件格式不正确', 'error');
            return;
        }
        
        // 从备份文件中提取加密密钥和备份码配置
        const encryptionKey = backupData.storageAll['privacy_encryption_key'];
        const encryptedRecoveryConfig = backupData.storageAll['privacy_config_recovery_config'];
        
        if (!encryptionKey || !encryptedRecoveryConfig) {
            showMessage('备份文件中未找到恢复信息', 'error');
            return;
        }
        
        // 导入解密函数
        const { decryptData } = await import('../../../features/privacy/utils/crypto');
        
        // 使用备份文件中的密钥解密备份码配置
        const decrypted = decryptData(encryptedRecoveryConfig, encryptionKey);
        if (!decrypted) {
            showMessage('无法解密备份文件中的恢复信息', 'error');
            return;
        }
        
        const recoveryConfig = JSON.parse(decrypted);
        const backupCode = recoveryConfig.backupCode;
        
        if (!backupCode) {
            showMessage('备份文件中未找到备份码', 'error');
            return;
        }
        
        // 验证备份码是否与当前系统中的匹配
        const recoveryService = getRecoveryService();
        const isValid = await recoveryService.verifyBackupCode(backupCode);
        
        if (isValid) {
            showMessage('备份文件验证成功！', 'success');
            
            // 执行密码恢复
            const result = await recoveryService.performPasswordRecovery('backup-code', { code: backupCode });
            
            if (result.success) {
                // 显示新的备份码
                if (result.newBackupCode) {
                    alert(`验证成功！\n\n新的备份恢复码：\n${result.newBackupCode}\n\n请妥善保存此备份码！`);
                }
                
                modal.remove();
                resolve(result);
            } else {
                showMessage(result.error || '密码恢复失败', 'error');
            }
        } else {
            showMessage('备份文件中的备份码与当前系统不匹配或已使用', 'error');
        }
    } catch (error) {
        console.error('Backup file verification failed:', error);
        showMessage('备份文件验证失败：' + (error as Error).message, 'error');
    }
}

/**
 * 读取文件为文本
 */
function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target?.result as string);
        };
        reader.onerror = () => {
            reject(new Error('文件读取失败'));
        };
        reader.readAsText(file);
    });
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .password-recovery-modal .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(8px);
            animation: overlayFadeIn 0.3s ease;
        }

        @keyframes overlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .password-recovery-modal .modal-content {
            position: relative;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 85vh;
            overflow: hidden;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35), 0 0 1px rgba(0, 0, 0, 0.1);
            animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-40px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .password-recovery-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 28px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            position: relative;
            overflow: hidden;
        }

        .password-recovery-modal .modal-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 200px;
            height: 200px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }

        .password-recovery-modal .modal-header h2 {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .password-recovery-modal .modal-header h2::before {
            content: '🔓';
            font-size: 28px;
        }

        .password-recovery-modal .modal-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            font-size: 28px;
            color: white;
            cursor: pointer;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            transition: all 0.2s;
            position: relative;
            z-index: 1;
        }

        .password-recovery-modal .modal-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }

        .password-recovery-modal .modal-body {
            padding: 32px;
            max-height: calc(85vh - 200px);
            overflow-y: auto;
        }

        .password-recovery-modal .modal-body::-webkit-scrollbar {
            width: 8px;
        }

        .password-recovery-modal .modal-body::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .password-recovery-modal .modal-body::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
        }

        .password-recovery-modal .recovery-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 28px;
            background: #f8f9fa;
            padding: 6px;
            border-radius: 14px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        }

        .password-recovery-modal .recovery-tab {
            flex: 1;
            padding: 14px 20px;
            background: transparent;
            border: none;
            color: #6b7280;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 10px;
            position: relative;
        }

        .password-recovery-modal .recovery-tab:hover {
            color: #667eea;
            background: rgba(102, 126, 234, 0.08);
        }

        .password-recovery-modal .recovery-tab.active {
            color: white;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transform: translateY(-2px);
        }

        .password-recovery-modal .recovery-panel {
            animation: panelFadeIn 0.4s ease;
        }

        @keyframes panelFadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .password-recovery-modal .recovery-description {
            color: #6b7280;
            margin: 0 0 24px 0;
            font-size: 15px;
            line-height: 1.6;
            padding: 16px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-left: 4px solid #3b82f6;
            border-radius: 8px;
        }

        .password-recovery-modal .security-question-item {
            margin-bottom: 24px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
            transition: all 0.3s ease;
        }

        .password-recovery-modal .security-question-item:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .password-recovery-modal .security-question-label {
            display: block;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 12px;
            font-size: 15px;
            line-height: 1.5;
        }

        .password-recovery-modal .recovery-input {
            width: 100%;
            padding: 14px 16px;
            font-size: 15px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
            background: white;
        }

        .password-recovery-modal .recovery-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
            transform: translateY(-1px);
        }

        .password-recovery-modal .recovery-hint {
            font-size: 13px;
            color: #9ca3af;
            margin: 10px 0 20px 0;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .password-recovery-modal .recovery-hint::before {
            content: '💡';
            font-size: 16px;
        }

        /* 恢复帮助区域 */
        .password-recovery-modal .recovery-help-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 2px dashed #e5e7eb;
        }

        .password-recovery-modal .recovery-help-toggle {
            width: 100%;
            padding: 14px 20px;
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            color: #6b7280;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .password-recovery-modal .recovery-help-toggle:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
            color: #374151;
        }

        .password-recovery-modal .recovery-help-toggle svg {
            flex-shrink: 0;
        }

        .password-recovery-modal .reset-data-section {
            margin-top: 20px;
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .password-recovery-modal .reset-warning-box {
            display: flex;
            gap: 16px;
            padding: 20px;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border: 2px solid #fca5a5;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .password-recovery-modal .reset-warning-icon {
            font-size: 32px;
            flex-shrink: 0;
            line-height: 1;
        }

        .password-recovery-modal .reset-warning-content h4 {
            margin: 0 0 12px 0;
            color: #991b1b;
            font-size: 16px;
            font-weight: 700;
        }

        .password-recovery-modal .reset-warning-content p {
            margin: 0 0 10px 0;
            color: #7f1d1d;
            font-size: 14px;
            line-height: 1.6;
        }

        .password-recovery-modal .reset-warning-content ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #7f1d1d;
            font-size: 14px;
            line-height: 1.8;
        }

        .password-recovery-modal .reset-warning-content ul li {
            margin-bottom: 6px;
        }

        .password-recovery-modal .reset-warning-note {
            margin-top: 12px !important;
            padding: 10px 14px;
            background: rgba(127, 29, 29, 0.1);
            border-radius: 6px;
            font-weight: 600;
        }

        .password-recovery-modal .reset-confirm-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .password-recovery-modal .reset-confirm-checkbox {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 16px;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            user-select: none;
        }

        .password-recovery-modal .reset-confirm-checkbox:hover {
            border-color: #d1d5db;
            background: #fafafa;
        }

        .password-recovery-modal .reset-confirm-checkbox input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
            flex-shrink: 0;
        }

        .password-recovery-modal .reset-confirm-checkbox span {
            color: #374151;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.5;
        }

        .password-recovery-modal .btn-danger-outline {
            width: 100%;
            padding: 14px 28px;
            font-size: 15px;
            font-weight: 700;
            border: 2px solid #dc2626;
            background: white;
            color: #dc2626;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 48px;
        }

        .password-recovery-modal .btn-danger-outline:hover:not(:disabled) {
            background: #dc2626;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
        }

        .password-recovery-modal .btn-danger-outline:active:not(:disabled) {
            transform: translateY(0);
        }

        .password-recovery-modal .btn-danger-outline:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            border-color: #d1d5db;
            color: #9ca3af;
        }

        .password-recovery-modal .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 24px 32px;
            background: #f8f9fa;
            border-top: 1px solid #e5e7eb;
        }

        .password-recovery-modal .btn-primary,
        .password-recovery-modal .btn-secondary,
        .password-recovery-modal .btn-danger {
            padding: 14px 28px;
            font-size: 15px;
            font-weight: 600;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 48px;
        }

        .password-recovery-modal .btn-primary {
            width: 100%;
            margin-top: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .password-recovery-modal .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .password-recovery-modal .btn-primary:active:not(:disabled) {
            transform: translateY(0);
        }

        .password-recovery-modal .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .password-recovery-modal .btn-secondary {
            background: white !important;
            color: #1f2937 !important;
            border: 2px solid #d1d5db !important;
            font-weight: 600 !important;
        }

        .password-recovery-modal .btn-secondary:hover {
            background: #f3f4f6 !important;
            border-color: #9ca3af !important;
            color: #111827 !important;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .password-recovery-modal .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            font-weight: 600;
        }

        .password-recovery-modal .btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }

        /* 文件上传区域样式 */
        .password-recovery-modal #file-panel {
            padding: 24px;
            background: white;
            border-radius: 12px;
            border: 2px dashed #e5e7eb;
        }

        .password-recovery-modal .file-upload-hint {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            animation: hintFadeIn 0.5s ease;
        }

        .password-recovery-modal .file-upload-hint p {
            margin: 0;
            color: #1565c0;
            font-size: 14px;
            line-height: 1.6;
            text-align: left;
        }

        @keyframes hintFadeIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .password-recovery-modal .file-select-btn {
            background: white;
            border: 2px solid #d1d5db;
            color: #374151;
            font-weight: 600;
            transition: all 0.3s ease;
            padding: 16px;
            width: 100%;
            font-size: 15px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 48px;
            box-sizing: border-box;
        }

        .password-recovery-modal .file-select-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
            color: #1f2937;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .password-recovery-modal .file-select-btn:active {
            transform: translateY(0);
        }

        .password-recovery-modal #selected-file-name {
            font-weight: 600;
            color: #667eea;
        }

        /* 响应式设计 */
        @media (max-width: 640px) {
            .password-recovery-modal .modal-content {
                width: 95%;
                border-radius: 16px;
            }

            .password-recovery-modal .modal-header {
                padding: 20px 24px;
            }

            .password-recovery-modal .modal-header h2 {
                font-size: 22px;
            }

            .password-recovery-modal .modal-body {
                padding: 24px;
            }

            .password-recovery-modal .recovery-tabs {
                flex-direction: column;
            }

            .password-recovery-modal .modal-footer {
                flex-direction: column;
                padding: 20px 24px;
            }

            .password-recovery-modal .btn-secondary,
            .password-recovery-modal .btn-danger {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(style);
}
