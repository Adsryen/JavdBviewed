// src/utils/statusPriority.test.ts

import { 
    canUpgradeStatus, 
    getHigherPriorityStatus, 
    safeUpdateStatus, 
    getStatusPriority,
    getStatusDisplayName,
    getStatusesByPriority 
} from './statusPriority';
import { VIDEO_STATUS } from './config';

// 简单的测试函数
function test(description: string, testFn: () => boolean) {
    try {
        const result = testFn();
        console.log(`✅ ${description}: ${result ? 'PASS' : 'FAIL'}`);
        return result;
    } catch (error) {
        console.log(`❌ ${description}: ERROR - ${error}`);
        return false;
    }
}

// 运行测试
export function runStatusPriorityTests() {
    console.log('🧪 开始状态优先级系统测试...\n');

    // 测试优先级数值
    test('优先级数值正确', () => {
        return getStatusPriority(VIDEO_STATUS.VIEWED) === 3 &&
               getStatusPriority(VIDEO_STATUS.WANT) === 2 &&
               getStatusPriority(VIDEO_STATUS.BROWSED) === 1;
    });

    // 测试状态升级规则
    test('可以从已浏览升级到想看', () => {
        return canUpgradeStatus(VIDEO_STATUS.BROWSED, VIDEO_STATUS.WANT);
    });

    test('可以从已浏览升级到已看', () => {
        return canUpgradeStatus(VIDEO_STATUS.BROWSED, VIDEO_STATUS.VIEWED);
    });

    test('可以从想看升级到已看', () => {
        return canUpgradeStatus(VIDEO_STATUS.WANT, VIDEO_STATUS.VIEWED);
    });

    test('不能从想看降级到已浏览', () => {
        return !canUpgradeStatus(VIDEO_STATUS.WANT, VIDEO_STATUS.BROWSED);
    });

    test('不能从已看降级到想看', () => {
        return !canUpgradeStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.WANT);
    });

    test('不能从已看降级到已浏览', () => {
        return !canUpgradeStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.BROWSED);
    });

    // 测试相同状态
    test('相同状态不算升级', () => {
        return !canUpgradeStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.VIEWED);
    });

    // 测试获取更高优先级状态
    test('获取更高优先级状态 - 已看 vs 想看', () => {
        return getHigherPriorityStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.WANT) === VIDEO_STATUS.VIEWED;
    });

    test('获取更高优先级状态 - 想看 vs 已浏览', () => {
        return getHigherPriorityStatus(VIDEO_STATUS.WANT, VIDEO_STATUS.BROWSED) === VIDEO_STATUS.WANT;
    });

    test('获取更高优先级状态 - 已浏览 vs 已看', () => {
        return getHigherPriorityStatus(VIDEO_STATUS.BROWSED, VIDEO_STATUS.VIEWED) === VIDEO_STATUS.VIEWED;
    });

    // 测试安全更新
    test('安全更新 - 允许升级', () => {
        return safeUpdateStatus(VIDEO_STATUS.BROWSED, VIDEO_STATUS.WANT) === VIDEO_STATUS.WANT;
    });

    test('安全更新 - 拒绝降级', () => {
        return safeUpdateStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.BROWSED) === VIDEO_STATUS.VIEWED;
    });

    // 测试显示名称
    test('状态显示名称正确', () => {
        return getStatusDisplayName(VIDEO_STATUS.VIEWED) === '已观看' &&
               getStatusDisplayName(VIDEO_STATUS.WANT) === '我想看' &&
               getStatusDisplayName(VIDEO_STATUS.BROWSED) === '已浏览';
    });

    // 测试优先级排序
    test('状态按优先级排序正确', () => {
        const sorted = getStatusesByPriority();
        return sorted[0] === VIDEO_STATUS.VIEWED &&
               sorted[1] === VIDEO_STATUS.WANT &&
               sorted[2] === VIDEO_STATUS.BROWSED;
    });

    console.log('\n✅ 状态优先级系统测试完成！');
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
    // 在浏览器环境中，可以通过控制台调用
    (window as any).runStatusPriorityTests = runStatusPriorityTests;
}
