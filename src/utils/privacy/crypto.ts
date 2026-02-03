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
        minLength: password.length >= 6, // 降低到6位
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    let score = 0;
    const suggestions: string[] = [];

    // 长度评分 - 更宽松
    if (requirements.minLength) {
        score += 30; // 基础分更高
    } else {
        suggestions.push('密码长度至少需要6位');
    }

    if (password.length >= 8) {
        score += 15; // 8位额外加分
    }

    if (password.length >= 12) {
        score += 10; // 12位额外加分
    }

    // 纯数字密码支持 - 如果是6位以上纯数字，给予基础分
    const isAllNumbers = /^\d+$/.test(password);
    if (isAllNumbers && password.length >= 6) {
        score += 40; // 纯数字6位以上给40分
        if (password.length >= 8) {
            score += 20; // 8位纯数字额外20分
        }
    } else {
        // 非纯数字的字符类型评分
        if (requirements.hasUppercase) {
            score += 10;
        }

        if (requirements.hasLowercase) {
            score += 10;
        }

        if (requirements.hasNumbers) {
            score += 10;
        }

        if (requirements.hasSpecialChars) {
            score += 15;
        }
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

    // 确定等级 - 更宽松的标准
    let level: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score < 30) {
        level = 'weak';
    } else if (score < 50) {
        level = 'medium';
    } else if (score < 75) {
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
    // 使用 encodeURIComponent 和 btoa 来支持中文字符
    return btoa(encodeURIComponent(result).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
}

/**
 * 数据解密
 */
export function decryptData(encryptedData: string, key: string): string {
    try {
        // 解码 Base64 并处理 UTF-8
        const data = decodeURIComponent(Array.prototype.map.call(atob(encryptedData), (c: string) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
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
