/**
 * 隐私保护存储工具
 */

import { STORAGE_KEYS } from '../config';
import { PrivacyState, SessionInfo } from '../../types/privacy';
import { encryptData, decryptData, generateSecureId } from './crypto';

/**
 * 隐私状态存储管理器
 */
export class PrivacyStorage {
    private static instance: PrivacyStorage;
    private encryptionKey: string = '';
    private ready: Promise<void> | null = null;

    private constructor() {
        this.ready = this.initializeEncryptionKey();
    }

    public static getInstance(): PrivacyStorage {
        if (!PrivacyStorage.instance) {
            PrivacyStorage.instance = new PrivacyStorage();
        }
        return PrivacyStorage.instance;
    }

    /**
     * 初始化加密密钥
     */
    private async initializeEncryptionKey(): Promise<void> {
        try {
            const stored = await this.getFromStorage('privacy_encryption_key');
            if (stored) {
                this.encryptionKey = stored;
            } else {
                this.encryptionKey = generateSecureId();
                await this.setToStorage('privacy_encryption_key', this.encryptionKey);
            }
        } catch (error) {
            console.warn('Failed to initialize encryption key:', error);
            this.encryptionKey = 'default-key-' + Date.now();
        }
    }

    /**
     * 确保密钥已就绪
     */
    private async ensureReady(): Promise<void> {
        if (!this.encryptionKey) {
            try {
                await (this.ready || Promise.resolve());
            } catch {
                // 忽略错误，后续方法有容错
            }
        }
    }

    /**
     * 存储隐私状态
     */
    async savePrivacyState(state: PrivacyState): Promise<void> {
        try {
            await this.ensureReady();
            const encrypted = encryptData(JSON.stringify(state), this.encryptionKey);
            await this.setToStorage(STORAGE_KEYS.PRIVACY_STATE, encrypted);
        } catch (error) {
            console.error('Failed to save privacy state:', error);
            throw new Error('保存隐私状态失败');
        }
    }

    /**
     * 加载隐私状态
     */
    async loadPrivacyState(): Promise<PrivacyState | null> {
        try {
            await this.ensureReady();
            const encrypted = await this.getFromStorage(STORAGE_KEYS.PRIVACY_STATE);
            if (!encrypted) {
                return null;
            }

            const decrypted = decryptData(encrypted, this.encryptionKey);
            if (!decrypted) {
                return null;
            }

            return JSON.parse(decrypted) as PrivacyState;
        } catch (error) {
            console.error('Failed to load privacy state:', error);
            return null;
        }
    }

    /**
     * 存储会话信息
     */
    async saveSessionInfo(session: SessionInfo): Promise<void> {
        try {
            await this.ensureReady();
            const encrypted = encryptData(JSON.stringify(session), this.encryptionKey);
            await this.setToStorage(STORAGE_KEYS.PRIVACY_SESSION, encrypted);
        } catch (error) {
            console.error('Failed to save session info:', error);
            throw new Error('保存会话信息失败');
        }
    }

    /**
     * 加载会话信息
     */
    async loadSessionInfo(): Promise<SessionInfo | null> {
        try {
            await this.ensureReady();
            const encrypted = await this.getFromStorage(STORAGE_KEYS.PRIVACY_SESSION);
            if (!encrypted) {
                return null;
            }

            const decrypted = decryptData(encrypted, this.encryptionKey);
            if (!decrypted) {
                return null;
            }

            return JSON.parse(decrypted) as SessionInfo;
        } catch (error) {
            console.error('Failed to load session info:', error);
            return null;
        }
    }

    /**
     * 清除隐私数据
     */
    async clearPrivacyData(): Promise<void> {
        try {
            await Promise.all([
                this.removeFromStorage(STORAGE_KEYS.PRIVACY_STATE),
                this.removeFromStorage(STORAGE_KEYS.PRIVACY_SESSION)
            ]);
        } catch (error) {
            console.error('Failed to clear privacy data:', error);
            throw new Error('清除隐私数据失败');
        }
    }

    /**
     * 存储敏感配置数据
     */
    async saveSensitiveConfig(key: string, data: any): Promise<void> {
        try {
            await this.ensureReady();
            const encrypted = encryptData(JSON.stringify(data), this.encryptionKey);
            await this.setToStorage(`privacy_config_${key}`, encrypted);
        } catch (error) {
            console.error('Failed to save sensitive config:', error);
            throw new Error('保存敏感配置失败');
        }
    }

    /**
     * 加载敏感配置数据
     */
    async loadSensitiveConfig<T>(key: string): Promise<T | null> {
        try {
            await this.ensureReady();
            const encrypted = await this.getFromStorage(`privacy_config_${key}`);
            if (!encrypted) {
                return null;
            }

            const decrypted = decryptData(encrypted, this.encryptionKey);
            if (!decrypted) {
                return null;
            }

            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error('Failed to load sensitive config:', error);
            return null;
        }
    }

    /**
     * 检查数据完整性
     */
    async verifyDataIntegrity(): Promise<boolean> {
        try {
            await this.ensureReady();
            const state = await this.loadPrivacyState();
            const session = await this.loadSessionInfo();
            
            // 简单的完整性检查
            if (state && typeof state.isBlurred !== 'boolean') {
                return false;
            }
            
            if (session && typeof session.startTime !== 'number') {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Data integrity check failed:', error);
            return false;
        }
    }

    /**
     * 备份隐私数据
     */
    async backupPrivacyData(): Promise<string> {
        try {
            await this.ensureReady();
            const state = await this.loadPrivacyState();
            const session = await this.loadSessionInfo();
            
            const backup = {
                state,
                session,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            return encryptData(JSON.stringify(backup), this.encryptionKey);
        } catch (error) {
            console.error('Failed to backup privacy data:', error);
            throw new Error('备份隐私数据失败');
        }
    }

    /**
     * 恢复隐私数据
     */
    async restorePrivacyData(backupData: string): Promise<void> {
        try {
            await this.ensureReady();
            const decrypted = decryptData(backupData, this.encryptionKey);
            if (!decrypted) {
                throw new Error('无法解密备份数据');
            }
            
            const backup = JSON.parse(decrypted);
            
            if (backup.state) {
                await this.savePrivacyState(backup.state);
            }
            
            if (backup.session) {
                await this.saveSessionInfo(backup.session);
            }
        } catch (error) {
            console.error('Failed to restore privacy data:', error);
            throw new Error('恢复隐私数据失败');
        }
    }

    /**
     * 基础存储操作 - 设置
     */
    private async setToStorage(key: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.set({ [key]: value }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    // 降级到 localStorage
                    localStorage.setItem(key, JSON.stringify(value));
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 基础存储操作 - 获取
     */
    private async getFromStorage(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.get([key], (result) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(result[key]);
                        }
                    });
                } else {
                    // 降级到 localStorage
                    const value = localStorage.getItem(key);
                    resolve(value ? JSON.parse(value) : null);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 基础存储操作 - 删除
     */
    private async removeFromStorage(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.remove([key], () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    // 降级到 localStorage
                    localStorage.removeItem(key);
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}

/**
 * 获取隐私存储实例
 */
export function getPrivacyStorage(): PrivacyStorage {
    return PrivacyStorage.getInstance();
}
