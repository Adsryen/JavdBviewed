// src/content/itemProcessor.ts

import { VIDEO_STATUS } from '../utils/config';
import { STATE, SELECTORS, log } from './state';
import { isPageProperlyLoaded } from './videoDetail';

export function processVisibleItems(): void {
    // 首先检查页面是否正常加载
    if (!isPageProperlyLoaded()) {
        log('Page not properly loaded (no navbar-item found), skipping list processing to avoid data corruption');
        return;
    }

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

    // 重置所有处理标记，允许重新处理
    items.forEach(item => {
        item.removeAttribute('data-processed');
        item.removeAttribute('data-filter-processed');
    });

    items.forEach(processItem);
}

export function setupObserver(): void {
    const targetNode = document.querySelector('.movie-list');
    if (!targetNode) return;

    STATE.observer = new MutationObserver(mutations => {
        let hasNewVideoItems = false;

        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                // 检查是否有真正的新视频项目节点
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        // 只有当添加的是视频项目或包含视频项目的容器时才处理
                        if (element.matches('.item') || element.querySelector('.item')) {
                            hasNewVideoItems = true;
                            break;
                        }
                    }
                }
            }
        });

        if (hasNewVideoItems) {
            // 使用防抖来避免频繁处理
            if (STATE.debounceTimer) clearTimeout(STATE.debounceTimer);
            STATE.debounceTimer = window.setTimeout(() => {
                log('Observer detected new video items, processing...');
                processVisibleItems();
            }, 300);
        }
    });

    STATE.observer.observe(targetNode, { childList: true, subtree: true });
}

function shouldHide(videoId: string): boolean {
    if (STATE.isSearchPage || !STATE.settings) {
        return false;
    }

    const { hideViewed, hideBrowsed, hideWant } = STATE.settings.display as any;
    const record = STATE.records[videoId];

    if (!record) {
        return false;
    }

    const isViewed = record.status === VIDEO_STATUS.VIEWED;
    const isBrowsed = record.status === VIDEO_STATUS.BROWSED;
    const isWant = record.status === VIDEO_STATUS.WANT;

    if (hideViewed && isViewed) {
        return true;
    }
    if (hideBrowsed && isBrowsed) {
        return true;
    }
    if (hideWant && isWant) {
        return true;
    }

    return false;
}

function getHideReason(videoId: string): string {
    if (STATE.isSearchPage || !STATE.settings) {
        return '';
    }

    const { hideViewed, hideBrowsed, hideWant } = (STATE.settings.display as any);
    const record = STATE.records[videoId];

    if (!record) {
        return '';
    }

    const isViewed = record.status === VIDEO_STATUS.VIEWED;
    const isBrowsed = record.status === VIDEO_STATUS.BROWSED;
    const isWant = record.status === VIDEO_STATUS.WANT;

    if (hideViewed && isViewed) {
        return 'VIEWED';
    }
    if (hideBrowsed && isBrowsed) {
        return 'BROWSED';
    }
    if (hideWant && isWant) {
        return 'WANT';
    }

    return '';
}

function processItem(item: HTMLElement): void {
    // 检查是否已经处理过这个项目
    if (item.hasAttribute('data-processed')) {
        return;
    }

    const videoIdElement = item.querySelector<HTMLElement>(SELECTORS.VIDEO_ID);
    if (!videoIdElement) {
        return;
    }

    const videoId = videoIdElement.textContent?.trim();
    if (!videoId) {
        return;
    }

    // 标记为已处理
    item.setAttribute('data-processed', 'true');

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

    // 兜底：在未注入 data-title 前，从标题文本或 a[title] 中识别 VR 标记
    const titleContainer = item.querySelector('.video-title') as HTMLElement | null;
    const rawTitleText = titleContainer?.textContent?.trim() || '';
    const linkWithTitle = item.querySelector('a[title]') as HTMLAnchorElement | null;
    const linkTitleText = linkWithTitle?.getAttribute('title')?.trim() || '';
    const mergedTitleText = linkTitleText || rawTitleText;
    const isVRInTitleText = /(?:【\s*VR\s*】|\bVR\b)/i.test(mergedTitleText);

    const finalIsVR = isVR || isVRInDataTitle || isVRInTitleText;

    if (!STATE.isSearchPage && STATE.settings?.display.hideVR && finalIsVR) {
        log(`Hiding VR video: ${videoId}`);
        item.style.display = 'none';
        // 添加标记，表示被默认功能隐藏
        item.setAttribute('data-hidden-by-default', 'true');
        item.setAttribute('data-hide-reason', 'VR');
        return;
    }

    if (shouldHide(videoId)) {
        log(`Hiding video based on status: ${videoId}`);
        item.style.display = 'none';
        // 添加标记，表示被默认功能隐藏
        item.setAttribute('data-hidden-by-default', 'true');
        item.setAttribute('data-hide-reason', getHideReason(videoId));
    } else {
        // 确保显示未被隐藏的项目
        item.style.display = '';
        // 移除默认隐藏标记
        item.removeAttribute('data-hidden-by-default');
        item.removeAttribute('data-hide-reason');
    }
}

function addTag(container: HTMLElement, text: string, style: string): void {
    const tag = document.createElement('span');
    tag.className = `tag ${style} is-light custom-status-tag`;
    tag.textContent = text;
    container.appendChild(tag);
}
