import { VideoRecord, VideoStatus } from '../types';
import { showMessage } from './ui/toast';

export interface BatchRefreshProgress {
    current: number;
    total: number;
    currentItem: string;
    completed: string[];
    failed: string[];
    isRunning: boolean;
    startTime: number;
}

export interface BatchRefreshOptions {
    interval: number; // 毫秒
    filterStatus?: VideoStatus | 'all';
    onProgress?: (progress: BatchRefreshProgress) => void;
    onComplete?: (progress: BatchRefreshProgress) => void;
    onError?: (error: string, itemId: string) => void;
}

export class BatchRefreshManager {
    private isRunning = false;
    private currentProgress: BatchRefreshProgress | null = null;
    private abortController: AbortController | null = null;
    private timeoutId: number | null = null;

    constructor() {}

    /**
     * 开始批量刷新
     */
    async startBatchRefresh(
        records: VideoRecord[],
        options: BatchRefreshOptions
    ): Promise<void> {
        if (this.isRunning) {
            throw new Error('批量刷新已在进行中');
        }

        // 根据筛选状态过滤记录
        const filteredRecords = this.filterRecords(records, options.filterStatus);
        
        if (filteredRecords.length === 0) {
            showMessage('没有符合条件的记录需要刷新', 'warn');
            return;
        }

        this.isRunning = true;
        this.abortController = new AbortController();
        
        this.currentProgress = {
            current: 0,
            total: filteredRecords.length,
            currentItem: '',
            completed: [],
            failed: [],
            isRunning: true,
            startTime: Date.now()
        };

        try {
            await this.processRecords(filteredRecords, options);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('批量刷新过程中发生错误:', error);
                showMessage(`批量刷新失败: ${error.message}`, 'error');
            }
        } finally {
            this.isRunning = false;
            if (this.currentProgress) {
                this.currentProgress.isRunning = false;
                options.onComplete?.(this.currentProgress);
            }
            this.cleanup();
        }
    }

    /**
     * 停止批量刷新
     */
    stopBatchRefresh(): void {
        if (!this.isRunning) {
            return;
        }

        this.abortController?.abort();
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        showMessage('批量刷新已停止', 'info');
    }

    /**
     * 获取当前进度
     */
    getCurrentProgress(): BatchRefreshProgress | null {
        return this.currentProgress;
    }

    /**
     * 是否正在运行
     */
    getIsRunning(): boolean {
        return this.isRunning;
    }

    /**
     * 根据状态筛选记录
     */
    private filterRecords(records: VideoRecord[], filterStatus?: VideoStatus | 'all'): VideoRecord[] {
        if (!filterStatus || filterStatus === 'all') {
            return records;
        }
        return records.filter(record => record.status === filterStatus);
    }

    /**
     * 处理记录列表
     */
    private async processRecords(
        records: VideoRecord[],
        options: BatchRefreshOptions
    ): Promise<void> {
        for (let i = 0; i < records.length; i++) {
            // 检查是否被中止
            if (this.abortController?.signal.aborted) {
                throw new Error('批量刷新被用户停止');
            }

            const record = records[i];
            
            if (this.currentProgress) {
                this.currentProgress.current = i + 1;
                this.currentProgress.currentItem = record.id;
                options.onProgress?.(this.currentProgress);
            }

            try {
                await this.refreshSingleRecord(record.id);
                this.currentProgress?.completed.push(record.id);
            } catch (error: any) {
                console.error(`刷新记录 ${record.id} 失败:`, error);
                this.currentProgress?.failed.push(record.id);
                options.onError?.(error.message, record.id);
            }

            // 如果不是最后一个记录，等待指定间隔
            if (i < records.length - 1) {
                await this.delay(options.interval);
            }
        }
    }

    /**
     * 刷新单个记录
     */
    private async refreshSingleRecord(videoId: string): Promise<VideoRecord> {
        // 检查后台脚本连接
        const pingResponse = await chrome.runtime.sendMessage({ type: 'ping' });
        if (!pingResponse?.success) {
            throw new Error('后台脚本无响应');
        }

        // 发送刷新请求
        const response = await chrome.runtime.sendMessage({
            type: 'refresh-record',
            videoId: videoId
        });

        if (!response?.success) {
            throw new Error(response?.error || '刷新请求失败');
        }

        return response.record;
    }

    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.abortController?.signal.aborted) {
                reject(new Error('操作被中止'));
                return;
            }

            this.timeoutId = window.setTimeout(() => {
                this.timeoutId = null;
                if (this.abortController?.signal.aborted) {
                    reject(new Error('操作被中止'));
                } else {
                    resolve();
                }
            }, ms);
        });
    }

    /**
     * 清理资源
     */
    private cleanup(): void {
        this.abortController = null;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    /**
     * 格式化剩余时间
     */
    static formatRemainingTime(progress: BatchRefreshProgress, intervalMs: number): string {
        if (progress.current === 0) {
            return '-';
        }

        const elapsed = Date.now() - progress.startTime;
        const avgTimePerItem = elapsed / progress.current;
        const remaining = (progress.total - progress.current) * avgTimePerItem;
        
        const seconds = Math.ceil(remaining / 1000);
        if (seconds < 60) {
            return `${seconds}秒`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}分${remainingSeconds}秒`;
        }
    }
}
