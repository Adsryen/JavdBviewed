/**
 * @file taskTimeoutGuard.ts
 * @description 任务超时守卫 —— 创建超时检测器，用于在长时间运行的任务中检查是否超时
 * @module platform/tasks
 */

/** 创建超时守卫实例，返回超时检测方法 */
export function createTaskTimeoutGuard(timeoutMs?: number): {
    timeoutMs: number;
    isTimedOut: () => boolean;                          // 是否已超时
    throwIfTimedOut: (message?: string) => void;        // 超时则抛出异常
} {
    const normalized = typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0
        ? Math.floor(timeoutMs)
        : 0;
    const deadline = normalized > 0 ? Date.now() + normalized : 0;

    return {
        timeoutMs: normalized,
        isTimedOut: () => normalized > 0 && Date.now() >= deadline,
        throwIfTimedOut: (message?: string) => {
            if (normalized > 0 && Date.now() >= deadline) {
                throw new Error(message || `Task timeout after ${normalized}ms`);
            }
        },
    };
}

export function isTaskTimeoutError(error: unknown): boolean {
    return error instanceof Error && /^Task timeout after \d+ms$/.test(error.message);
}
