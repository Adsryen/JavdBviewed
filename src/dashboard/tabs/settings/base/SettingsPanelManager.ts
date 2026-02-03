/**
 * 设置面板管理器
 * 负责管理所有设置面板的生命周期
 */

import type { ISettingsPanel, ISettingsPanelManager } from '../types';
import { log } from '../../../../utils/logController';

/**
 * 设置面板管理器实现
 */
export class SettingsPanelManager implements ISettingsPanelManager {
    private panels: Map<string, ISettingsPanel> = new Map();
    private initialized = false;

    /**
     * 注册设置面板
     */
    registerPanel(panel: ISettingsPanel): void {
        if (this.panels.has(panel.panelId)) {
            log.verbose(`面板 ${panel.panelId} 已经注册过了`);
            return;
        }

        this.panels.set(panel.panelId, panel);
        log.verbose(`注册面板: ${panel.panelId} (${panel.panelName})`);

        // 如果管理器已经初始化，立即初始化新注册的面板
        if (this.initialized) {
            panel.init();
        }
    }

    /**
     * 注销设置面板
     */
    unregisterPanel(panelId: string): void {
        const panel = this.panels.get(panelId);
        if (panel) {
            panel.destroy();
            this.panels.delete(panelId);
            log.verbose(`注销面板: ${panelId}`);
        }
    }

    /**
     * 获取设置面板
     */
    getPanel(panelId: string): ISettingsPanel | undefined {
        return this.panels.get(panelId);
    }

    /**
     * 获取所有设置面板
     */
    getAllPanels(): ISettingsPanel[] {
        return Array.from(this.panels.values());
    }

    /**
     * 初始化所有面板
     */
    async initAllPanels(): Promise<void> {
        log.verbose(`初始化 ${this.panels.size} 个面板`);

        const initPromises: Promise<void>[] = [];

        for (const panel of this.panels.values()) {
            initPromises.push(
                new Promise<void>((resolve) => {
                    try {
                        panel.init();
                        resolve();
                    } catch (error) {
                        log.error(`初始化面板 ${panel.panelId} 失败:`, error);
                        resolve(); // 不阻塞其他面板的初始化
                    }
                })
            );
        }

        await Promise.all(initPromises);
        this.initialized = true;
        log.verbose(`所有面板初始化完成`);
    }

    /**
     * 保存所有面板设置
     */
    async saveAllPanels(): Promise<void> {
        log.verbose(`保存所有面板设置`);

        const savePromises: Promise<void>[] = [];

        for (const panel of this.panels.values()) {
            savePromises.push(
                new Promise<void>((resolve) => {
                    panel.saveSettings()
                        .then(() => resolve())
                        .catch((error) => {
                            log.error(`保存面板 ${panel.panelId} 设置失败:`, error);
                            resolve(); // 不阻塞其他面板的保存
                        });
                })
            );
        }

        await Promise.all(savePromises);
        log.verbose(`所有面板设置保存完成`);
    }

    /**
     * 销毁所有面板
     */
    destroyAllPanels(): void {
        log.verbose(`销毁所有面板`);

        for (const panel of this.panels.values()) {
            try {
                panel.destroy();
            } catch (error) {
                log.error(`销毁面板 ${panel.panelId} 失败:`, error);
            }
        }

        this.panels.clear();
        this.initialized = false;
        log.verbose(`所有面板已销毁`);
    }

    /**
     * 获取面板数量
     */
    getPanelCount(): number {
        return this.panels.size;
    }

    /**
     * 检查面板是否已注册
     */
    hasPanel(panelId: string): boolean {
        return this.panels.has(panelId);
    }

    /**
     * 获取所有面板ID
     */
    getPanelIds(): string[] {
        return Array.from(this.panels.keys());
    }

    /**
     * 批量注册面板
     */
    registerPanels(panels: ISettingsPanel[]): void {
        panels.forEach(panel => this.registerPanel(panel));
    }

    /**
     * 根据条件查找面板
     */
    findPanels(predicate: (panel: ISettingsPanel) => boolean): ISettingsPanel[] {
        return this.getAllPanels().filter(predicate);
    }
}

// 导出单例实例
export const settingsPanelManager = new SettingsPanelManager();
