// src/content/statusManager.ts

import { VIDEO_STATUS } from '../utils/config';
import { STATE, log, currentFaviconState, currentTitleStatus, setCurrentFaviconState, setCurrentTitleStatus } from './state';
import { extractVideoIdFromPage } from './videoId';
import { setFavicon } from './utils';

// --- Status Check and Visual Feedback ---

export function checkAndUpdateVideoStatus(): void {
    // 只在视频详情页执行
    if (!window.location.pathname.startsWith('/v/')) {
        return;
    }

    const videoId = extractVideoIdFromPage();
    if (!videoId) {
        return;
    }

    const record = STATE.records[videoId];
    const isRecorded = !!record;

    // 更新favicon（只在需要时）
    updateFaviconForStatus(isRecorded);

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

export function updateFaviconForStatus(isRecorded: boolean): void {
    const targetState = isRecorded ? 'extension' : 'original';

    // 如果状态没有改变，跳过设置
    if (currentFaviconState === targetState) {
        return;
    }

    if (isRecorded) {
        // 使用扩展的图标作为已记录状态的favicon
        const extensionIconUrl = chrome.runtime.getURL("assets/jav.png");
        log(`Setting favicon to extension icon: ${extensionIconUrl}`);
        setFavicon(extensionIconUrl);
        setCurrentFaviconState('extension');
    } else {
        // 恢复原始favicon
        if (STATE.originalFaviconUrl) {
            log(`Restoring original favicon: ${STATE.originalFaviconUrl}`);
            setFavicon(STATE.originalFaviconUrl);
            setCurrentFaviconState('original');
        } else {
            log('No original favicon URL to restore');
        }
    }
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
