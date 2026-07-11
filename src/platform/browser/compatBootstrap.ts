/**
 * @file compatBootstrap.ts
 * @description 扩展跨浏览器兼容引导 —— 入口侧最先执行，确保 chrome 命名空间可用
 * @module platform/browser
 *
 * 在 background / content / dashboard / popup 等入口顶部 side-effect import：
 *   import '../../platform/browser/compatBootstrap';
 */

import { ensureChromeNamespace } from './extensionApi';

// 模块加载时立即归一化；返回值供调试/测试使用
export const extensionApiReady = ensureChromeNamespace();
