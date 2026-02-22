/**
 * 内容脚本隐私功能入口
 */

import { getElementProtector } from './elementProtector';
import { getPrivacyStateListener } from './stateListener';
import { initializePrivacySystem } from '../../services/privacy';

/**
 * 初始化内容脚本隐私功能
 */
export async function initializeContentPrivacy(): Promise<void> {
    try {
        // 静默初始化隐私功能

        // 等待DOM完全加载
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            });
        }

        // 初始化隐私系统
        await initializePrivacySystem();

        // 启动元素保护器
        const elementProtector = getElementProtector();
        await elementProtector.start();

        // 启动状态监听器
        const stateListener = getPrivacyStateListener();
        stateListener.startListening();

        // Dashboard页面的隐私保护由dashboard.ts直接处理，这里不需要额外监听
        if (window.location.href.includes('dashboard.html')) {
            console.log('[Privacy] Dashboard detected, privacy will be handled by dashboard.ts');
        }

        console.log('[Privacy] Content privacy features initialized successfully');
    } catch (error) {
        console.error('[Privacy] Failed to initialize content privacy features:', error);
    }
}

/**
 * 清理隐私功能
 */
export function cleanupContentPrivacy(): void {
    try {
        // 停止元素保护器
        const elementProtector = getElementProtector();
        elementProtector.stop();

        // 停止状态监听器
        const stateListener = getPrivacyStateListener();
        stateListener.stopListening();

        console.log('[Privacy] Content privacy features cleaned up');
    } catch (error) {
        console.error('[Privacy] Failed to cleanup content privacy features:', error);
    }
}

// 导出组件
export { getElementProtector } from './elementProtector';
export { getPrivacyStateListener } from './stateListener';

// 导出隐私服务
export * from '../../services/privacy';
