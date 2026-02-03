// src/content/state.ts

import type { ExtensionSettings, VideoRecord } from '../types';

export interface ContentState {
    settings: ExtensionSettings | null;
    records: Record<string, VideoRecord>;
    isSearchPage: boolean;
    observer: MutationObserver | null;
    debounceTimer: number | null;
    originalFaviconUrl: string;
    // 并发控制
    processingVideos: Set<string>; // 正在处理的视频ID
    lastProcessedVideo: string | null; // 最后处理的视频ID
}

export const STATE: ContentState = {
    settings: null,
    records: {},
    isSearchPage: false,
    observer: null,
    debounceTimer: null,
    originalFaviconUrl: '',
    // 并发控制
    processingVideos: new Set<string>(),
    lastProcessedVideo: null,
};

export const SELECTORS = {
    MOVIE_LIST_ITEM: '.movie-list .item',
    VIDEO_TITLE: 'div.video-title > strong',
    VIDEO_ID: 'div.video-title > strong', // 修正为与油猴脚本一致的选择器
    TAGS_CONTAINER: '.tags.has-addons',
    FAVICON: "link[rel~='icon']",
    VIDEO_DETAIL_ID: '.panel-block.first-block',
    VIDEO_DETAIL_RELEASE_DATE: '.panel-block .value', // 通用选择器，需要在代码中进一步筛选包含日期的元素
    VIDEO_DETAIL_TAGS: '.panel-block.genre .value a', // 主选择器，匹配: <div class="panel-block genre"><span class="value"><a>标签</a></span></div>
    VIDEO_DETAIL_COVER_IMAGE: '.column-video-cover img.video-cover, .column-video-cover a[data-fancybox="gallery"]',
    SEARCH_RESULT_PAGE: '.container .column.is-9',
    EXPORT_TOOLBAR: '.toolbar, .breadcrumb ul',
};

// 弹幕提示相关配置
export const TOAST_CONFIG = {
    FADE_DURATION: 500,
    DISPLAY_DURATION: 3000,
    MAX_MESSAGES: 3,
    Z_INDEX: 10000
};

// 跟踪当前状态，避免重复设置
export let currentFaviconState: 'original' | 'viewed' | 'want' | 'browsed' | null = null;
export let currentTitleStatus: string | null = null;

export function setCurrentFaviconState(state: 'original' | 'viewed' | 'want' | 'browsed' | null): void {
    currentFaviconState = state;
}

export function setCurrentTitleStatus(status: string | null): void {
    currentTitleStatus = status;
}

// 全局可控日志：通过 window.__JDB_VERBOSE 控制是否输出信息性日志
export const log = (...args: any[]) => {
    try {
        const verbose = (typeof window !== 'undefined' && (window as any).__JDB_VERBOSE);
        if (verbose !== false) {
            console.log('[JavDB Ext]', ...args);
        }
    } catch {
        console.log('[JavDB Ext]', ...args);
    }
};
