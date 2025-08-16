/**
 * 网络测试设置模块入口
 */

// 注意：NetworkTestSettings 类通过动态导入加载，避免循环依赖

// 延迟创建网络测试设置实例，避免循环依赖
let _networkTestSettings: NetworkTestSettings | null = null;

export async function getNetworkTestSettings(): Promise<NetworkTestSettings> {
    if (!_networkTestSettings) {
        const { NetworkTestSettings } = await import('./NetworkTestSettings');
        _networkTestSettings = new NetworkTestSettings();
    }
    return _networkTestSettings;
}

// 为了保持向后兼容，提供一个getter
export const networkTestSettings = {
    get instance() {
        return getNetworkTestSettings();
    }
};
