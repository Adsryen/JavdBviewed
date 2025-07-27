// src/content/concurrencyTest.ts
// 并发控制测试工具

import { storageManager } from './concurrency';
import { getValue, setValue } from '../utils/storage';
import type { VideoRecord } from '../types';

// 模拟并发测试
export async function testConcurrentOperations(): Promise<void> {
    console.log('[ConcurrencyTest] Starting concurrent operations test...');
    
    // 清理测试数据
    await setValue('viewed', {});
    
    // 创建测试记录
    const testRecords: VideoRecord[] = [
        {
            id: 'TEST-001',
            title: 'Test Video 1',
            status: 'browsed',
            timestamp: Date.now(),
            javdbUrl: 'https://javdb.com/v/test1',
            tags: ['tag1'],
            releaseDate: '2024-01-01',
            javdbImage: 'test1.jpg',
            updatedAt: Date.now()
        },
        {
            id: 'TEST-002',
            title: 'Test Video 2',
            status: 'browsed',
            timestamp: Date.now(),
            javdbUrl: 'https://javdb.com/v/test2',
            tags: ['tag2'],
            releaseDate: '2024-01-02',
            javdbImage: 'test2.jpg',
            updatedAt: Date.now()
        },
        {
            id: 'TEST-003',
            title: 'Test Video 3',
            status: 'browsed',
            timestamp: Date.now(),
            javdbUrl: 'https://javdb.com/v/test3',
            tags: ['tag3'],
            releaseDate: '2024-01-03',
            javdbImage: 'test3.jpg',
            updatedAt: Date.now()
        }
    ];
    
    // 并发添加测试
    console.log('[ConcurrencyTest] Testing concurrent additions...');
    const addPromises = testRecords.map((record, index) => 
        storageManager.addRecord(record.id, record, `test-add-${index}`)
    );
    
    const addResults = await Promise.all(addPromises);
    console.log('[ConcurrencyTest] Add results:', addResults);
    
    // 验证所有记录都被正确添加
    const storedRecords = await getValue<Record<string, VideoRecord>>('viewed', {});
    const storedIds = Object.keys(storedRecords);
    console.log('[ConcurrencyTest] Stored record IDs:', storedIds);
    
    if (storedIds.length !== testRecords.length) {
        console.error('[ConcurrencyTest] FAILED: Expected', testRecords.length, 'records, got', storedIds.length);
        return;
    }
    
    // 并发更新测试
    console.log('[ConcurrencyTest] Testing concurrent updates...');
    const updatePromises = testRecords.map((record, index) => 
        storageManager.updateRecord(
            record.id,
            (currentRecords) => {
                const current = currentRecords[record.id];
                return {
                    ...current,
                    title: `Updated ${current.title}`,
                    status: 'viewed',
                    updatedAt: Date.now()
                };
            },
            `test-update-${index}`
        )
    );
    
    const updateResults = await Promise.all(updatePromises);
    console.log('[ConcurrencyTest] Update results:', updateResults);
    
    // 验证所有更新都成功
    const updatedRecords = await getValue<Record<string, VideoRecord>>('viewed', {});
    const allUpdated = Object.values(updatedRecords).every(record => 
        record.title.startsWith('Updated') && record.status === 'viewed'
    );
    
    if (allUpdated) {
        console.log('[ConcurrencyTest] SUCCESS: All concurrent operations completed correctly');
    } else {
        console.error('[ConcurrencyTest] FAILED: Some updates were lost');
        console.log('[ConcurrencyTest] Final records:', updatedRecords);
    }
    
    // 清理测试数据
    await setValue('viewed', {});
}

// 模拟高并发场景
export async function testHighConcurrency(): Promise<void> {
    console.log('[ConcurrencyTest] Starting high concurrency test...');
    
    // 清理测试数据
    await setValue('viewed', {});
    
    const numOperations = 20;
    const operations: Promise<any>[] = [];
    
    // 创建大量并发操作
    for (let i = 0; i < numOperations; i++) {
        const record: VideoRecord = {
            id: `CONCURRENT-${i.toString().padStart(3, '0')}`,
            title: `Concurrent Test ${i}`,
            status: 'browsed',
            timestamp: Date.now(),
            javdbUrl: `https://javdb.com/v/concurrent${i}`,
            tags: [`tag${i}`],
            releaseDate: '2024-01-01',
            javdbImage: `concurrent${i}.jpg`,
            updatedAt: Date.now()
        };
        
        operations.push(storageManager.addRecord(record.id, record, `concurrent-${i}`));
    }
    
    // 等待所有操作完成
    const results = await Promise.all(operations);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`[ConcurrencyTest] High concurrency results: ${successCount}/${numOperations} successful`);
    
    // 验证存储中的记录数量
    const finalRecords = await getValue<Record<string, VideoRecord>>('viewed', {});
    const finalCount = Object.keys(finalRecords).length;
    
    if (finalCount === numOperations) {
        console.log('[ConcurrencyTest] HIGH CONCURRENCY SUCCESS: All records saved correctly');
    } else {
        console.error(`[ConcurrencyTest] HIGH CONCURRENCY FAILED: Expected ${numOperations} records, got ${finalCount}`);
    }
    
    // 清理测试数据
    await setValue('viewed', {});
}

// 在开发环境中暴露测试函数到全局
if (typeof window !== 'undefined') {
    (window as any).testConcurrency = {
        basic: testConcurrentOperations,
        high: testHighConcurrency
    };
}
