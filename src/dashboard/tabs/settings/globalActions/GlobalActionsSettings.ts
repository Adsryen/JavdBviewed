/**
 * 全局操作设置面板
 * 数据管理、导入导出、清理等全局操作功能
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { requireAuthIfRestricted } from '../../../../services/privacy';

/**
 * 全局操作设置面板类
 */
export class GlobalActionsSettings extends BaseSettingsPanel {
    // 数据清理按钮
    private clearAllDataBtn!: HTMLButtonElement;

    // 缓存管理按钮
    private clearCacheBtn!: HTMLButtonElement;
    private clearTempDataBtn!: HTMLButtonElement;

    // 系统操作按钮
    private resetSettingsBtn!: HTMLButtonElement;
    private reloadExtensionBtn!: HTMLButtonElement;

    constructor() {
        super({
            panelId: 'global-actions',
            panelName: '全局操作',
            autoSave: false, // 全局操作不需要保存设置
            requireValidation: false
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 数据管理按钮
        this.clearAllDataBtn = document.getElementById('clearAllBtn') as HTMLButtonElement;

        // 缓存管理按钮
        this.clearCacheBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement;
        this.clearTempDataBtn = document.getElementById('clearTempDataBtn') as HTMLButtonElement;

        // 系统操作按钮
        this.resetSettingsBtn = document.getElementById('resetSettingsBtn') as HTMLButtonElement;
        this.reloadExtensionBtn = document.getElementById('reloadExtensionBtn') as HTMLButtonElement;

        if (!this.clearAllDataBtn || !this.clearCacheBtn || !this.clearTempDataBtn ||
            !this.resetSettingsBtn || !this.reloadExtensionBtn) {
            throw new Error('全局操作设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 数据清理事件
        this.clearAllDataBtn?.addEventListener('click', this.handleClearAllData.bind(this));

        // 缓存管理事件
        this.clearCacheBtn?.addEventListener('click', this.handleClearCache.bind(this));
        this.clearTempDataBtn?.addEventListener('click', this.handleClearTempData.bind(this));

        // 系统操作事件
        this.resetSettingsBtn?.addEventListener('click', this.handleResetSettings.bind(this));
        this.reloadExtensionBtn?.addEventListener('click', this.handleReloadExtension.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        // 这里可以添加解绑逻辑，但由于使用了bind，需要保存引用才能正确解绑
        // 为简化起见，暂时省略
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        // 全局操作面板不需要加载设置
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        // 全局操作面板不需要保存设置
        return { success: true };
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        // 全局操作面板不需要验证设置
        return { isValid: true };
    }

    /**
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        // 全局操作面板不需要返回设置
        return {};
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        void settings;
        // 全局操作面板不需要设置数据到UI
    }

    /**
     * 处理清除所有数据
     */
    private async handleClearAllData(): Promise<void> {
        await requireAuthIfRestricted('advanced-settings', async () => {
            if (!confirm('确定要清除所有扩展数据吗？此操作不可撤销！\n\n这将清除：\n- 所有已观看影片\n- 所有想看影片\n- 所有收藏演员\n- 所有设置配置')) {
                return;
            }

            try {
                await chrome.storage.local.clear();
                showMessage('所有数据已清除，页面将刷新', 'success');
                logAsync('INFO', '用户清除了所有扩展数据');
                
                // 延迟刷新页面
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                showMessage('清除所有数据失败', 'error');
                logAsync('ERROR', `清除所有数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }, { title: '需要密码验证', message: '清除所有数据为敏感操作，请先完成密码验证。' });
    }

    /**
     * 处理清除缓存
     */
    private async handleClearCache(): Promise<void> {
        if (!confirm('确定要清空缓存吗？这将清除所有缓存的图片、头像等临时文件。')) {
            return;
        }

        try {
            // 清除可能的缓存数据
            const keysToRemove = [
                'actorAvatarCache',
                'videoCoverCache',
                'imageCache',
                'thumbnailCache'
            ];
            
            await chrome.storage.local.remove(keysToRemove);
            
            showMessage('缓存已清除', 'success');
            logAsync('INFO', '用户清除了缓存数据');
        } catch (error) {
            showMessage('清除缓存失败', 'error');
            logAsync('ERROR', `清除缓存失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 处理清空临时数据
     */
    private async handleClearTempData(): Promise<void> {
        if (!confirm('确定要清空临时数据吗？这将清除搜索历史、临时设置等非关键数据。')) {
            return;
        }

        try {
            // 清除临时数据
            const keysToRemove = [
                'searchHistory',
                'tempSettings',
                'sessionData',
                'recentViews',
                'logs'
            ];
            
            await chrome.storage.local.remove(keysToRemove);
            
            showMessage('临时数据已清除', 'success');
            logAsync('INFO', '用户清除了临时数据');
        } catch (error) {
            showMessage('清除临时数据失败', 'error');
            logAsync('ERROR', `清除临时数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 处理重置所有设置
     */
    private async handleResetSettings(): Promise<void> {
        if (!confirm('确定要重置所有设置吗？这将恢复所有设置为默认值，但保留数据记录。')) {
            return;
        }

        try {
            // 获取默认设置
            const { DEFAULT_SETTINGS } = await import('../../../../utils/config');

            // 保存默认设置
            await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });

            showMessage('所有设置已重置为默认值', 'success');
            logAsync('INFO', '用户重置了所有设置');

            // 建议刷新页面
            if (confirm('设置已重置，是否刷新页面以应用更改？')) {
                window.location.reload();
            }
        } catch (error) {
            showMessage('重置设置失败', 'error');
            logAsync('ERROR', `重置设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 处理重新加载扩展
     */
    private async handleReloadExtension(): Promise<void> {
        if (!confirm('确定要重新加载扩展吗？这将关闭所有扩展页面。')) {
            return;
        }

        try {
            showMessage('正在重新加载扩展...', 'info');
            logAsync('INFO', '用户触发了扩展重新加载');

            // 延迟执行重新加载，确保消息能够显示
            setTimeout(() => {
                chrome.runtime.reload();
            }, 1000);
        } catch (error) {
            showMessage('重新加载扩展失败', 'error');
            logAsync('ERROR', `重新加载扩展失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
}
