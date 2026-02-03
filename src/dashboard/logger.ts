// A new async logger that wraps sendMessage in a Promise
export function logAsync(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any): Promise<void> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            type: 'log-message',
            payload: { level, message, data }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(`logAsync failed: ${chrome.runtime.lastError.message}`);
                // Resolve anyway to not break the flow
            }
            resolve();
        });
    });
} 