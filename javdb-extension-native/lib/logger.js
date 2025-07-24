import { getValue, setValue } from '../storage.js';

const LOG_KEY = 'extension_logs';
const MAX_LOGS = 500; // 限制日志数量，防止无限增长

export const LogLevel = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
};

async function getLogs() {
    return await getValue(LOG_KEY, []);
}

async function saveLogs(logs) {
    await setValue(LOG_KEY, logs);
}

/**
 * 记录一条新日志
 * @param {string} level - 日志级别 (LogLevel)
 * @param {string} message - 日志消息
 * @param {any} [data] - 附加数据
 */
export async function log(level, message, data = null) {
    try {
        let logs = await getLogs();

        // Defensive check to ensure logs is an array
        if (!Array.isArray(logs)) {
            console.warn('Log data in storage was corrupted and has been reset.', { originalData: logs });
            logs = [];
        }

        const newLog = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: data ? JSON.parse(JSON.stringify(data)) : null, // 序列化data以避免存储问题
        };

        logs.push(newLog);

        // 如果日志超过最大数量，则移除最旧的日志
        while (logs.length > MAX_LOGS) {
            logs.shift();
        }

        return saveLogs(logs);
    } catch (error) {
        console.error("Failed to write to custom logger:", error);
        return Promise.resolve(); // Ensure it always returns a promise
    }
}

// 方便调用的辅助函数
export const logger = {
    info: (message, data) => log(LogLevel.INFO, message, data),
    warn: (message, data) => log(LogLevel.WARN, message, data),
    error: (message, data) => log(LogLevel.ERROR, message, data),
    debug: (message, data) => log(LogLevel.DEBUG, message, data),
}; 