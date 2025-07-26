// src/content/videoId.ts

import { log } from './state';

// 智能提取视频ID，过滤掉中文、空格等无关内容
export function extractVideoId(rawText: string): string | null {
    if (!rawText) return null;

    // 移除所有空格
    const trimmed = rawText.trim();

    // 常见的视频ID格式正则表达式
    const patterns = [
        // 标准格式: ABC-123, ABCD-123, etc.
        /^([A-Z]{2,6}-\d{2,6})/i,
        // 数字格式: 123456_01, 072625_01, etc.
        /^(\d{4,8}_\d{1,3})/,
        // 其他格式: FC2-PPV-123456, etc.
        /^(FC2-PPV-\d+)/i,
        // 纯数字格式: 123456789
        /^(\d{6,12})/,
        // 带字母的数字格式: 1pondo-123456_01
        /^([a-z0-9]+-\d+_\d+)/i,
    ];

    // 尝试每个模式
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
            const extracted = match[1].toUpperCase();
            log(`Extracted video ID: "${extracted}" from raw text: "${rawText}"`);
            return extracted;
        }
    }

    // 如果没有匹配到模式，尝试提取第一个单词（去掉中文字符）
    const firstWord = trimmed.split(/\s+/)[0];
    if (firstWord) {
        // 移除所有非ASCII字符（中文、日文等）
        const cleanId = firstWord.replace(/[^\x00-\x7F]/g, '').toUpperCase();
        if (cleanId.length >= 3) { // 至少3个字符才认为是有效ID
            log(`Fallback extracted video ID: "${cleanId}" from raw text: "${rawText}"`);
            return cleanId;
        }
    }

    log(`Failed to extract video ID from raw text: "${rawText}"`);
    return null;
}

// 从页面中提取视频ID的多种方法
export function extractVideoIdFromPage(): string | null {
    let videoId: string | null = null;

    // 方法1: 从页面标题中获取 (新的页面结构)
    const titleElement = document.querySelector<HTMLElement>('h2.title.is-4 strong:first-child');
    if (titleElement) {
        const rawText = titleElement.textContent?.trim();
        if (rawText) {
            videoId = extractVideoId(rawText);
            log(`Raw title text: "${rawText}" -> Extracted ID: "${videoId}"`);
        }
    }

    // 方法2: 从panel-block中获取 (旧的页面结构)
    if (!videoId) {
        const panelBlock = document.querySelector<HTMLElement>('.panel-block.first-block');
        if (panelBlock) {
            const fullIdText = panelBlock.querySelector<HTMLElement>('.title.is-4');
            if (fullIdText) {
                const rawText = fullIdText.textContent?.trim();
                if (rawText) {
                    videoId = extractVideoId(rawText);
                    log(`Raw panel text: "${rawText}" -> Extracted ID: "${videoId}"`);
                }
            }
        }
    }

    // 方法3: 从URL中提取
    if (!videoId) {
        const urlMatch = window.location.pathname.match(/\/v\/([^\/]+)/);
        if (urlMatch) {
            const rawUrlId = urlMatch[1];
            videoId = extractVideoId(rawUrlId);
            log(`Raw URL ID: "${rawUrlId}" -> Extracted ID: "${videoId}"`);
        }
    }

    return videoId;
}
