// src/content/utils.ts

import { log } from './state';

// --- Utils ---

export function setFavicon(url: string): void {
    // 移除所有现有的favicon链接
    document.querySelectorAll('link[rel*="icon"]').forEach(link => link.remove());

    // 创建新的favicon链接
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = url.endsWith('.png') ? 'image/png' : 'image/x-icon';
    link.href = url + '?t=' + Date.now(); // 添加时间戳防止缓存

    // 添加到head
    document.head.appendChild(link);

    // 强制刷新favicon（Chrome特定的hack）
    const oldLink = document.createElement('link');
    oldLink.rel = 'icon';
    oldLink.href = 'data:image/x-icon;base64,';
    document.head.appendChild(oldLink);

    setTimeout(() => {
        oldLink.remove();
    }, 100);

    log(`Favicon set to: ${url}`);
}

export function getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    
    return (...args: Parameters<T>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => func(...args), wait);
    };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 安全的异步操作包装器
export async function safeAsync<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
): Promise<T | null> {
    try {
        return await operation();
    } catch (error) {
        log(`${errorMessage}:`, error);
        return null;
    }
}

// 重试机制
export async function retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            log(`Attempt ${attempt} failed:`, error);
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }
    
    throw lastError;
}

// 等待元素出现的工具函数
export async function waitForElement(
    selector: string, 
    timeoutMs: number = 3000, 
    intervalMs: number = 200
): Promise<Element | null> {
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
        
        // 等待指定的间隔时间
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    log(`waitForElement timeout: ${selector} not found after ${timeoutMs}ms`);
    return null;
}
