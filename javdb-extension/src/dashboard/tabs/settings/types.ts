/**
 * 设置页面相关的类型定义
 */

import type { ExtensionSettings } from '../../../types';

/**
 * 设置面板接口
 */
export interface ISettingsPanel {
    /** 面板ID，对应HTML中的元素ID */
    readonly panelId: string;
    
    /** 面板名称 */
    readonly panelName: string;
    
    /** 初始化面板 */
    init(): void;
    
    /** 加载设置到UI */
    loadSettings(): Promise<void>;
    
    /** 从UI保存设置 */
    saveSettings(): Promise<void>;
    
    /** 验证设置是否有效 */
    validateSettings(): boolean;
    
    /** 销毁面板，清理事件监听器 */
    destroy(): void;
    
    /** 获取面板相关的设置数据 */
    getSettings(): Partial<ExtensionSettings>;
    
    /** 设置面板相关的设置数据 */
    setSettings(settings: Partial<ExtensionSettings>): void;
}

/**
 * 设置面板配置
 */
export interface SettingsPanelConfig {
    /** 面板ID */
    panelId: string;
    
    /** 面板名称 */
    panelName: string;
    
    /** 是否自动保存 */
    autoSave?: boolean;
    
    /** 保存延迟（毫秒） */
    saveDelay?: number;
    
    /** 是否需要验证 */
    requireValidation?: boolean;
}

/**
 * 设置面板事件类型
 */
export type SettingsPanelEvent = 
    | 'init'
    | 'load'
    | 'save'
    | 'validate'
    | 'destroy'
    | 'change'
    | 'error';

/**
 * 设置面板事件处理器
 */
export type SettingsPanelEventHandler = (event: SettingsPanelEvent, data?: any) => void;

/**
 * 设置验证结果
 */
export interface SettingsValidationResult {
    /** 是否有效 */
    isValid: boolean;
    
    /** 错误信息 */
    errors?: string[];
    
    /** 警告信息 */
    warnings?: string[];
}

/**
 * 设置保存结果
 */
export interface SettingsSaveResult {
    /** 是否成功 */
    success: boolean;
    
    /** 错误信息 */
    error?: string;
    
    /** 保存的设置数据 */
    savedSettings?: Partial<ExtensionSettings>;
}

/**
 * 设置面板状态
 */
export enum SettingsPanelState {
    /** 未初始化 */
    UNINITIALIZED = 'uninitialized',
    
    /** 初始化中 */
    INITIALIZING = 'initializing',
    
    /** 已初始化 */
    INITIALIZED = 'initialized',
    
    /** 加载中 */
    LOADING = 'loading',
    
    /** 已加载 */
    LOADED = 'loaded',
    
    /** 保存中 */
    SAVING = 'saving',
    
    /** 错误状态 */
    ERROR = 'error',
    
    /** 已销毁 */
    DESTROYED = 'destroyed'
}

/**
 * 设置面板管理器接口
 */
export interface ISettingsPanelManager {
    /** 注册设置面板 */
    registerPanel(panel: ISettingsPanel): void;
    
    /** 注销设置面板 */
    unregisterPanel(panelId: string): void;
    
    /** 获取设置面板 */
    getPanel(panelId: string): ISettingsPanel | undefined;
    
    /** 获取所有设置面板 */
    getAllPanels(): ISettingsPanel[];
    
    /** 初始化所有面板 */
    initAllPanels(): Promise<void>;
    
    /** 保存所有面板设置 */
    saveAllPanels(): Promise<void>;
    
    /** 销毁所有面板 */
    destroyAllPanels(): void;
}
