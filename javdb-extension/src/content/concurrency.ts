// src/content/concurrency.ts

import { STATE, log } from './state';

// 操作队列管理
interface VideoOperation {
    videoId: string;
    operationId: string;
    type: 'process' | 'delayed';
    timestamp: number;
    resolve: () => void;
    reject: (error: any) => void;
}

class ConcurrencyManager {
    private operationQueue: Map<string, VideoOperation> = new Map();
    private activeOperations: Set<string> = new Set();
    private maxConcurrentOperations = 3; // 最大并发操作数

    // 生成唯一的操作ID来跟踪操作
    generateOperationId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    // 检查视频是否正在被处理
    isVideoBeingProcessed(videoId: string): boolean {
        return STATE.processingVideos.has(videoId) || this.operationQueue.has(videoId);
    }

    // 开始处理视频（改进版本）
    async startProcessingVideo(videoId: string, type: 'process' | 'delayed' = 'process'): Promise<string | null> {
        // 检查是否已经在处理
        if (this.isVideoBeingProcessed(videoId)) {
            log(`Video ${videoId} is already being processed or queued, skipping...`);
            return null;
        }

        // 检查并发限制
        if (this.activeOperations.size >= this.maxConcurrentOperations) {
            log(`Max concurrent operations reached, queueing ${videoId}...`);
            return this.queueOperation(videoId, type);
        }

        return this.executeOperation(videoId, type);
    }

    // 队列操作
    private queueOperation(videoId: string, type: 'process' | 'delayed'): Promise<string> {
        return new Promise((resolve, reject) => {
            const operationId = this.generateOperationId();
            const operation: VideoOperation = {
                videoId,
                operationId,
                type,
                timestamp: Date.now(),
                resolve: () => resolve(operationId),
                reject
            };

            this.operationQueue.set(videoId, operation);
            log(`Queued operation ${operationId} for video ${videoId}`);
        });
    }

    // 执行操作
    private executeOperation(videoId: string, type: 'process' | 'delayed'): string {
        const operationId = this.generateOperationId();
        
        STATE.processingVideos.add(videoId);
        this.activeOperations.add(operationId);
        
        log(`Started processing video: ${videoId} (operation: ${operationId}, type: ${type})`);
        return operationId;
    }

    // 完成处理视频
    finishProcessingVideo(videoId: string, operationId?: string): void {
        STATE.processingVideos.delete(videoId);
        STATE.lastProcessedVideo = videoId;
        
        if (operationId) {
            this.activeOperations.delete(operationId);
        }
        
        log(`Finished processing video: ${videoId} (operation: ${operationId})`);

        // 处理队列中的下一个操作
        this.processNextInQueue();
    }

    // 处理队列中的下一个操作
    private processNextInQueue(): void {
        if (this.operationQueue.size === 0 || this.activeOperations.size >= this.maxConcurrentOperations) {
            return;
        }

        // 获取最早的操作
        let earliestOperation: VideoOperation | null = null;
        let earliestKey: string | null = null;

        for (const [key, operation] of this.operationQueue.entries()) {
            if (!earliestOperation || operation.timestamp < earliestOperation.timestamp) {
                earliestOperation = operation;
                earliestKey = key;
            }
        }

        if (earliestOperation && earliestKey) {
            this.operationQueue.delete(earliestKey);
            this.executeOperation(earliestOperation.videoId, earliestOperation.type);
            earliestOperation.resolve();
        }
    }

    // 清理过期的操作（防止内存泄漏）
    cleanupExpiredOperations(): void {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5分钟

        for (const [key, operation] of this.operationQueue.entries()) {
            if (now - operation.timestamp > maxAge) {
                log(`Cleaning up expired operation for video ${operation.videoId}`);
                operation.reject(new Error('Operation expired'));
                this.operationQueue.delete(key);
            }
        }
    }

    // 获取当前状态信息
    getStatus(): { active: number; queued: number; processing: string[] } {
        return {
            active: this.activeOperations.size,
            queued: this.operationQueue.size,
            processing: Array.from(STATE.processingVideos)
        };
    }
}

// 单例实例
export const concurrencyManager = new ConcurrencyManager();

// 定期清理过期操作
setInterval(() => {
    concurrencyManager.cleanupExpiredOperations();
}, 60000); // 每分钟清理一次

// 兼容性函数（保持向后兼容）
export function isVideoBeingProcessed(videoId: string): boolean {
    return concurrencyManager.isVideoBeingProcessed(videoId);
}

export function startProcessingVideo(videoId: string): Promise<string | null> {
    return concurrencyManager.startProcessingVideo(videoId);
}

export function finishProcessingVideo(videoId: string, operationId?: string): void {
    concurrencyManager.finishProcessingVideo(videoId, operationId);
}

export function generateOperationId(): string {
    return concurrencyManager.generateOperationId();
}
