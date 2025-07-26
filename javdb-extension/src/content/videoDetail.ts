// src/content/videoDetail.ts

import { setValue } from '../utils/storage';
import { VIDEO_STATUS } from '../utils/config';
import { safeUpdateStatus } from '../utils/statusPriority';
import type { VideoRecord } from '../types';
import { STATE, SELECTORS, log } from './state';
import { extractVideoIdFromPage } from './videoId';
import { concurrencyManager } from './concurrency';
import { showToast } from './toast';
import { setFavicon, getRandomDelay } from './utils';

// --- Page-Specific Logic ---

export async function handleVideoDetailPage(): Promise<void> {
    log('Analyzing video detail page...');

    const videoId = extractVideoIdFromPage();
    if (!videoId) {
        log('Could not find video ID using any method. Aborting.');
        return;
    }

    // 并发控制：检查是否已经在处理这个视频
    const operationId = await concurrencyManager.startProcessingVideo(videoId);
    if (!operationId) {
        return; // 已经在处理中，直接返回
    }

    log(`Found video ID: ${videoId}`);
    log(`Starting operation ${operationId} for video ${videoId}`);

    try {
        const record = STATE.records[videoId];
        const now = Date.now();
        const currentUrl = window.location.href;

        if (record) {
            await handleExistingRecord(videoId, record, now, currentUrl, operationId);
        } else {
            await handleNewRecord(videoId, now, currentUrl, operationId);
        }
    } catch (error) {
        log(`Error processing video ${videoId} (operation ${operationId}):`, error);
        showToast(`处理失败: ${videoId}`, 'error');
    } finally {
        concurrencyManager.finishProcessingVideo(videoId, operationId);
    }
}

async function handleExistingRecord(
    videoId: string, 
    record: VideoRecord, 
    now: number, 
    currentUrl: string, 
    operationId: string
): Promise<void> {
    log(`Record for ${videoId} already exists. Status: ${record.status}.`);
    record.updatedAt = now;
    if (!record.javdbUrl) {
        record.javdbUrl = currentUrl;
        log(`Added missing javdbUrl for ${videoId}.`);
    }

    // 尝试将状态升级为'browsed'，但只有在优先级允许的情况下
    const oldStatus = record.status;
    const newStatus = safeUpdateStatus(record.status, VIDEO_STATUS.BROWSED);
    let statusChanged = false;

    if (newStatus !== oldStatus) {
        record.status = newStatus;
        statusChanged = true;
        log(`Updated status for ${videoId} from '${oldStatus}' to '${newStatus}' (priority upgrade).`);
    } else {
        log(`Status for ${videoId} remains '${record.status}' (no upgrade needed or not allowed).`);
    }

    // 尝试保存到存储
    try {
        await setValue('viewed', STATE.records);
        log(`Successfully saved updated record for ${videoId} (operation ${operationId})`);

        // 只有在成功保存后才显示弹幕和更新图标
        if (statusChanged) {
            showToast(`状态已更新: ${videoId}`, 'success');
        } else {
            showToast(`无需更新: ${videoId}`, 'info');
        }
        setFavicon(chrome.runtime.getURL("assets/jav.png"));

    } catch (saveError) {
        log(`Failed to save updated record for ${videoId} (operation ${operationId}):`, saveError);
        // 回滚状态变更
        if (statusChanged) {
            record.status = oldStatus;
        }
        showToast(`保存失败: ${videoId}`, 'error');
    }
}

async function handleNewRecord(
    videoId: string, 
    now: number, 
    currentUrl: string, 
    operationId: string
): Promise<void> {
    log(`No record found for ${videoId}. Scheduling to add as 'browsed'.`);
    
    setTimeout(async () => {
        // 重新检查并发控制
        const delayedOperationId = await concurrencyManager.startProcessingVideo(`${videoId}-delayed`, 'delayed');
        if (!delayedOperationId) {
            return;
        }

        try {
            // Re-check in case it was added in the meantime
            if (STATE.records[videoId]) {
                log(`${videoId} was added while waiting for timeout. Aborting duplicate add.`);
                return;
            }

            const newRecord = await createVideoRecord(videoId, now, currentUrl);
            if (!newRecord) {
                log(`Failed to create record for ${videoId}`);
                return;
            }

            // 尝试保存新记录
            try {
                STATE.records[videoId] = newRecord;
                await setValue('viewed', STATE.records);
                log(`Successfully added new record for ${videoId} (operation ${operationId})`, newRecord);

                // 只有在成功保存后才显示弹幕和更新图标
                showToast(`成功记录番号: ${videoId}`, 'success');
                setFavicon(chrome.runtime.getURL("assets/jav.png"));

            } catch (saveError) {
                log(`Failed to save new record for ${videoId} (operation ${operationId}):`, saveError);
                // 回滚记录添加
                delete STATE.records[videoId];
                showToast(`保存失败: ${videoId}`, 'error');
            }
        } finally {
            concurrencyManager.finishProcessingVideo(`${videoId}-delayed`, delayedOperationId);
        }
    }, getRandomDelay(2000, 4000));
}

async function createVideoRecord(videoId: string, now: number, currentUrl: string): Promise<VideoRecord | null> {
    try {
        const title = document.title.replace(/ \| JavDB.*/, '').trim();
        const releaseDateElement = document.querySelector<HTMLElement>(SELECTORS.VIDEO_DETAIL_RELEASE_DATE);

        // 调试标签获取
        log(`Looking for tags with selector: ${SELECTORS.VIDEO_DETAIL_TAGS}`);
        const tagElements = document.querySelectorAll<HTMLAnchorElement>(SELECTORS.VIDEO_DETAIL_TAGS);
        log(`Found ${tagElements.length} tag elements`);

        const tags = Array.from(tagElements)
            .map(tag => {
                const text = tag.innerText.trim();
                log(`Tag element text: "${text}"`);
                return text;
            })
            .filter(Boolean);

        log(`Final tags array: [${tags.join(', ')}]`);

        // 如果没有找到标签，尝试备用选择器
        if (tags.length === 0) {
            log('No tags found with primary selector, trying alternative selectors...');

            const altSelectors = [
                '.panel-block.genre span.value a',
                'div.panel-block.genre .value a',
                '.genre .value a',
                '.panel-block:contains("類別") .value a',
                '.panel-block:contains("类别") .value a'
            ];

            for (const selector of altSelectors) {
                try {
                    const altTagElements = document.querySelectorAll<HTMLAnchorElement>(selector);
                    if (altTagElements.length > 0) {
                        log(`Found ${altTagElements.length} tags with alternative selector: ${selector}`);
                        const altTags = Array.from(altTagElements)
                            .map(tag => tag.innerText.trim())
                            .filter(Boolean);
                        if (altTags.length > 0) {
                            tags.push(...altTags);
                            log(`Alternative tags: [${altTags.join(', ')}]`);
                            break;
                        }
                    }
                } catch (error) {
                    log(`Error with alternative selector ${selector}:`, error);
                }
            }
        }

        // 获取封面图片链接
        let javdbImage: string | undefined;
        const coverImageElement = document.querySelector<HTMLImageElement>('.column-video-cover img.video-cover');
        if (coverImageElement && coverImageElement.src) {
            javdbImage = coverImageElement.src;
            log(`Found cover image: ${javdbImage}`);
        } else {
            // 尝试从 fancybox 链接获取
            const fancyboxElement = document.querySelector<HTMLAnchorElement>('.column-video-cover a[data-fancybox="gallery"]');
            if (fancyboxElement && fancyboxElement.href) {
                javdbImage = fancyboxElement.href;
                log(`Found cover image from fancybox: ${javdbImage}`);
            }
        }

        return {
            id: videoId,
            title: title,
            status: VIDEO_STATUS.BROWSED,
            createdAt: now,
            updatedAt: now,
            tags: tags,
            releaseDate: releaseDateElement?.textContent?.trim() || undefined,
            javdbUrl: currentUrl,
            javdbImage: javdbImage,
        };
    } catch (error) {
        log(`Error creating video record for ${videoId}:`, error);
        return null;
    }
}
