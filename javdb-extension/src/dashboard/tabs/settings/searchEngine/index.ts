/**
 * 搜索引擎设置模块入口
 */

// 注意：SearchEngineSettings 类通过动态导入加载，避免循环依赖

// 延迟创建搜索引擎设置实例，避免循环依赖
let _searchEngineSettings: SearchEngineSettings | null = null;

export async function getSearchEngineSettings(): Promise<SearchEngineSettings> {
    if (!_searchEngineSettings) {
        const { SearchEngineSettings } = await import('./SearchEngineSettings');
        _searchEngineSettings = new SearchEngineSettings();
    }
    return _searchEngineSettings;
}

// 为了保持向后兼容，提供一个getter
export const searchEngineSettings = {
    get instance() {
        return getSearchEngineSettings();
    }
};
