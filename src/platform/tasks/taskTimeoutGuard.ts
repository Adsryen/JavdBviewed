export function createTaskTimeoutGuard(timeoutMs?: number): {
    timeoutMs: number;
    isTimedOut: () => boolean;
    throwIfTimedOut: (message?: string) => void;
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
