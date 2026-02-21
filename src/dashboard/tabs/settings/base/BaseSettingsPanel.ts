/**
 * 设置面板基类
 */

import { STATE } from '../../../state';
import { saveSettings } from '../../../../utils/storage';
import { showMessage } from '../../../ui/toast';
import { logAsync } from '../../../logger';
import type { ExtensionSettings } from '../../../../types';
import { SettingsPanelState } from '../types';
import type {
    ISettingsPanel,
    SettingsPanelConfig,
    SettingsPanelEvent,
    SettingsPanelEventHandler,
    SettingsValidationResult,
    SettingsSaveResult
} from '../types';

/**
 * 设置面板基类
 * 提供通用的设置面板功能和生命周期管理
 */
export abstract class BaseSettingsPanel implements ISettingsPanel {
    protected config: SettingsPanelConfig;
    protected state: SettingsPanelState = SettingsPanelState.UNINITIALIZED;
    protected eventHandlers: Map<SettingsPanelEvent, SettingsPanelEventHandler[]> = new Map();
    protected autoSaveTimeout?: number;

    constructor(config: SettingsPanelConfig) {
        this.config = config;
    }

    /** 面板ID */
    get panelId(): string {
        return this.config.panelId;
    }

    /** 面板名称 */
    get panelName(): string {
        return this.config.panelName;
    }

    /** 当前状态 */
    get currentState(): SettingsPanelState {
        return this.state;
    }

    /**
     * 初始化面板
     */
    init(): void {
        if (this.state !== SettingsPanelState.UNINITIALIZED && this.state !== SettingsPanelState.DESTROYED) {
            console.warn(`[${this.panelName}] 面板已经初始化过了，重新加载设置`);
            // 如果已经初始化过，重新加载设置
            // 先重置状态为 INITIALIZED，然后再加载
            this.setState(SettingsPanelState.INITIALIZED);
            this.loadSettings();
            return;
        }

        this.setState(SettingsPanelState.INITIALIZING);
        
        try {
            this.initializeElements();
            this.bindEvents();
            this.setState(SettingsPanelState.INITIALIZED);
            this.emit('init');
            
            // 自动加载设置
            this.loadSettings();
        } catch (error) {
            console.error(`[${this.panelName}] 初始化失败:`, error);
            this.setState(SettingsPanelState.ERROR);
            this.emit('error', error);
        }
    }

    /**
     * 加载设置到UI
     */
    async loadSettings(): Promise<void> {
        if (this.state === SettingsPanelState.LOADING) {
            return;
        }

        this.setState(SettingsPanelState.LOADING);
        
        try {
            // 从存储中重新加载最新设置到 STATE
            const { getSettings } = await import('../../../../utils/storage');
            STATE.settings = await getSettings();
            console.log(`[${this.panelName}] 已从存储重新加载设置到 STATE`);
            
            // 重新初始化元素引用（防止 DOM 被重新渲染后引用失效）
            if (this.state !== SettingsPanelState.INITIALIZING) {
                console.log(`[${this.panelName}] 重新初始化元素引用`);
                this.initializeElements();
            }
            
            await this.doLoadSettings();
            this.setState(SettingsPanelState.LOADED);
            this.emit('load');
        } catch (error) {
            console.error(`[${this.panelName}] 加载设置失败:`, error);
            this.setState(SettingsPanelState.ERROR);
            this.emit('error', error);
        }
    }

    /**
     * 保存设置
     */
    async saveSettings(): Promise<void> {
        if (this.state === SettingsPanelState.SAVING) {
            return;
        }

        // 验证设置
        if (this.config.requireValidation && !this.validateSettings()) {
            return;
        }

        this.setState(SettingsPanelState.SAVING);
        
        try {
            const result = await this.doSaveSettings();
            
            if (result.success) {
                this.setState(SettingsPanelState.LOADED);
                this.emit('save', result);
                showMessage(`${this.panelName}设置已保存`, 'success');
            } else {
                throw new Error(result.error || '保存失败');
            }
        } catch (error) {
            console.error(`[${this.panelName}] 保存设置失败:`, error);
            this.setState(SettingsPanelState.ERROR);
            this.emit('error', error);
            showMessage(`保存${this.panelName}设置失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
        }
    }

    /**
     * 验证设置
     */
    validateSettings(): boolean {
        const result = this.doValidateSettings();
        
        if (!result.isValid) {
            const errors = result.errors || [];
            const warnings = result.warnings || [];
            
            if (errors.length > 0) {
                showMessage(`${this.panelName}设置验证失败: ${errors.join(', ')}`, 'error');
                return false;
            }
            
            if (warnings.length > 0) {
                showMessage(`${this.panelName}设置警告: ${warnings.join(', ')}`, 'warn');
            }
        }
        
        return result.isValid;
    }

    /**
     * 销毁面板
     */
    destroy(): void {
        this.unbindEvents();
        this.clearAutoSaveTimeout();
        this.eventHandlers.clear();
        this.setState(SettingsPanelState.DESTROYED);
        this.emit('destroy');
    }

    /**
     * 获取设置数据
     */
    getSettings(): Partial<ExtensionSettings> {
        return this.doGetSettings();
    }

    /**
     * 设置数据
     */
    setSettings(settings: Partial<ExtensionSettings>): void {
        this.doSetSettings(settings);
    }

    /**
     * 添加事件监听器
     */
    on(event: SettingsPanelEvent, handler: SettingsPanelEventHandler): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(handler);
    }

    /**
     * 移除事件监听器
     */
    off(event: SettingsPanelEvent, handler: SettingsPanelEventHandler): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    protected emit(event: SettingsPanelEvent, data?: any): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event, data);
                } catch (error) {
                    console.error(`[${this.panelName}] 事件处理器错误:`, error);
                }
            });
        }
    }

    /**
     * 设置状态
     */
    protected setState(newState: SettingsPanelState): void {
        const oldState = this.state;
        this.state = newState;
        // 只在详细模式下显示状态变化日志
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${this.panelName}] 状态变化: ${oldState} -> ${newState}`);
        }
    }

    /**
     * 自动保存
     */
    protected scheduleAutoSave(): void {
        if (!this.config.autoSave) {
            return;
        }

        this.clearAutoSaveTimeout();
        
        const delay = this.config.saveDelay || 1000;
        this.autoSaveTimeout = window.setTimeout(() => {
            this.saveSettings();
        }, delay);
    }

    /**
     * 清除自动保存定时器
     */
    protected clearAutoSaveTimeout(): void {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = undefined;
        }
    }

    // 抽象方法，子类必须实现
    protected abstract initializeElements(): void;
    protected abstract bindEvents(): void;
    protected abstract unbindEvents(): void;
    protected abstract doLoadSettings(): Promise<void>;
    protected abstract doSaveSettings(): Promise<SettingsSaveResult>;
    protected abstract doValidateSettings(): SettingsValidationResult;
    protected abstract doGetSettings(): Partial<ExtensionSettings>;
    protected abstract doSetSettings(settings: Partial<ExtensionSettings>): void;
}
