// A new async logger that wraps sendMessage in a Promise
export function logAsync(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any): Promise<void> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            type: 'log-message',
            payload: { level, message, data }
        }, (response) => {
            // 静默处理错误，避免在 background script 未准备好时产生大量警告
            if (chrome.runtime.lastError) {
                // 不输出错误，直接 resolve
            }
            resolve();
        });
    });
} 