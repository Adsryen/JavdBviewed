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
    log(`Record for ${videoId} already exists. Status: ${record.status}. Updating all data...`);

    // 获取当前页面的最新数据
    const latestData = await extractVideoData(videoId);
    if (!latestData) {
        log(`Failed to extract latest data for ${videoId}`);
        return;
    }

    // 保存原始状态用于回滚
    const oldStatus = record.status;
    const oldRecord = { ...record };

    // 始终更新数据字段（除了状态和时间戳）
    if (latestData.title) record.title = latestData.title;
    if (latestData.tags) record.tags = latestData.tags;
    if (latestData.releaseDate !== undefined) record.releaseDate = latestData.releaseDate;
    record.javdbUrl = currentUrl; // 始终更新URL
    if (latestData.javdbImage !== undefined) record.javdbImage = latestData.javdbImage;
    record.updatedAt = now;

    // 检查哪些字段发生了变化
    const changes: string[] = [];
    if (oldRecord.title !== record.title) changes.push('标题');
    if (JSON.stringify(oldRecord.tags) !== JSON.stringify(record.tags)) changes.push('标签');
    if (oldRecord.releaseDate !== record.releaseDate) changes.push('发布日期');
    if (oldRecord.javdbUrl !== record.javdbUrl) changes.push('URL');
    if (oldRecord.javdbImage !== record.javdbImage) changes.push('封面图片');

    log(`Updated fields for ${videoId}: [${changes.join(', ')}]`);

    // 尝试将状态升级为'browsed'，但只有在优先级允许的情况下
    const newStatus = safeUpdateStatus(record.status, VIDEO_STATUS.BROWSED);
    let statusChanged = false;

    if (newStatus !== oldStatus) {
        record.status = newStatus;
        statusChanged = true;
        changes.push('状态');
        log(`Updated status for ${videoId} from '${oldStatus}' to '${newStatus}' (priority upgrade).`);
    } else {
        log(`Status for ${videoId} remains '${record.status}' (no upgrade needed or not allowed).`);
    }

    // 尝试保存到存储
    try {
        await setValue('viewed', STATE.records);
        log(`Successfully saved updated record for ${videoId} (operation ${operationId})`);

        // 显示更新信息
        if (changes.length > 0) {
            if (statusChanged) {
                showToast(`已更新 ${videoId}: ${changes.join(', ')}`, 'success');
            } else {
                showToast(`已刷新 ${videoId}: ${changes.join(', ')}`, 'info');
            }
        } else {
            showToast(`数据无变化: ${videoId}`, 'info');
        }
        setFavicon(chrome.runtime.getURL("assets/jav.png"));

    } catch (saveError) {
        log(`Failed to save updated record for ${videoId} (operation ${operationId}):`, saveError);
        // 回滚所有变更
        Object.assign(record, oldRecord);
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

// 提取视频数据的通用函数
async function extractVideoData(videoId: string): Promise<Partial<VideoRecord> | null> {
    try {
        const title = document.title.replace(/ \| JavDB.*/, '').trim();

        // 获取发布日期 - 改进的逻辑
        let releaseDate: string | undefined;

        // 方法1: 查找包含"日期"的panel-block
        const panelBlocks = Array.from(document.querySelectorAll<HTMLElement>('.panel-block'));
        for (const block of panelBlocks) {
            const strongElement = block.querySelector('strong');
            if (strongElement && strongElement.textContent?.includes('日期')) {
                const valueElement = block.querySelector('.value');
                if (valueElement) {
                    releaseDate = valueElement.textContent?.trim();
                    log(`Found release date in panel-block: "${releaseDate}"`);
                    break;
                }
            }
        }

        // 方法2: 如果没找到，尝试其他兼容的选择器
        if (!releaseDate) {
            // 尝试一些兼容的选择器
            const compatibleSelectors = [
                '.panel-block .value', // 通用的value选择器
                '.panel-block span.value', // 带span的value
                '.panel-block .field-value' // 可能的字段值
            ];

            for (const selector of compatibleSelectors) {
                const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
                for (const element of elements) {
                    const text = element.textContent?.trim();
                    if (text && /^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
                        releaseDate = text;
                        log(`Found release date with compatible selector "${selector}": "${releaseDate}"`);
                        break;
                    }
                }
                if (releaseDate) break;
            }
        }

        // 方法3: 如果还是没找到，搜索日期模式
        if (!releaseDate) {
            log('Still no release date found, searching for date patterns...');
            for (const block of panelBlocks) {
                const text = block.textContent?.trim();
                if (text) {
                    // 匹配 YYYY-MM-DD 格式
                    const dateMatch = text.match(/(\d{4}-\d{1,2}-\d{1,2})/);
                    if (dateMatch) {
                        releaseDate = dateMatch[1];
                        log(`Found date pattern in panel-block: "${releaseDate}"`);
                        break;
                    }
                }
            }
        }

        log(`Final release date: "${releaseDate || 'undefined'}"`);

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
                '.panel-block .value a', // 通用的panel-block value链接
                '.tags a', // 通用的标签链接
                'a[href*="/genres/"]' // 指向类别页面的链接
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
            title,
            tags,
            releaseDate,
            javdbImage,
        };
    } catch (error) {
        log(`Error extracting video data for ${videoId}:`, error);
        return null;
    }
}

async function createVideoRecord(videoId: string, now: number, currentUrl: string): Promise<VideoRecord | null> {
    try {
        const title = document.title.replace(/ \| JavDB.*/, '').trim();

        // 调试发布日期获取 - 使用兼容的方法
        log(`Looking for release date using compatible methods`);
        let releaseDate: string | undefined;

        // 直接使用兼容的方法查找发布日期
        {
            log('No release date found with primary selector, trying alternatives...');

            // 方法1: 查找包含"日期"的panel-block
            const panelBlocks = Array.from(document.querySelectorAll<HTMLElement>('.panel-block'));
            log(`Found ${panelBlocks.length} panel-block elements`);

            for (const block of panelBlocks) {
                const strongElement = block.querySelector('strong');
                if (strongElement) {
                    const strongText = strongElement.textContent?.trim();
                    log(`Panel-block strong text: "${strongText}"`);

                    if (strongText && (strongText.includes('日期') || strongText.includes('Date'))) {
                        const valueElement = block.querySelector('.value');
                        if (valueElement) {
                            releaseDate = valueElement.textContent?.trim();
                            log(`Found release date in panel-block with strong "${strongText}": "${releaseDate}"`);
                            break;
                        }
                    }
                }
            }

            // 方法2: 如果还是没找到，搜索日期模式
            if (!releaseDate) {
                log('Still no release date found, searching for date patterns...');
                for (const block of panelBlocks) {
                    const text = block.textContent?.trim();
                    if (text) {
                        // 匹配 YYYY-MM-DD 格式
                        const dateMatch = text.match(/(\d{4}-\d{1,2}-\d{1,2})/);
                        if (dateMatch) {
                            releaseDate = dateMatch[1];
                            log(`Found date pattern in panel-block: "${releaseDate}"`);
                            break;
                        }
                    }
                }
            }

        }

        log(`Final release date: "${releaseDate || 'undefined'}"`);


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
                '.panel-block .value a', // 通用的panel-block value链接
                '.tags a', // 通用的标签链接
                'a[href*="/genres/"]' // 指向类别页面的链接
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
            releaseDate: releaseDate || undefined,
            javdbUrl: currentUrl,
            javdbImage: javdbImage,
        };
    } catch (error) {
        log(`Error creating video record for ${videoId}:`, error);
        return null;
    }
}
