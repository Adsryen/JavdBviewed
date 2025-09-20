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
     * 显示“设置密码”对话流程（最小可用版）
     */
    async showSetPasswordDialog(): Promise<boolean> {
        try {
            const password = prompt('请设置密码（至少6位）：') || '';
            if (!password) return false;

            const confirmPwd = prompt('请再次输入以确认：') || '';
            if (password !== confirmPwd) {
                alert('两次输入不一致');
                return false;
            }

            // 基础强度检查
            const strength = this.validatePasswordStrength(password);
            if (strength.score < 40) {
                alert('密码过于简单，请尝试更复杂的密码（增加长度、混合大小写/数字/符号）');
                return false;
            }

            // 使用隐私管理器封装的设置逻辑
            const privacyManager = getPrivacyManager();
            const ret = await privacyManager.setPassword(password);
            if (!ret.success) {
                alert(ret.error || '设置密码失败');
                return false;
            }

            return true;
        } catch (e) {
            console.error('showSetPasswordDialog error:', e);
            return false;
        }
    }

    /**
     * 显示“修改密码”对话流程（最小可用版）
     */
    async showChangePasswordDialog(): Promise<boolean> {
        try {
            const settings = await getSettings();
            const pm = settings.privacy?.privateMode;
            if (!pm?.passwordHash || !pm?.passwordSalt) {
                alert('尚未设置密码，请先设置密码');
                return false;
            }

            const oldPwd = prompt('请输入当前密码：') || '';
            if (!oldPwd) return false;

            const newPwd = prompt('请输入新密码（至少6位）：') || '';
            if (!newPwd) return false;

            const confirmPwd = prompt('请再次输入新密码以确认：') || '';
            if (newPwd !== confirmPwd) {
                alert('两次输入不一致');
                return false;
            }

            const result = await this.changePassword(oldPwd, newPwd, pm.passwordHash, pm.passwordSalt);
            if (!result.success || !result.newHash || !result.newSalt) {
                alert(result.error || '修改密码失败');
                return false;
            }

            // 持久化新的密码哈希
            settings.privacy.privateMode.passwordHash = result.newHash;
            settings.privacy.privateMode.passwordSalt = result.newSalt;
            await saveSettings(settings);

            // 通知隐私管理器（触发事件）
            try {
                const privacyManager = getPrivacyManager();
                (privacyManager as any).emitEvent?.('password-changed');
            } catch {}

            return true;
        } catch (e) {
            console.error('showChangePasswordDialog error:', e);
            return false;
        }
    }
}

/**
 * 获取密码服务实例
 */
export function getPasswordService(): PasswordService {
    return PasswordService.getInstance();
}
