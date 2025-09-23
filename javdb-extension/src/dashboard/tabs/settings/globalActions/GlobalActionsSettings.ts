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
    private clearWatchedBtn!: HTMLButtonElement;
    private clearWantWatchBtn!: HTMLButtonElement;
    private clearActorsBtn!: HTMLButtonElement;
    private clearAllDataBtn!: HTMLButtonElement;

    // 数据导入导出按钮
    private exportDataBtn!: HTMLButtonElement;
    private importDataBtn!: HTMLButtonElement;
    private importFileInput!: HTMLInputElement;

    // 缓存管理按钮
    private clearCacheBtn!: HTMLButtonElement;
    private clearLogsBtn!: HTMLButtonElement;

    // 系统操作按钮
    private resetSettingsBtn!: HTMLButtonElement;
    private reloadExtensionBtn!: HTMLButtonElement;

    constructor() {
        super({
            panelId: 'global-actions-settings',
            panelName: '全局操作',
            autoSave: false, // 全局操作不需要保存设置
            requireValidation: false
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 使用HTML中实际存在的元素ID
        this.clearWatchedBtn = document.getElementById('clearAllBtn') as HTMLButtonElement; // 复用清空所有按钮
        this.clearWantWatchBtn = document.getElementById('clearTempDataBtn') as HTMLButtonElement;
        this.clearActorsBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement;
        this.clearAllDataBtn = document.getElementById('clearAllBtn') as HTMLButtonElement;

        // 数据导入导出按钮
        this.exportDataBtn = document.getElementById('exportAllBtn') as HTMLButtonElement;
        this.importDataBtn = document.getElementById('importAllBtn') as HTMLButtonElement;
        this.importFileInput = document.getElementById('importAllFile') as HTMLInputElement;

        // 缓存管理按钮
        this.clearCacheBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement;
        this.clearLogsBtn = document.getElementById('resetSettingsBtn') as HTMLButtonElement; // 复用重置设置按钮

        // 系统操作按钮
        this.resetSettingsBtn = document.getElementById('resetSettingsBtn') as HTMLButtonElement;
        this.reloadExtensionBtn = document.getElementById('reloadExtensionBtn') as HTMLButtonElement;

        if (!this.clearAllDataBtn || !this.exportDataBtn || !this.importDataBtn ||
            !this.importFileInput || !this.clearCacheBtn || !this.resetSettingsBtn || !this.reloadExtensionBtn) {
            throw new Error('全局操作设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 数据清理事件
        this.clearWatchedBtn?.addEventListener('click', this.handleClearWatched.bind(this));
        this.clearWantWatchBtn?.addEventListener('click', this.handleClearWantWatch.bind(this));
        this.clearActorsBtn?.addEventListener('click', this.handleClearActors.bind(this));
        this.clearAllDataBtn?.addEventListener('click', this.handleClearAllData.bind(this));

        // 数据导入导出事件
        this.exportDataBtn?.addEventListener('click', this.handleExportData.bind(this));
        this.importDataBtn?.addEventListener('click', this.handleImportData.bind(this));
        this.importFileInput?.addEventListener('change', this.handleFileSelected.bind(this));

        // 缓存管理事件
        this.clearCacheBtn?.addEventListener('click', this.handleClearCache.bind(this));
        this.clearLogsBtn?.addEventListener('click', this.handleClearLogs.bind(this));

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
        // 全局操作面板不需要加载设置，只需要初始化UI状态
        // 可以在这里显示一些统计信息
        this.updateDataStatistics();
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
     * 更新数据统计信息
     */
    private async updateDataStatistics(): Promise<void> {
        try {
            const statsDiv = document.getElementById('dataStatistics');
            if (!statsDiv) return;

            // 获取存储的数据统计
            const watchedCount = await this.getStorageItemCount('watchedVideos');
            const wantWatchCount = await this.getStorageItemCount('wantWatchVideos');
            const actorsCount = await this.getStorageItemCount('actors');

            statsDiv.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">${watchedCount}</div>
                        <div class="stat-label">已观看影片</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${wantWatchCount}</div>
                        <div class="stat-label">想看影片</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${actorsCount}</div>
                        <div class="stat-label">收藏演员</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('更新数据统计失败:', error);
        }
    }

    /**
     * 获取存储项目数量
     */
    private async getStorageItemCount(key: string): Promise<number> {
        try {
            const result = await chrome.storage.local.get(key);
            const data = result[key];
            if (Array.isArray(data)) {
                return data.length;
            } else if (data && typeof data === 'object') {
                return Object.keys(data).length;
            }
            return 0;
        } catch (error) {
            console.error(`获取 ${key} 数量失败:`, error);
            return 0;
        }
    }

    /**
     * 处理清除已观看数据
     */
    private async handleClearWatched(): Promise<void> {
        if (!confirm('确定要清除所有已观看影片数据吗？此操作不可撤销！')) {
            return;
        }

        try {
            await chrome.storage.local.remove('watchedVideos');
            showMessage('已观看影片数据已清除', 'success');
            logAsync('INFO', '用户清除了已观看影片数据');
            this.updateDataStatistics();
        } catch (error) {
            showMessage('清除已观看数据失败', 'error');
            logAsync('ERROR', `清除已观看数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 处理清除想看数据
     */
    private async handleClearWantWatch(): Promise<void> {
        if (!confirm('确定要清除所有想看影片数据吗？此操作不可撤销！')) {
            return;
        }

        try {
            await chrome.storage.local.remove('wantWatchVideos');
            showMessage('想看影片数据已清除', 'success');
            logAsync('INFO', '用户清除了想看影片数据');
            this.updateDataStatistics();
        } catch (error) {
            showMessage('清除想看数据失败', 'error');
            logAsync('ERROR', `清除想看数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 处理清除演员数据
     */
    private async handleClearActors(): Promise<void> {
        if (!confirm('确定要清除所有收藏演员数据吗？此操作不可撤销！')) {
            return;
        }

        try {
            await chrome.storage.local.remove('actors');
            showMessage('收藏演员数据已清除', 'success');
            logAsync('INFO', '用户清除了收藏演员数据');
            this.updateDataStatistics();
        } catch (error) {
            showMessage('清除演员数据失败', 'error');
            logAsync('ERROR', `清除演员数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
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
     * 处理导出数据
     */
    private async handleExportData(): Promise<void> {
        await requireAuthIfRestricted('data-export', async () => {
            try {
                this.exportDataBtn.disabled = true;
                this.exportDataBtn.textContent = '导出中...';

                const allData = await chrome.storage.local.get(null);
                const exportData = {
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    data: allData
                };

                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                showMessage('数据导出成功', 'success');
                logAsync('INFO', '用户导出了扩展数据');
            } catch (error) {
                showMessage('导出数据失败', 'error');
                logAsync('ERROR', `导出数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
            } finally {
                this.exportDataBtn.disabled = false;
                this.exportDataBtn.textContent = '导出数据';
            }
        }, { title: '需要密码验证', message: '导出数据受私密模式保护，请先完成密码验证。' });
    }

    /**
     * 处理导入数据
     */
    private async handleImportData(): Promise<void> {
        this.importFileInput.click();
    }

    /**
     * 处理文件选择
     */
    private async handleFileSelected(event: Event): Promise<void> {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        await requireAuthIfRestricted('data-import', async () => {
            try {
                const text = await file.text();
                const importData = JSON.parse(text);

                if (!importData.data) {
                    throw new Error('无效的备份文件格式');
                }

                if (!confirm('确定要导入数据吗？这将覆盖当前的所有数据！')) {
                    return;
                }

                await chrome.storage.local.clear();
                await chrome.storage.local.set(importData.data);

                showMessage('数据导入成功，页面将刷新', 'success');
                logAsync('INFO', '用户导入了扩展数据');

                // 延迟刷新页面
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                showMessage('导入数据失败：文件格式错误', 'error');
                logAsync('ERROR', `导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }, { title: '需要密码验证', message: '导入数据受私密模式保护，请先完成密码验证。' });
    }

    /**
     * 处理清除缓存
     */
    private async handleClearCache(): Promise<void> {
        try {
            // 清除图片缓存等
            showMessage('缓存清除功能正在开发中', 'info');
            logAsync('INFO', '用户尝试清除缓存');
        } catch (error) {
            showMessage('清除缓存失败', 'error');
            logAsync('ERROR', `清除缓存失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 处理清除日志
     */
    private async handleClearLogs(): Promise<void> {
        if (!confirm('确定要清除所有日志吗？')) {
            return;
        }

        try {
            await chrome.storage.local.remove('logs');
            showMessage('日志已清除', 'success');
            logAsync('INFO', '用户清除了日志数据');
        } catch (error) {
            showMessage('清除日志失败', 'error');
            logAsync('ERROR', `清除日志失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
