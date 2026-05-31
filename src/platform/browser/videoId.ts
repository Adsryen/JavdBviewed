// src/platform/browser/videoId.ts

import { extractVideoId as extractSharedVideoId } from '../../shared/utils/videoId';

function logVideoId(...args: any[]): void {
    try {
        const verbose = typeof window !== 'undefined' && (window as any).__JDB_VERBOSE;
        if (verbose !== false) {
            console.log('[JavDB Ext]', ...args);
        }
    } catch {
        console.log('[JavDB Ext]', ...args);
    }
}

// 智能提取视频ID，过滤掉中文、空格等无关内容
export function extractVideoId(rawText: string): string | null {
    const extracted = extractSharedVideoId(rawText);
    logVideoId(extracted
        ? `Extracted video ID: "${extracted}" from raw text: "${rawText}"`
        : `Failed to extract video ID from raw text: "${rawText}"`);
    return extracted;
}

// 缓存提取结果，避免重复日志
let lastExtractedId: string | null = null;
let lastRawText: string = '';
let lastPathname: string = '';

// 从页面中提取视频ID的多种方法
export function extractVideoIdFromPage(): string | null {
    // 如果路径改变了，清除缓存
    if (window.location.pathname !== lastPathname) {
        lastExtractedId = null;
        lastRawText = '';
        lastPathname = window.location.pathname;
    }

    let videoId: string | null = null;

    // 方法1: 从页面标题中获取 (新的页面结构)
    const titleElement = document.querySelector<HTMLElement>('h2.title.is-4 strong:first-child');
    if (titleElement) {
        const rawText = titleElement.textContent?.trim();
        if (rawText) {
            // 如果原始文本没有变化，直接返回缓存结果
            if (rawText === lastRawText && lastExtractedId) {
                return lastExtractedId;
            }

            videoId = extractVideoId(rawText);

            // 只在首次提取或内容变化时输出日志
            if (videoId && rawText !== lastRawText) {
                logVideoId(`Raw title text: "${rawText}" -> Extracted ID: "${videoId}"`);
                lastRawText = rawText;
                lastExtractedId = videoId;
            }
        }
    }

    // 方法2: 从panel-block中获取 (旧的页面结构)
    if (!videoId) {
        const panelBlock = document.querySelector<HTMLElement>('.panel-block.first-block');
        if (panelBlock) {
            const fullIdText = panelBlock.querySelector<HTMLElement>('.title.is-4');
            if (fullIdText) {
                const rawText = fullIdText.textContent?.trim();
                if (rawText && rawText !== lastRawText) {
                    videoId = extractVideoId(rawText);
                    if (videoId) {
                        logVideoId(`Raw panel text: "${rawText}" -> Extracted ID: "${videoId}"`);
                        lastRawText = rawText;
                        lastExtractedId = videoId;
                    }
                }
            }
        }
    }

    // 方法3: 从URL中提取
    if (!videoId) {
        const urlMatch = window.location.pathname.match(/\/v\/([^\/]+)/);
        if (urlMatch) {
            const rawUrlId = urlMatch[1];
            if (rawUrlId !== lastRawText) {
                videoId = extractVideoId(rawUrlId);
                if (videoId) {
                    logVideoId(`Raw URL ID: "${rawUrlId}" -> Extracted ID: "${videoId}"`);
                    lastRawText = rawUrlId;
                    lastExtractedId = videoId;
                }
            }
        }
    }

    return videoId;
}
