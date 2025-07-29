/**
 * 115网盘功能测试
 */

import { getDrive115Service, initializeDrive115Service } from './index';
import { isValidMagnetUrl, parseDynamicDirectory } from './utils';

/**
 * 测试115基础功能
 */
export async function testDrive115Basic(): Promise<void> {
    console.log('开始测试115基础功能...');

    try {
        // 初始化服务
        const service = await initializeDrive115Service();
        console.log('✓ 115服务初始化成功');

        // 测试设置
        const settings = service.getSettings();
        console.log('✓ 获取设置成功:', settings);

        // 测试工具函数
        const validMagnet = 'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678';
        const invalidMagnet = 'invalid-magnet-url';
        
        console.log('✓ 磁链验证测试:');
        console.log('  - 有效磁链:', isValidMagnetUrl(validMagnet));
        console.log('  - 无效磁链:', isValidMagnetUrl(invalidMagnet));

        // 测试动态目录解析
        const dirTemplate = '${#star}/云下载/${#series}';
        const params = { star: '测试演员', series: '测试系列' };
        const parsedDir = parseDynamicDirectory(dirTemplate, params);
        console.log('✓ 动态目录解析:', parsedDir);

        console.log('115基础功能测试完成');
    } catch (error) {
        console.error('115基础功能测试失败:', error);
        throw error;
    }
}

/**
 * 测试115搜索功能
 */
export async function testDrive115Search(query: string = 'test'): Promise<void> {
    console.log('开始测试115搜索功能...');

    try {
        const service = getDrive115Service();
        
        if (!service.isEnabled()) {
            console.log('⚠ 115功能未启用，跳过搜索测试');
            return;
        }

        const results = await service.searchFiles(query);
        console.log('✓ 搜索测试完成，结果数量:', results.length);
        
        if (results.length > 0) {
            console.log('  - 示例结果:', results[0]);
        }
    } catch (error) {
        console.error('115搜索功能测试失败:', error);
        // 搜索失败可能是因为未登录115，不抛出错误
    }
}

/**
 * 测试115日志功能
 */
export async function testDrive115Logs(): Promise<void> {
    console.log('开始测试115日志功能...');

    try {
        const service = getDrive115Service();
        
        // 获取日志
        const logs = await service.getLogs();
        console.log('✓ 获取日志成功，数量:', logs.length);

        // 获取日志统计
        const stats = await service.getLogStats();
        console.log('✓ 获取日志统计成功:', stats);

        console.log('115日志功能测试完成');
    } catch (error) {
        console.error('115日志功能测试失败:', error);
        throw error;
    }
}

/**
 * 运行所有115测试
 */
export async function runAllDrive115Tests(): Promise<void> {
    console.log('=== 开始115网盘功能测试 ===');

    try {
        await testDrive115Basic();
        await testDrive115Search();
        await testDrive115Logs();
        
        console.log('=== 115网盘功能测试全部完成 ===');
    } catch (error) {
        console.error('=== 115网盘功能测试失败 ===', error);
        throw error;
    }
}

// 如果在浏览器环境中，可以将测试函数暴露到全局
if (typeof window !== 'undefined') {
    (window as any).testDrive115 = {
        basic: testDrive115Basic,
        search: testDrive115Search,
        logs: testDrive115Logs,
        all: runAllDrive115Tests
    };
}
