// src/content/itemProcessor.ts

import { VIDEO_STATUS } from '../utils/config';
import { STATE, SELECTORS, log } from './state';

export function processVisibleItems(): void {
    const items = document.querySelectorAll<HTMLElement>(SELECTORS.MOVIE_LIST_ITEM);

    // 只在没有找到项目时输出调试信息
    if (items.length === 0) {
        log(`Found ${items.length} items with selector: ${SELECTORS.MOVIE_LIST_ITEM}`);
        log('No items found, checking page structure...');
        const movieList = document.querySelector('.movie-list');
        if (movieList) {
            log('Found .movie-list container, children:', movieList.children.length);
        } else {
            log('No .movie-list container found');
        }
    }

    items.forEach(processItem);
}

export function setupObserver(): void {
    const targetNode = document.querySelector('.movie-list');
    if (!targetNode) return;

    STATE.observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                if (STATE.debounceTimer) clearTimeout(STATE.debounceTimer);
                STATE.debounceTimer = window.setTimeout(processVisibleItems, 300);
            }
        });
    });

    STATE.observer.observe(targetNode, { childList: true, subtree: true });
}

function shouldHide(videoId: string): boolean {
    if (STATE.isSearchPage || !STATE.settings) {
        return false;
    }

    const { hideViewed, hideBrowsed } = STATE.settings.display;
    const record = STATE.records[videoId];

    if (!record) {
        return false;
    }

    const isViewed = record.status === VIDEO_STATUS.VIEWED;
    const isBrowsed = record.status === VIDEO_STATUS.BROWSED;

    if (hideViewed && isViewed) {
        log(`Hiding viewed video: ${videoId}`);
        return true;
    }
    if (hideBrowsed && isBrowsed) {
        log(`Hiding browsed video: ${videoId}`);
        return true;
    }

    return false;
}

function processItem(item: HTMLElement): void {
    const videoIdElement = item.querySelector<HTMLElement>(SELECTORS.VIDEO_ID);
    if (!videoIdElement) {
        log(`No video ID found with selector: ${SELECTORS.VIDEO_ID} in item`);
        return;
    }

    const videoId = videoIdElement.textContent?.trim();
    if (!videoId) {
        log('Video ID element found but no text content');
        return;
    }

    // 减少日志输出，只在需要时记录
    // log(`Processing item: ${videoId}`);

    item.querySelectorAll('.custom-status-tag').forEach(tag => tag.remove());

    const tagContainer = item.querySelector<HTMLElement>(SELECTORS.TAGS_CONTAINER);
    if (!tagContainer) return;

    const record = STATE.records[videoId];

    if (record) {
        log(`Found record for ${videoId}: status=${record.status}`);
        switch (record.status) {
            case VIDEO_STATUS.VIEWED:
                addTag(tagContainer, '已观看', 'is-success');
                break;
            case VIDEO_STATUS.WANT:
                addTag(tagContainer, '我想看', 'is-info');
                break;
            case VIDEO_STATUS.BROWSED:
                addTag(tagContainer, '已浏览', 'is-warning');
                break;
        }
    }

    // 检查VR标签 - 改进检测逻辑，参考油猴脚本
    const vrTag = item.querySelector('.tag.is-link');
    const isVR = vrTag?.textContent?.trim() === 'VR';

    // 也检查data-title属性中是否包含VR标识（参考油猴脚本）
    const dataTitleElement = item.querySelector('div.video-title > span.x-btn');
    const dataTitle = dataTitleElement?.getAttribute('data-title') || '';
    const isVRInDataTitle = dataTitle.includes('【VR】');

    const finalIsVR = isVR || isVRInDataTitle;

    if (STATE.settings?.display.hideVR && finalIsVR) {
        log(`Hiding VR video: ${videoId}`);
        item.style.display = 'none';
        return;
    }

    if (shouldHide(videoId)) {
        log(`Hiding video based on status: ${videoId}`);
        item.style.display = 'none';
    } else {
        // 确保显示未被隐藏的项目
        item.style.display = '';
    }
}

function addTag(container: HTMLElement, text: string, style: string): void {
    const tag = document.createElement('span');
    tag.className = `tag ${style} is-light custom-status-tag`;
    tag.textContent = text;
    container.appendChild(tag);
}
