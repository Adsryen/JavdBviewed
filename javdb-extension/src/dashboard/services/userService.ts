/**
 * 用户服务模块 - 提供统一的用户状态管理
 */

import { getValue, setValue } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/config';
import { logAsync } from '../logger';
import type { UserProfile } from '../../types';

/**
 * 用户服务类 - 单例模式
 */
export class UserService {
    private static instance: UserService;
    private userProfile: UserProfile | null = null;
    private listeners: Set<(profile: UserProfile | null) => void> = new Set();

    private constructor() {}

    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    /**
     * 从JavDB获取用户账号信息
     */
    public async fetchUserProfile(): Promise<UserProfile | null> {
        try {
            logAsync('INFO', '开始获取用户账号信息');
            
            // 发送消息到background script获取用户信息
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'fetch-user-profile' }, (response) => {
                    if (response?.success) {
                        logAsync('INFO', '成功获取用户账号信息', response.profile);
                        this.setUserProfile(response.profile);
                        resolve(response.profile);
                    } else {
                        logAsync('ERROR', '获取用户账号信息失败', { error: response?.error });
                        this.setUserProfile(null);
                        resolve(null);
                    }
                });
            });
        } catch (error: any) {
            logAsync('ERROR', '获取用户账号信息时发生错误', { error: error.message });
            this.setUserProfile(null);
            return null;
        }
    }

    /**
     * 保存用户账号信息到本地存储
     */
    public async saveUserProfile(profile: UserProfile): Promise<void> {
        try {
            profile.lastUpdated = Date.now();
            await setValue(STORAGE_KEYS.USER_PROFILE, profile);
            this.setUserProfile(profile);
            logAsync('INFO', '用户账号信息已保存到本地存储');
        } catch (error: any) {
            logAsync('ERROR', '保存用户账号信息失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 从本地存储获取用户账号信息
     */
    public async getUserProfile(): Promise<UserProfile | null> {
        try {
            if (this.userProfile) {
                return this.userProfile;
            }
            
            const profile = await getValue<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
            this.setUserProfile(profile);
            return profile;
        } catch (error: any) {
            logAsync('ERROR', '从本地存储获取用户账号信息失败', { error: error.message });
            return null;
        }
    }

    /**
     * 清除用户账号信息
     */
    public async clearUserProfile(): Promise<void> {
        try {
            await setValue(STORAGE_KEYS.USER_PROFILE, null);
            this.setUserProfile(null);
            logAsync('INFO', '用户账号信息已清除');
        } catch (error: any) {
            logAsync('ERROR', '清除用户账号信息失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 检查用户是否已登录
     */
    public async isUserLoggedIn(): Promise<boolean> {
        const profile = await this.getUserProfile();
        return profile?.isLoggedIn === true;
    }

    /**
     * 获取当前缓存的用户信息（同步方法）
     */
    public getCurrentUserProfile(): UserProfile | null {
        return this.userProfile;
    }

    /**
     * 订阅用户状态变化
     */
    public subscribe(listener: (profile: UserProfile | null) => void): () => void {
        this.listeners.add(listener);
        
        // 返回取消订阅函数
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * 设置用户信息并通知监听器
     */
    private setUserProfile(profile: UserProfile | null): void {
        this.userProfile = profile;
        
        // 通知所有监听器
        this.listeners.forEach(listener => {
            try {
                listener(profile);
            } catch (error: any) {
                logAsync('ERROR', '用户状态监听器执行失败', { error: error.message });
            }
        });
    }

    /**
     * 刷新用户信息
     */
    public async refreshUserProfile(): Promise<UserProfile | null> {
        return await this.fetchUserProfile();
    }

    /**
     * 验证用户权限
     */
    public validateUserPermissions(userProfile?: UserProfile | null): boolean {
        const profile = userProfile || this.userProfile;
        return profile && 
               profile.isLoggedIn && 
               profile.email && 
               profile.username;
    }
}

// 导出单例实例
export const userService = UserService.getInstance();

// 导出便捷函数
export const getUserProfile = () => userService.getUserProfile();
export const saveUserProfile = (profile: UserProfile) => userService.saveUserProfile(profile);
export const clearUserProfile = () => userService.clearUserProfile();
export const fetchUserProfile = () => userService.fetchUserProfile();
export const isUserLoggedIn = () => userService.isUserLoggedIn();
export const validateUserPermissions = (profile?: UserProfile | null) => userService.validateUserPermissions(profile);
