// src/content/videoDetail.ts

// import { setValue } from '../utils/storage'; // 不再直接使用，改用storageManager
import { VIDEO_STATUS } from '../utils/config';
import { safeUpdateStatus } from '../utils/statusPriority';
import type { VideoRecord } from '../types';
import { STATE, SELECTORS, log } from './state';
import { extractVideoIdFromPage } from './videoId';
import { concurrencyManager, storageManager } from './concurrency';
import { showToast } from './toast';
import { getRandomDelay } from './utils';
import { updateFaviconForStatus } from './statusManager';
import { videoDetailEnhancer } from './enhancedVideoDetail';
import { initOrchestrator } from './initOrchestrator';
import { actorManager } from '../services/actorManager';
import { getSettings, saveSettings } from '../utils/storage';

// 识别当前详情页中用户对该影片的账号状态（我看過/我想看）
// 返回 VIDEO_STATUS.VIEWED / VIDEO_STATUS.WANT / null
function detectPageUserStatus(): typeof VIDEO_STATUS[keyof typeof VIDEO_STATUS] | null {
    try {
        // 方案1：通过用户区块的链接快速判断
        const watchedAnchor = document.querySelector<HTMLAnchorElement>(
            '.review-title a[href="/users/watched_videos"], .review-title a[href*="/users/watched_videos"]'
        );
        if (watchedAnchor) {
            // 文本或内部tag文本包含“我看過這部影片”
            const text = watchedAnchor.textContent?.trim() || '';
            const tagText = watchedAnchor.querySelector('span.tag')?.textContent?.trim() || '';
            if (text.includes('我看過這部影片') || tagText.includes('我看過這部影片')) {
                return VIDEO_STATUS.VIEWED;
            }
        }

        const wantAnchor = document.querySelector<HTMLAnchorElement>(
            '.review-title a[href="/users/want_watch_videos"], .review-title a[href*="/users/want_watch_videos"]'
        );
        if (wantAnchor) {
            const text = wantAnchor.textContent?.trim() || '';
            const tagText = wantAnchor.querySelector('span.tag')?.textContent?.trim() || '';
            if (text.includes('我想看這部影片') || tagText.includes('我想看這部影片')) {
                return VIDEO_STATUS.WANT;
            }
        }

        // 方案2：全局搜寻 tag 文本（结构变动时兜底）
        const tagSpans = Array.from(document.querySelectorAll<HTMLSpanElement>('span.tag'));
        if (tagSpans.some(s => (s.textContent || '').includes('我看過這部影片'))) {
            return VIDEO_STATUS.VIEWED;
        }
        if (tagSpans.some(s => (s.textContent || '').includes('我想看這部影片'))) {
            return VIDEO_STATUS.WANT;
        }
    } catch {
        // 忽略识别错误，返回 null
    }
    return null;
}

// --- Page-Specific Logic ---

/**
 * 检查页面是否正常加载（通过navbar-item元素检测）
 * 如果页面被安全拦截或请求频繁，navbar-item元素可能不存在
 * 这是防止在异常页面状态下进行数据回写的安全措施
 */
export function isPageProperlyLoaded(): boolean {
    try {
        // 优先检查JavDB品牌logo - 这是最可靠的页面正常加载标志
        const javdbLogoSelectors = [
            'a.navbar-item[href="https://javdb.com"] svg',  // JavDB logo SVG
            'a.navbar-item[href*="javdb.com"] svg',         // 包含javdb.com的logo
            '.navbar-item svg[viewBox="0 0 326 111"]',      // 特定viewBox的JavDB SVG
        ];

        for (const selector of javdbLogoSelectors) {
            const logoElements = document.querySelectorAll(selector);
            if (logoElements.length > 0) {
                log(`Page properly loaded - found JavDB logo with selector: ${selector}`);
                return true;
            }
        }

        // 备用检查：通用导航栏元素
        const fallbackSelectors = [
            '.navbar-item',           // 标准导航项
            '.navbar .navbar-item',   // 嵌套在navbar中的导航项
            'nav .navbar-item',       // 在nav标签中的导航项
            '.navbar-brand',          // 导航栏品牌区域
            '.navbar-menu',           // 导航栏菜单
        ];

        for (const selector of fallbackSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                log(`Page properly loaded - found ${elements.length} elements with fallback selector: ${selector}`);
                return true;
            }
        }

        // 如果没有找到导航栏元素，可能页面被拦截或加载异常
        log('Page may be blocked or loading failed - no JavDB logo or navbar elements found');
        return false;
    } catch (error) {
        log('Error checking page load status:', error);
        return false;
    }
}

export async function handleVideoDetailPage(): Promise<void> {
    // 首先检查页面是否正常加载
    if (!isPageProperlyLoaded()) {
        log('Page not properly loaded (no navbar-item found), skipping video detail processing to avoid data corruption');
        return;
    }

    // 静默分析视频详情页
    log('Page properly loaded, proceeding with video detail processing');

    const videoId = extractVideoIdFromPage();
    if (!videoId) {
        log('Could not find video ID using any method. Aborting.');
        return;
    }

// 在影片详情页对“演員/演员”区域内的演员链接进行标识：
// - 若为已收藏（存在于本地演员库）则标记为绿色
// - 若为黑名单（blacklisted = true）则标记为红色并添加删除线
async function markActorsOnPage(): Promise<void> {
    try {
        await actorManager.initialize();

        // 查找包含“演員/演员”的信息块
        const blocks = Array.from(document.querySelectorAll<HTMLElement>('.panel-block'));
        const actorBlock = blocks.find(block => {
            const strong = block.querySelector('strong');
            const text = strong?.textContent?.trim() || '';
            return text.includes('演員') || text.includes('演员');
        });

        if (!actorBlock) {
            log('No actor panel-block found on this page.');
            return;
        }

        const linkNodes = actorBlock.querySelectorAll<HTMLAnchorElement>('a[href^="/actors/"]');
        if (!linkNodes || linkNodes.length === 0) {
            log('No actor links found in actor panel-block.');
            return;
        }

        const colorCollected = '#2e7d32'; // 绿色（已收藏）
        const colorBlacklisted = '#d32f2f'; // 红色（黑名单）

        for (const a of Array.from(linkNodes)) {
            try {
                const href = a.getAttribute('href') || '';
                const idPart = href.split('/actors/')[1] || '';
                const actorId = idPart.split('?')[0].split('#')[0];
                if (!actorId) continue;

                const record = await actorManager.getActorById(actorId);
                if (!record) continue; // 未收藏/未同步

                if (record.blacklisted) {
                    a.style.color = colorBlacklisted;
                    a.style.textDecoration = 'line-through';
                    a.title = a.title ? `${a.title}（黑名单）` : '黑名单';
                } else {
                    a.style.color = colorCollected;
                    a.style.textDecoration = 'none';
                    a.title = a.title ? `${a.title}（已收藏）` : '已收藏';
                }
            } catch {
                // 单个失败不阻断
                continue;
            }
        }
    } catch (error) {
        log('markActorsOnPage error:', error);
    }
}

    // 并发控制：检查是否已经在处理这个视频
    const operationId = await concurrencyManager.startProcessingVideo(videoId);
    if (!operationId) {
        return; // 已经在处理中，直接返回
    }

    // 静默开始处理视频

    try {
        const record = STATE.records[videoId];
        const now = Date.now();
        const currentUrl = window.location.href;

        if (record) {
            await handleExistingRecord(videoId, record, now, currentUrl, operationId);
        } else {
            await handleNewRecord(videoId, now, currentUrl);
        }

        // 应用增强功能（新逻辑：以视频页增强开关为主，兼容旧逻辑）
        const enableVideoEnhancement = STATE.settings?.videoEnhancement?.enabled === true;
        const enableMultiSource = STATE.settings?.dataEnhancement?.enableMultiSource;
        const enableTranslation = STATE.settings?.dataEnhancement?.enableTranslation;
        if (enableVideoEnhancement || enableMultiSource || enableTranslation) {
            try {
                log('Scheduling video detail enhancements via orchestrator...');
                // 轻量核心初始化放在 high 阶段（尽快完成定点翻译与数据准备）
                initOrchestrator.add('high', async () => {
                    await videoDetailEnhancer.initCore();
                }, { label: 'videoEnhancement:initCore' });

                // 重型 UI 增强拆分为 deferred 阶段，空闲优先并设置小延迟
                initOrchestrator.add('deferred', async () => {
                    await videoDetailEnhancer.runCover();
                }, { label: 'videoEnhancement:runCover', idle: true, idleTimeout: 5000, delayMs: 800 });

                initOrchestrator.add('deferred', async () => {
                    await videoDetailEnhancer.runTitle();
                }, { label: 'videoEnhancement:runTitle', idle: true, idleTimeout: 5000, delayMs: 1000 });

                initOrchestrator.add('deferred', async () => {
                    await videoDetailEnhancer.runRating();
                }, { label: 'videoEnhancement:runRating', idle: true, idleTimeout: 5000, delayMs: 1200 });

                initOrchestrator.add('deferred', async () => {
                    await videoDetailEnhancer.runActors();
                }, { label: 'videoEnhancement:runActors', idle: true, idleTimeout: 5000, delayMs: 1400 });

                initOrchestrator.add('deferred', async () => {
                    await videoDetailEnhancer.runReviewBreaker();
                }, { label: 'videoEnhancement:runReviewBreaker', idle: true, idleTimeout: 5000, delayMs: 1600 });

                initOrchestrator.add('deferred', async () => {
                    await videoDetailEnhancer.runFC2Breaker();
                }, { label: 'videoEnhancement:runFC2Breaker', idle: true, idleTimeout: 5000, delayMs: 1800 });

                // 在所有增强任务之后隐藏加载指示器
                initOrchestrator.add('deferred', () => {
                    videoDetailEnhancer.finish();
                }, { label: 'videoEnhancement:finish', idle: true, delayMs: 2000 });
            } catch (enhancementError) {
                log('Enhancement scheduling failed, but continuing:', enhancementError);
                // 调度失败不影响主要功能
            }
        }

        // 无论是否启用增强功能，都尝试为“演員”区域的演员添加标识
        try {
            await markActorsOnPage();
        } catch (markErr) {
            log('Marking actors on page failed:', markErr);
        }

        // 绑定“想看”按钮同步与注入增强区块
        try {
            bindWantSyncOnClick(videoId);
        } catch (e) { log('bindWantSyncOnClick error:', e as any); }
        try {
            await injectVideoEnhancementPanel();
        } catch (e) { log('injectVideoEnhancementPanel error:', e as any); }
    } catch (error) {
        log(`Error processing video ${videoId} (operation ${operationId}):`, error);
        showToast(`处理失败: ${videoId}`, 'error');
    } finally {
        concurrencyManager.finishProcessingVideo(videoId, operationId);
    }
}

// 绑定“想看”按钮点击事件：将本地番号库状态升级为 WANT（若无记录则创建）
function bindWantSyncOnClick(videoId: string): void {
    try {
        const enabled = STATE.settings?.videoEnhancement?.enableWantSync !== false;
        if (!enabled) return;

        // 兼容多种DOM：优先 form[data-remote][action*="/reviews/want_to_watch"]，回退到包含文本“想看”的按钮
        const wantForm = document.querySelector<HTMLFormElement>('form.button_to[action*="/reviews/want_to_watch"]');
        const wantButton = wantForm?.querySelector('button') || Array.from(document.querySelectorAll('button')).find(btn => (btn.textContent || '').includes('想看')) || null;
        const target: Element | null = wantForm || wantButton || null;
        if (!target) return;

        const FLAG = '__bound_want_sync__';
        if ((target as any)[FLAG]) return;
        (target as any)[FLAG] = true;

        const handler = (_e: Event) => {
            // 不拦截默认行为，仅在提交后短暂延迟本地写入
            setTimeout(() => {
                upsertWantStatus(videoId).catch(err => log('upsertWantStatus error:', err));
            }, 800);
        };

        if (wantForm) {
            wantForm.addEventListener('submit', handler, { capture: true });
        } else if (wantButton) {
            wantButton.addEventListener('click', handler, { capture: true });
        }
    } catch (e) {
        log('bindWantSyncOnClick failed:', e as any);
    }
}

// 将本地番号库状态升级为 WANT（若无记录则创建）
async function upsertWantStatus(videoId: string): Promise<void> {
    const opId = await concurrencyManager.startProcessingVideo(videoId).catch(() => null);
    if (!opId) {
        // 已有并发在处理，避免冲突直接返回
        return;
    }
    try {
        const now = Date.now();
        const currentUrl = window.location.href;
        const existing = STATE.records[videoId];

        if (existing) {
            // 升级现有记录状态
            const result = await storageManager.updateRecord(
                videoId,
                (current) => {
                    const cur = current[videoId];
                    const updated = { ...cur } as VideoRecord;
                    updated.status = safeUpdateStatus(cur.status, VIDEO_STATUS.WANT as any);
                    updated.updatedAt = now;
                    updated.javdbUrl = currentUrl;
                    return updated;
                },
                opId
            );
            if (result.success) {
                updateFaviconForStatus(VIDEO_STATUS.WANT);
                showToast('已同步为「我想看」', 'success');
            } else {
                showToast(`同步失败: ${result.error || '未知错误'}`, 'error');
            }
        } else {
            // 新建记录并设为 WANT
            let newRecord = await createVideoRecord(videoId, now, currentUrl);
            if (!newRecord) {
                // 兜底：最小记录
                newRecord = {
                    id: videoId,
                    title: document.title.replace(/ \| JavDB.*/, '').trim(),
                    status: VIDEO_STATUS.WANT as any,
                    tags: [],
                    createdAt: now,
                    updatedAt: now,
                    javdbUrl: currentUrl,
                } as VideoRecord;
            } else {
                newRecord.status = VIDEO_STATUS.WANT as any;
                newRecord.updatedAt = now;
            }
            const result = await storageManager.addRecord(videoId, newRecord, opId);
            if (result.success) {
                updateFaviconForStatus(VIDEO_STATUS.WANT);
                showToast('已添加到番号库并标记为「我想看」', 'success');
            } else {
                showToast(`保存失败: ${result.error || '未知错误'}`, 'error');
            }
        }
    } catch (e) {
        log('upsertWantStatus exception:', e as any);
        showToast('同步失败：出现异常', 'error');
    } finally {
        concurrencyManager.finishProcessingVideo(videoId, opId || undefined);
    }
}

// 注入影片页“增强区块”提供两个设置开关
async function injectVideoEnhancementPanel(): Promise<void> {
    try {
        const PANEL_ID = 'jdb-video-enhance-panel';
        if (document.getElementById(PANEL_ID)) return;

        // 优先插到评论按钮区域附近
        const reviewButtons = document.querySelector('.review-buttons');
        const container = (reviewButtons?.parentElement as HTMLElement) || document.querySelector<HTMLElement>('.column') || document.body;
        if (!container) return;

        const settings = await getSettings();
        const ve = settings.videoEnhancement || {} as any;

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = `
          margin-top: 8px;
          padding: 8px 10px;
          background: #f7f7f7;
          border: 1px solid #e6e6e6;
          border-radius: 6px;
          font-size: 13px;
        `;

        const title = document.createElement('div');
        title.textContent = '影片页增强';
        title.style.cssText = 'font-weight: bold; margin-bottom: 6px; color: #333;';

        const line = (labelText: string, checked: boolean, onToggle: (v: boolean) => void) => {
            const wrap = document.createElement('label');
            wrap.style.cssText = 'display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer;';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!checked;
            cb.addEventListener('change', () => onToggle(cb.checked));
            const txt = document.createElement('span');
            txt.textContent = labelText;
            wrap.appendChild(cb);
            wrap.appendChild(txt);
            return wrap;
        };

        const onSave = async (patch: Partial<typeof settings['videoEnhancement']>) => {
            try {
                settings.videoEnhancement = { ...settings.videoEnhancement, ...patch } as any;
                await saveSettings(settings);
                // 同步内存配置
                if (STATE.settings) {
                    STATE.settings.videoEnhancement = { ...settings.videoEnhancement } as any;
                }
                showToast('设置已保存', 'success');
            } catch (e) {
                showToast('保存设置失败', 'error');
            }
        };

        const l1 = line('点击“想看”时同步到番号库', ve.enableWantSync !== false, (v) => onSave({ enableWantSync: v }));
        const l2 = line('115 推送成功后自动标记“已看”', ve.autoMarkWatchedAfter115 !== false, (v) => onSave({ autoMarkWatchedAfter115: v }));

        panel.appendChild(title);
        panel.appendChild(l1);
        panel.appendChild(l2);

        // 插入在 review-buttons 下方
        if (reviewButtons && reviewButtons.parentElement) {
            reviewButtons.parentElement.insertBefore(panel, reviewButtons.nextSibling);
        } else if (container) {
            container.appendChild(panel);
        }
    } catch (e) {
        log('injectVideoEnhancementPanel failed:', e as any);
    }
}

async function handleExistingRecord(
    videoId: string,
    record: VideoRecord,
    now: number,
    currentUrl: string,
    operationId: string
): Promise<void> {
    // 静默更新现有记录

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

    // 尝试将状态升级为页面识别到的状态（viewed/want），否则退回到 browsed
    const pageDetectedStatus = detectPageUserStatus();
    const desiredStatus = pageDetectedStatus ?? VIDEO_STATUS.BROWSED;
    const newStatus = safeUpdateStatus(record.status, desiredStatus);
    let statusChanged = false;

    if (newStatus !== oldStatus) {
        record.status = newStatus;
        statusChanged = true;
        changes.push('状态');
        log(`Updated status for ${videoId} from '${oldStatus}' to '${newStatus}' (priority upgrade).`);
    } else {
        log(`Status for ${videoId} remains '${record.status}' (no upgrade needed or not allowed).`);
    }

    // 使用存储管理器进行原子性更新
    const result = await storageManager.updateRecord(
        videoId,
        (currentRecords) => {
            const currentRecord = currentRecords[videoId];
            if (!currentRecord) {
                throw new Error(`Record ${videoId} not found in current storage`);
            }

            // 创建更新后的记录，应用所有变更
            const updatedRecord = { ...currentRecord };

            // 应用数据更新
            if (latestData.title) updatedRecord.title = latestData.title;
            if (latestData.tags) updatedRecord.tags = latestData.tags;
            if (latestData.releaseDate !== undefined) updatedRecord.releaseDate = latestData.releaseDate;
            updatedRecord.javdbUrl = currentUrl;
            if (latestData.javdbImage !== undefined) updatedRecord.javdbImage = latestData.javdbImage;
            updatedRecord.updatedAt = now;

            // 尝试状态升级（优先采用页面识别状态，其次退回到 browsed）
            const pageDetectedStatusInner = pageDetectedStatus; // 捕获外部变量
            const desired = pageDetectedStatusInner ?? VIDEO_STATUS.BROWSED;
            const upgraded = safeUpdateStatus(currentRecord.status, desired);
            updatedRecord.status = upgraded;
            return updatedRecord;
        },
        operationId
    );

    if (result.success) {
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
        // 根据最新状态更新 favicon
        updateFaviconForStatus(record.status);

    } else {
        log(`Failed to save updated record for ${videoId} (operation ${operationId}): ${result.error}`);
        showToast(`保存失败: ${videoId} - ${result.error}`, 'error');
    }
}

async function handleNewRecord(
    videoId: string, 
    now: number, 
    currentUrl: string
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
                // 二次过滤：当 tags 与 描述 同时为空时，不保存并提示
                showToast(`数据无效，已跳过保存: ${videoId}`, 'info');
                return;
            }

            // 使用存储管理器进行原子性添加
            const result = await storageManager.addRecord(videoId, newRecord, delayedOperationId);

            if (result.success) {
                if (result.alreadyExists) {
                    log(`${videoId} was added by another operation while waiting. Skipping duplicate add.`);
                    showToast(`番号已存在: ${videoId}`, 'info');
                } else {
                    log(`Successfully added new record for ${videoId} (operation ${delayedOperationId})`, newRecord);
                    showToast(`成功记录番号: ${videoId}`, 'success');
                }
                // 根据新建记录的状态更新 favicon
                updateFaviconForStatus(newRecord.status);
            } else {
                log(`Failed to save new record for ${videoId} (operation ${delayedOperationId}): ${result.error}`);
                showToast(`保存失败: ${videoId} - ${result.error}`, 'error');
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

        // 获取标签
        const tagElements = document.querySelectorAll<HTMLAnchorElement>(SELECTORS.VIDEO_DETAIL_TAGS);

        const tags = Array.from(tagElements)
            .map(tag => tag.innerText.trim())
            .filter(Boolean);

        // 如果没有找到标签，尝试备用选择器
        if (tags.length === 0) {

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
                        const altTags = Array.from(altTagElements)
                            .map(tag => tag.innerText.trim())
                            .filter(Boolean);
                        if (altTags.length > 0) {
                            tags.push(...altTags);
                            break;
                        }
                    }
                } catch (error) {
                    log(`Error with alternative selector ${selector}:`, error);
                }
            }
        }

        // 提取描述文本，用于二次过滤（常见标签：描述/簡介/简介/說明/说明）
        let descriptionText: string | undefined;
        try {
            const panelBlocksForDesc = Array.from(document.querySelectorAll<HTMLElement>('.panel-block'));
            for (const block of panelBlocksForDesc) {
                const strongElement = block.querySelector('strong');
                const label = strongElement?.textContent?.trim() || '';
                if (['描述', '簡介', '简介', '說明', '说明'].some(k => label.includes(k))) {
                    const valueEl = block.querySelector<HTMLElement>('.value');
                    const text = (valueEl?.textContent || block.textContent || '').trim();
                    if (text) {
                        descriptionText = text;
                        log(`Found description text: "${descriptionText.substring(0, 50)}${(descriptionText.length > 50 ? '...' : '')}"`);
                        break;
                    }
                }
            }
        } catch (e) {
            log('Error while extracting description text:', e);
        }

        // 二次过滤：当 tags 与 描述 同时为空时，不保存
        if (tags.length === 0 && (!descriptionText || descriptionText.length === 0)) {
            log('Secondary validation failed: both tags and description are empty. Skip saving.');
            return null;
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

        // 页面状态识别（我看過/我想看）
        const pageDetectedStatus = detectPageUserStatus();

        return {
            id: videoId,
            title: title,
            status: pageDetectedStatus ?? VIDEO_STATUS.BROWSED,
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
