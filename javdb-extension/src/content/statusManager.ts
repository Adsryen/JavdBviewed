// src/content/statusManager.ts

import { VIDEO_STATUS } from '../utils/config';
import { STATE, log, currentFaviconState, currentTitleStatus, setCurrentFaviconState, setCurrentTitleStatus } from './state';
import { extractVideoIdFromPage } from './videoId';
import { setFavicon } from './utils';

// 缓存视频ID，避免重复提取
let cachedVideoId: string | null = null;
let lastPathname: string = '';

// --- Status Check and Visual Feedback ---

export function checkAndUpdateVideoStatus(): void {
    // 只在视频详情页执行
    if (!window.location.pathname.startsWith('/v/')) {
        return;
    }

    // 如果路径改变了，清除缓存
    if (window.location.pathname !== lastPathname) {
        cachedVideoId = null;
        lastPathname = window.location.pathname;
    }

    // 使用缓存的视频ID，避免重复提取
    if (!cachedVideoId) {
        cachedVideoId = extractVideoIdFromPage();
        if (!cachedVideoId) {
            return;
        }
    }

    const videoId = cachedVideoId;

    const record = STATE.records[videoId];
    const isRecorded = !!record;

    // 更新favicon（基于状态，且只在需要时）
    updateFaviconForStatus(isRecorded ? record.status : null);

    // 更新页面标题（只在需要时）
    if (isRecorded) {
        updatePageTitleWithStatus(videoId, record.status);
    } else {
        // 如果没有记录，确保标题没有状态标记
        if (currentTitleStatus !== null) {
            const currentTitle = document.title;
            if (currentTitle.includes('[已观看]') || currentTitle.includes('[我想看]') || currentTitle.includes('[已浏览]')) {
                const cleanTitle = currentTitle.replace(/ \[.*?\]$/, '');
                if (cleanTitle !== currentTitle) {
                    log(`Removing status from title: "${currentTitle}" -> "${cleanTitle}"`);
                    document.title = cleanTitle;
                    setCurrentTitleStatus(null);
                }
            }
        }
    }
}

export function updateFaviconForStatus(status: string | null): void {
    // 计算目标状态键：original / viewed / want / browsed
    let targetState: 'original' | 'viewed' | 'want' | 'browsed';
    if (!status) {
        targetState = 'original';
    } else if (status === VIDEO_STATUS.VIEWED) {
        targetState = 'viewed';
    } else if (status === VIDEO_STATUS.WANT) {
        targetState = 'want';
    } else {
        targetState = 'browsed';
    }

    // 如果状态没有改变，跳过设置
    if (currentFaviconState === targetState) {
        return;
    }

    if (targetState === 'original') {
        // 恢复原始favicon
        if (STATE.originalFaviconUrl) {
            log(`Restoring original favicon: ${STATE.originalFaviconUrl}`);
            setFavicon(STATE.originalFaviconUrl);
            setCurrentFaviconState('original');
        } else {
            log('No original favicon URL to restore');
        }
        return;
    }

    // 基于状态选择不同图标
    const iconMap: Record<'viewed' | 'want' | 'browsed', string> = {
        viewed: 'assets/switch-viewed.png', // 绿色 - 已观看
        want: 'assets/switch-want.png',     // 蓝色 - 想看
        browsed: 'assets/switch-browsed.png'// 黄色 - 已浏览
    };

    const url = chrome.runtime.getURL(iconMap[targetState]);
    log(`Setting favicon for status '${targetState}': ${url}`);
    setFavicon(url);
    setCurrentFaviconState(targetState);
}

export function updatePageTitleWithStatus(_videoId: string, status: string): void {
    // 如果状态没有改变，跳过设置
    if (currentTitleStatus === status) {
        return;
    }

    const originalTitle = document.title.replace(/ \[.*?\]$/, ''); // 移除之前的状态标记
    let statusText = '';

    switch (status) {
        case VIDEO_STATUS.VIEWED:
            statusText = '[已观看]';
            break;
        case VIDEO_STATUS.WANT:
            statusText = '[我想看]';
            break;
        case VIDEO_STATUS.BROWSED:
            statusText = '[已浏览]';
            break;
    }

    if (statusText) {
        const newTitle = `${originalTitle} ${statusText}`;
        log(`Updating page title from "${document.title}" to "${newTitle}"`);
        document.title = newTitle;
        setCurrentTitleStatus(status);

        // 确保标题真的被设置了
        setTimeout(() => {
            if (document.title !== newTitle) {
                log(`Title not set correctly, retrying...`);
                document.title = newTitle;
            }
        }, 100);
    }
}
