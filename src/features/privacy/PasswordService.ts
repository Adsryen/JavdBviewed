/**
 * 密码服务
 */

import { IPasswordService, PasswordStrengthResult, PasswordVerificationResult } from '../../types/privacy';
import { 
    generateSalt, 
    generateBackupCode, 
    hashPassword, 
    verifyPassword, 
    validatePasswordStrength 
} from '../../utils/privacy/crypto';
import { getPasswordValidator } from '../../utils/privacy/validation';
import { getSettings, saveSettings } from '../../utils/storage';
import { getPrivacyManager } from './PrivacyManager';

export class PasswordService implements IPasswordService {
    private static instance: PasswordService;
    private validator = getPasswordValidator();

    private constructor() {}

    public static getInstance(): PasswordService {
        if (!PasswordService.instance) {
            PasswordService.instance = new PasswordService();
        }
        return PasswordService.instance;
    }

    /**
     * 哈希密码
     */
    async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
        try {
            const passwordSalt = salt || this.generateSalt();
            const hash = await hashPassword(password, passwordSalt);
            
            return {
                hash,
                salt: passwordSalt
            };
        } catch (error) {
            console.error('Password hashing failed:', error);
            throw new Error('密码加密失败');
        }
    }

    /**
     * 验证密码
     */
    async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
        try {
            return await verifyPassword(password, hash, salt);
        } catch (error) {
            console.error('Password verification failed:', error);
            return false;
        }
    }

    /**
     * 验证密码（带尝试次数限制）
     */
    async verifyPasswordWithLimits(
        password: string, 
        hash: string, 
        salt: string, 
        identifier: string = 'default'
    ): Promise<PasswordVerificationResult> {
        return await this.validator.verifyPassword(password, hash, salt, identifier);
    }

    /**
     * 生成盐值
     */
    generateSalt(): string {
        return generateSalt(16);
    }

    /**
     * 生成备份恢复码
     */
    generateBackupCode(): string {
        return generateBackupCode();
    }

    /**
     * 验证密码强度
     */
    validatePasswordStrength(password: string): PasswordStrengthResult {
        return validatePasswordStrength(password);
    }

    /**
     * 更改密码
     */
    async changePassword(
        oldPassword: string, 
        newPassword: string, 
        currentHash: string, 
        currentSalt: string
    ): Promise<{ success: boolean; newHash?: string; newSalt?: string; error?: string }> {
        try {
            // 验证旧密码
            const isOldPasswordValid = await this.verifyPassword(oldPassword, currentHash, currentSalt);
            if (!isOldPasswordValid) {
                return {
                    success: false,
                    error: '当前密码错误'
                };
            }

            // 验证新密码强度
            const strength = this.validatePasswordStrength(newPassword);
            if (strength.score < 40) {
                return {
                    success: false,
                    error: '新密码强度不足，请选择更强的密码'
                };
            }

            // 生成新的哈希
            const { hash: newHash, salt: newSalt } = await this.hashPassword(newPassword);

            return {
                success: true,
                newHash,
                newSalt
            };
        } catch (error) {
            console.error('Password change failed:', error);
            return {
                success: false,
                error: '密码更改失败'
            };
        }
    }

    /**
     * 重置密码
     */
    async resetPassword(newPassword: string): Promise<{ success: boolean; hash?: string; salt?: string; error?: string }> {
        try {
            // 验证新密码强度
            const strength = this.validatePasswordStrength(newPassword);
            if (strength.score < 40) {
                return {
                    success: false,
                    error: '密码强度不足，请选择更强的密码'
                };
            }

            // 生成新的哈希
            const { hash, salt } = await this.hashPassword(newPassword);

            // 重置尝试计数
            this.validator.resetAttempts();

            return {
                success: true,
                hash,
                salt
            };
        } catch (error) {
            console.error('Password reset failed:', error);
            return {
                success: false,
                error: '密码重置失败'
            };
        }
    }

    /**
     * 检查密码是否过于简单
     */
    isPasswordTooSimple(password: string): boolean {
        const strength = this.validatePasswordStrength(password);
        return strength.score < 30;
    }

    /**
     * 生成密码建议
     */
    generatePasswordSuggestions(): string[] {
        const suggestions = [
            '使用至少8个字符',
            '包含大写和小写字母',
            '包含数字',
            '包含特殊字符 (!@#$%^&*)',
            '避免使用常见密码',
            '不要使用个人信息',
            '考虑使用密码短语'
        ];

        return suggestions;
    }

    /**
     * 验证密码复杂性要求
     */
    checkPasswordRequirements(password: string): {
        minLength: boolean;
        hasUppercase: boolean;
        hasLowercase: boolean;
        hasNumbers: boolean;
        hasSpecialChars: boolean;
        isNotCommon: boolean;
    } {
        const strength = this.validatePasswordStrength(password);
        
        return {
            ...strength.requirements,
            isNotCommon: !this.isCommonPassword(password)
        };
    }

    /**
     * 检查是否为常见密码
     */
    private isCommonPassword(password: string): boolean {
        const commonPasswords = [
            'password', '123456', 'qwerty', 'admin', 'letmein',
            'welcome', 'monkey', '1234567890', 'password123',
            'admin123', 'root', 'user', 'guest', 'test'
        ];

        const lowerPassword = password.toLowerCase();
        return commonPasswords.some(common => 
            lowerPassword.includes(common) || common.includes(lowerPassword)
        );
    }

    /**
     * 获取剩余尝试次数
     */
    getRemainingAttempts(identifier: string = 'default'): number {
        return this.validator.getRemainingAttempts(identifier);
    }

    /**
     * 重置尝试计数
     */
    resetAttempts(identifier: string = 'default'): void {
        this.validator.resetAttempts(identifier);
    }

    /**
     * 配置安全设置
     */
    configureSecuritySettings(maxAttempts: number, lockoutDurationMinutes: number): void {
        this.validator.setMaxAttempts(maxAttempts);
        this.validator.setLockoutDuration(lockoutDurationMinutes * 60 * 1000);
    }


    /**
     * 显示"设置密码"对话流程
     */
    async showSetPasswordDialog(): Promise<boolean> {
        try {
            const { showSetPasswordModal } = await import('../../dashboard/components/privacy/PasswordSetupModal');
            return new Promise((resolve) => {
                showSetPasswordModal({
                    onSuccess: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });
        } catch (e) {
            console.error('showSetPasswordDialog error:', e);
            return false;
        }
    }

    /**
     * 显示"修改密码"对话流程
     */
    async showChangePasswordDialog(): Promise<boolean> {
        try {
            const { showChangePasswordModal } = await import('../../dashboard/components/privacy/PasswordSetupModal');
            return new Promise((resolve) => {
                showChangePasswordModal({
                    onSuccess: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });
        } catch (e) {
            console.error('showChangePasswordDialog error:', e);
            return false;
        }
    }

    /**
     * 修改密码（带验证）
     */
    async changePasswordWithVerification(oldPassword: string, newPassword: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const settings = await getSettings();
            const pm = settings.privacy?.privateMode;
            
            if (!pm?.passwordHash || !pm?.passwordSalt) {
                return { success: false, error: '尚未设置密码' };
            }

            const result = await this.changePassword(oldPassword, newPassword, pm.passwordHash, pm.passwordSalt);
            
            if (!result.success || !result.newHash || !result.newSalt) {
                return { success: false, error: result.error || '修改密码失败' };
            }

            settings.privacy.privateMode.passwordHash = result.newHash;
            settings.privacy.privateMode.passwordSalt = result.newSalt;
            await saveSettings(settings);

            try {
                const privacyManager = getPrivacyManager();
                (privacyManager as any).emitEvent?.('password-changed');
            } catch {}

            return { success: true };
        } catch (e) {
            console.error('changePasswordWithVerification error:', e);
            return { success: false, error: '修改密码失败' };
        }
    }
}

/**
 * 获取密码服务实例
 */
export function getPasswordService(): PasswordService {
    return PasswordService.getInstance();
}
