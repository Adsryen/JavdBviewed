/**
 * 密码恢复服务
 */

import { 
    IRecoveryService, 
    SecurityQuestion, 
    PasswordRecoveryResult,
    PasswordRecoveryConfig 
} from '../../types/privacy';
import { getPasswordService } from './PasswordService';
import { getPrivacyStorage } from '../../utils/privacy/storage';
import { 
    generateBackupCode, 
    generateSecureId, 
    hashPassword 
} from '../../utils/privacy/crypto';
import { 
    getPasswordValidator, 
    InputValidator 
} from '../../utils/privacy/validation';

export class RecoveryService implements IRecoveryService {
    private static instance: RecoveryService;
    private passwordService = getPasswordService();
    private storage = getPrivacyStorage();
    private validator = getPasswordValidator();

    private constructor() {}

    public static getInstance(): RecoveryService {
        if (!RecoveryService.instance) {
            RecoveryService.instance = new RecoveryService();
        }
        return RecoveryService.instance;
    }

    /**
     * 设置安全问题
     */
    async setupSecurityQuestions(questions: SecurityQuestion[]): Promise<void> {
        try {
            // 验证问题格式
            for (const question of questions) {
                if (!InputValidator.isValidSecurityQuestion(question.question)) {
                    throw new Error(`安全问题格式无效: ${question.question}`);
                }
                
                if (!question.answerHash || !question.answerSalt) {
                    throw new Error('安全问题答案未正确加密');
                }
            }

            // 保存到敏感配置存储
            await this.storage.saveSensitiveConfig('security_questions', questions);
            
            console.log(`Setup ${questions.length} security questions`);
        } catch (error) {
            console.error('Failed to setup security questions:', error);
            throw new Error('设置安全问题失败');
        }
    }

    /**
     * 验证安全问题答案
     */
    async verifySecurityAnswers(answers: { id: string; answer: string }[]): Promise<boolean> {
        try {
            // 加载安全问题
            const questions = await this.storage.loadSensitiveConfig<SecurityQuestion[]>('security_questions');
            if (!questions || questions.length === 0) {
                throw new Error('未设置安全问题');
            }

            // 验证答案
            const result = await this.validator.verifySecurityAnswers(questions, answers);
            
            console.log(`Security answers verification: ${result.correctCount}/${result.requiredCount} correct`);
            return result.success;
        } catch (error) {
            console.error('Failed to verify security answers:', error);
            return false;
        }
    }

    /**
     * 生成备份恢复码
     */
    async generateBackupCode(): Promise<string> {
        try {
            const backupCode = generateBackupCode();
            
            // 保存备份码（加密存储）
            const config: Partial<PasswordRecoveryConfig> = {
                backupCode,
                backupCodeUsed: false
            };
            
            await this.storage.saveSensitiveConfig('recovery_config', config);
            
            console.log('Generated new backup code');
            return backupCode;
        } catch (error) {
            console.error('Failed to generate backup code:', error);
            throw new Error('生成备份恢复码失败');
        }
    }

    /**
     * 验证备份恢复码
     */
    async verifyBackupCode(code: string): Promise<boolean> {
        try {
            // 验证格式
            if (!InputValidator.isValidBackupCode(code)) {
                return false;
            }

            // 加载恢复配置
            const config = await this.storage.loadSensitiveConfig<PasswordRecoveryConfig>('recovery_config');
            if (!config || !config.backupCode) {
                return false;
            }

            // 检查是否已使用
            if (config.backupCodeUsed) {
                throw new Error('备份恢复码已被使用');
            }

            // 验证恢复码
            const isValid = await this.validator.verifyBackupCode(code, config.backupCode);
            
            if (isValid) {
                // 标记为已使用
                config.backupCodeUsed = true;
                await this.storage.saveSensitiveConfig('recovery_config', config);
                
                console.log('Backup code verified and marked as used');
            }
            
            return isValid;
        } catch (error) {
            console.error('Failed to verify backup code:', error);
            return false;
        }
    }

    /**
     * 启动邮箱恢复（预留功能）
     */
    async initiateEmailRecovery(email: string): Promise<void> {
        try {
            // 验证邮箱格式
            if (!InputValidator.isValidEmail(email)) {
                throw new Error('邮箱格式无效');
            }

            // 这里可以实现发送恢复邮件的逻辑
            // 目前只是记录恢复尝试
            const config = await this.storage.loadSensitiveConfig<PasswordRecoveryConfig>('recovery_config') || {};
            config.recoveryEmail = email;
            config.lastRecoveryAttempt = Date.now();
            config.recoveryAttemptCount = (config.recoveryAttemptCount || 0) + 1;
            
            await this.storage.saveSensitiveConfig('recovery_config', config);
            
            console.log('Email recovery initiated for:', email);
            
            // 抛出提示，因为邮箱恢复需要后端支持
            throw new Error('邮箱恢复功能需要服务器支持，请使用其他恢复方式');
        } catch (error) {
            console.error('Failed to initiate email recovery:', error);
            throw error;
        }
    }

    /**
     * 重置所有数据（最后手段）
     */
    async resetAllData(): Promise<void> {
        try {
            // 警告用户这是不可逆操作
            const confirmed = confirm(
                '警告：此操作将清除所有拓展数据，包括观看记录、设置等。\n' +
                '此操作不可逆，确定要继续吗？\n\n' +
                '如果确定，请在下一个对话框中输入 "RESET" 确认。'
            );
            
            if (!confirmed) {
                throw new Error('用户取消了重置操作');
            }

            const confirmation = prompt('请输入 "RESET" 确认重置所有数据：');
            if (confirmation !== 'RESET') {
                throw new Error('确认文本不正确，重置操作已取消');
            }

            // 清除所有存储数据
            await this.clearAllStorageData();
            
            console.log('All extension data has been reset');
            
            // 刷新页面
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset all data:', error);
            throw error;
        }
    }

    /**
     * 执行完整的密码恢复流程
     */
    async performPasswordRecovery(method: 'security-questions' | 'backup-code', data: any): Promise<PasswordRecoveryResult> {
        try {
            let success = false;
            let newBackupCode: string | undefined;

            switch (method) {
                case 'security-questions':
                    success = await this.verifySecurityAnswers(data.answers);
                    if (success) {
                        // 生成新的备份码
                        newBackupCode = await this.generateBackupCode();
                    }
                    break;

                case 'backup-code':
                    success = await this.verifyBackupCode(data.code);
                    if (success) {
                        // 生成新的备份码
                        newBackupCode = await this.generateBackupCode();
                    }
                    break;

                default:
                    throw new Error('不支持的恢复方式');
            }

            if (success) {
                // 重置密码尝试计数
                this.validator.resetAttempts();
                
                console.log(`Password recovery successful via ${method}`);
            }

            return {
                success,
                method,
                newBackupCode
            };
        } catch (error) {
            console.error('Password recovery failed:', error);
            return {
                success: false,
                method,
                error: error instanceof Error ? error.message : '恢复失败'
            };
        }
    }

    /**
     * 创建安全问题（带答案加密）
     */
    async createSecurityQuestion(question: string, answer: string): Promise<SecurityQuestion> {
        try {
            // 验证输入
            if (!InputValidator.isValidSecurityQuestion(question)) {
                throw new Error('安全问题格式无效');
            }

            if (!InputValidator.isValidSecurityAnswer(answer)) {
                throw new Error('安全问题答案格式无效');
            }

            // 清理答案
            const cleanAnswer = InputValidator.sanitizeSecurityAnswer(answer);
            
            // 加密答案
            const { hash: answerHash, salt: answerSalt } = await this.passwordService.hashPassword(cleanAnswer);

            return {
                id: generateSecureId(),
                question: question.trim(),
                answerHash,
                answerSalt
            };
        } catch (error) {
            console.error('Failed to create security question:', error);
            throw error;
        }
    }

    /**
     * 检查是否有安全问题
     */
    async hasSecurityQuestions(): Promise<boolean> {
        try {
            const questions = await this.storage.loadSensitiveConfig<SecurityQuestion[]>('security_questions');
            return !!(questions && questions.length > 0);
        } catch (error) {
            console.error('Failed to check security questions:', error);
            return false;
        }
    }

    /**
     * 检查是否有备份码
     */
    async hasBackupCode(): Promise<boolean> {
        try {
            const config = await this.storage.loadSensitiveConfig<PasswordRecoveryConfig>('recovery_config');
            return !!(config && config.backupCode && !config.backupCodeUsed);
        } catch (error) {
            console.error('Failed to check backup code:', error);
            return false;
        }
    }

    /**
     * 显示安全问题设置对话框
     */
    async showSecurityQuestionsDialog(): Promise<boolean> {
        try {
            // 这里应该显示一个对话框让用户设置安全问题
            // 目前返回false表示功能未实现
            console.log('Security questions dialog not implemented yet');
            return false;
        } catch (error) {
            console.error('Failed to show security questions dialog:', error);
            return false;
        }
    }

    /**
     * 获取恢复选项状态
     */
    async getRecoveryOptions(): Promise<{
        hasSecurityQuestions: boolean;
        hasBackupCode: boolean;
        hasRecoveryEmail: boolean;
        backupCodeUsed: boolean;
        questionCount: number;
    }> {
        try {
            const questions = await this.storage.loadSensitiveConfig<SecurityQuestion[]>('security_questions');
            const config = await this.storage.loadSensitiveConfig<PasswordRecoveryConfig>('recovery_config');

            return {
                hasSecurityQuestions: !!(questions && questions.length > 0),
                hasBackupCode: !!(config && config.backupCode && !config.backupCodeUsed),
                hasRecoveryEmail: !!(config && config.recoveryEmail),
                backupCodeUsed: !!(config && config.backupCodeUsed),
                questionCount: questions ? questions.length : 0
            };
        } catch (error) {
            console.error('Failed to get recovery options:', error);
            return {
                hasSecurityQuestions: false,
                hasBackupCode: false,
                hasRecoveryEmail: false,
                backupCodeUsed: false,
                questionCount: 0
            };
        }
    }

    /**
     * 清除所有存储数据
     */
    private async clearAllStorageData(): Promise<void> {
        try {
            // 清除隐私数据
            await this.storage.clearPrivacyData();

            // 清除Chrome存储中的所有数据
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await new Promise<void>((resolve, reject) => {
                    chrome.storage.local.clear(() => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                });
            }

            // 清除localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.clear();
            }

            console.log('All storage data cleared');
        } catch (error) {
            console.error('Failed to clear storage data:', error);
            throw new Error('清除存储数据失败');
        }
    }
}

/**
 * 获取恢复服务实例
 */
export function getRecoveryService(): RecoveryService {
    return RecoveryService.getInstance();
}
