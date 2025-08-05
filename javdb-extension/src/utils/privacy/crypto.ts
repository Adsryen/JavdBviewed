/**
 * 隐私保护加密工具
 */

/**
 * 生成随机盐值
 */
export function generateSalt(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 生成备份恢复码
 */
export function generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) {
            result += '-';
        }
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 简单的哈希函数 (基于Web Crypto API的SHA-256)
 */
export async function hashString(input: string, salt: string = ''): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input + salt);
    
    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        // 降级到简单哈希实现
        return simpleHash(input + salt);
    }
}

/**
 * 简单哈希实现 (降级方案)
 */
function simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
}

/**
 * 密码强度验证
 */
export function validatePasswordStrength(password: string): {
    score: number;
    level: 'weak' | 'medium' | 'strong' | 'very-strong';
    suggestions: string[];
    requirements: {
        minLength: boolean;
        hasUppercase: boolean;
        hasLowercase: boolean;
        hasNumbers: boolean;
        hasSpecialChars: boolean;
    };
} {
    const requirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    let score = 0;
    const suggestions: string[] = [];

    // 长度评分
    if (requirements.minLength) {
        score += 20;
    } else {
        suggestions.push('密码长度至少需要8位');
    }

    if (password.length >= 12) {
        score += 10;
    }

    // 字符类型评分
    if (requirements.hasUppercase) {
        score += 15;
    } else {
        suggestions.push('添加大写字母');
    }

    if (requirements.hasLowercase) {
        score += 15;
    } else {
        suggestions.push('添加小写字母');
    }

    if (requirements.hasNumbers) {
        score += 15;
    } else {
        suggestions.push('添加数字');
    }

    if (requirements.hasSpecialChars) {
        score += 15;
    } else {
        suggestions.push('添加特殊字符');
    }

    // 复杂度加分
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
        score += 10;
    }

    // 常见密码检查
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        score -= 20;
        suggestions.push('避免使用常见密码');
    }

    // 确定等级
    let level: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score < 40) {
        level = 'weak';
    } else if (score < 70) {
        level = 'medium';
    } else if (score < 90) {
        level = 'strong';
    } else {
        level = 'very-strong';
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        level,
        suggestions,
        requirements
    };
}

/**
 * 安全的密码哈希 (PBKDF2 简化实现)
 */
export async function hashPassword(password: string, salt: string, iterations: number = 10000): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        );

        const hashArray = Array.from(new Uint8Array(derivedBits));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        // 降级到简单哈希
        let hash = password + salt;
        for (let i = 0; i < iterations / 1000; i++) {
            hash = await hashString(hash);
        }
        return hash;
    }
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const computedHash = await hashPassword(password, salt);
    return computedHash === hash;
}

/**
 * 生成安全的随机ID
 */
export function generateSecureId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = generateSalt(8);
    return `${timestamp}-${randomPart}`;
}

/**
 * 数据加密 (简单的XOR加密，用于非敏感数据)
 */
export function encryptData(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return btoa(result);
}

/**
 * 数据解密
 */
export function decryptData(encryptedData: string, key: string): string {
    try {
        const data = atob(encryptedData);
        let result = '';
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    } catch (error) {
        return '';
    }
}
