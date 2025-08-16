/**
 * 全局操作设置模块入口
 */

// 注意：GlobalActionsSettings 类通过动态导入加载，避免循环依赖

// 延迟创建全局操作设置实例，避免循环依赖
let _globalActionsSettings: GlobalActionsSettings | null = null;

export async function getGlobalActionsSettings(): Promise<GlobalActionsSettings> {
    if (!_globalActionsSettings) {
        const { GlobalActionsSettings } = await import('./GlobalActionsSettings');
        _globalActionsSettings = new GlobalActionsSettings();
    }
    return _globalActionsSettings;
}

// 为了保持向后兼容，提供一个getter
export const globalActionsSettings = {
    get instance() {
        return getGlobalActionsSettings();
    }
};
