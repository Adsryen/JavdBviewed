/**
 * WebDAV设置模块入口
 */

import type { WebDAVSettings } from './WebDAVSettings';

// 注意：WebDAVSettings 类通过动态导入加载，避免循环依赖

// 延迟创建WebDAV设置实例，避免循环依赖
let _webdavSettings: WebDAVSettings | null = null;

export async function getWebdavSettings(): Promise<WebDAVSettings> {
    if (!_webdavSettings) {
        const { WebDAVSettings } = await import('./WebDAVSettings');
        _webdavSettings = new WebDAVSettings();
    }
    return _webdavSettings;
}

// 为了保持向后兼容，提供一个getter
export const webdavSettings = {
    get instance() {
        return getWebdavSettings();
    }
};
