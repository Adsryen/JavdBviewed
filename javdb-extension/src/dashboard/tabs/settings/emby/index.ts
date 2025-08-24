/**
 * Emby增强设置模块入口
 */

// 注意：EmbySettings 类通过动态导入加载，避免循环依赖

// 延迟创建Emby设置实例，避免循环依赖
let _embySettings: EmbySettings | null = null;

export async function getEmbySettings(): Promise<EmbySettings> {
    if (!_embySettings) {
        const { EmbySettings } = await import('./EmbySettings');
        _embySettings = new EmbySettings();
    }
    return _embySettings;
}

// 为了保持向后兼容，提供一个getter
export const embySettings = {
    get instance() {
        return getEmbySettings();
    }
};
