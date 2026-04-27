// src/content/videoDetail.ts

// import { setValue } from '../utils/storage'; // 不再直接使用，改用storageManager
import { VIDEO_STATUS } from '../utils/config';
import { safeUpdateStatus } from '../utils/statusPriority';
import type { VideoRecord } from '../types';
import { STATE, SELECTORS, log } from './state';
import { extractVideoIdFromPage } from './videoId';
import { concurrencyManager, storageManager } from './concurrency';
import { showToast } from './toast';
import { createTaskTimeoutGuard, isTaskTimeoutError, getRandomDelay, waitForElement } from './utils';
import { updateFaviconForStatus } from './statusManager';
import { videoDetailEnhancer } from './enhancedVideoDetail';
import { videoFavoriteRatingEnhancer } from './videoFavoriteRating';
import { initOrchestrator } from './initOrchestrator';
import { actorManager } from '../services/actorManager';
import { getSettings, saveSettings } from '../utils/storage';
import { actorExtraInfoService } from '../services/actorRemarks';

function getActorRemarksTaskTimeoutMs(settings: any): number {
    const seconds = Number(settings?.videoEnhancement?.actorRemarksTaskTimeoutSeconds);
    if (!Number.isFinite(seconds) || seconds <= 0) return 120000;
    return Math.max(1000, Math.round(seconds * 1000));
}

// 全局变量：状态监听器
let statusObserver: MutationObserver | null = null;
let lastDetectedStatus: typeof VIDEO_STATUS[keyof typeof VIDEO_STATUS] | null = null;

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

/**
 * 设置状态变化监听器
 * 监听页面上"看过"/"想看"按钮的变化，自动更新插件状态
 */
function setupStatusChangeObserver(videoId: string): void {
    try {
        // 如果已经存在监听器，先清理
        if (statusObserver) {
            statusObserver.disconnect();
            statusObserver = null;
        }

        // 初始化最后检测的状态
        lastDetectedStatus = detectPageUserStatus();
        log(`[StatusObserver] Initial status: ${lastDetectedStatus || 'null'}`);

        // 查找需要监听的容器（评论区域，通常包含"看过"/"想看"状态）
        const reviewContainer = document.querySelector('.review-buttons')?.parentElement
            || document.querySelector('.movie-panel-info')
            || document.body;

        if (!reviewContainer) {
            log('[StatusObserver] Review container not found, skipping observer setup');
            return;
        }

        // 创建 MutationObserver 监听 DOM 变化
        statusObserver = new MutationObserver((mutations) => {
            // 检查是否有相关的 DOM 变化
            let shouldCheck = false;
            for (const mutation of mutations) {
                // 检查是否有新增或修改的节点包含"看过"或"想看"相关内容
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasRelevantChange = addedNodes.some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            const text = element.textContent || '';
                            return text.includes('我看過') || text.includes('我想看') ||
                                   element.querySelector('.review-title') !== null;
                        }
                        return false;
                    });

                    if (hasRelevantChange || mutation.target.textContent?.includes('我看過') ||
                        mutation.target.textContent?.includes('我想看')) {
                        shouldCheck = true;
                        break;
                    }
                }
            }

            if (shouldCheck) {
                // 延迟检查，避免频繁触发
                setTimeout(() => {
                    checkAndUpdateStatusIfChanged(videoId);
                }, 500);
            }
        });

        // 开始监听
        statusObserver.observe(reviewContainer, {
            childList: true,      // 监听子节点的添加/删除
            subtree: true,        // 监听所有后代节点
            characterData: true,  // 监听文本内容变化
            attributes: false     // 不监听属性变化（性能优化）
        });

        log('[StatusObserver] Status change observer setup complete');
    } catch (error) {
        log('[StatusObserver] Failed to setup observer:', error);
    }
}

/**
 * 检查状态是否变化，如果变化则更新
 */
async function checkAndUpdateStatusIfChanged(videoId: string): Promise<void> {
    try {
        const currentStatus = detectPageUserStatus();

        // 如果状态没有变化，不做任何操作
        if (currentStatus === lastDetectedStatus) {
            return;
        }

        log(`[StatusObserver] Status changed from ${lastDetectedStatus || 'null'} to ${currentStatus || 'null'}`);
        lastDetectedStatus = currentStatus;

        // 如果检测到新状态，更新数据库
        if (currentStatus) {
            await updateVideoStatus(videoId, currentStatus);
        }
    } catch (error) {
        log('[StatusObserver] Error checking status change:', error);
    }
}

/**
 * 更新视频状态到数据库
 */
async function updateVideoStatus(
    videoId: string,
    newStatus: typeof VIDEO_STATUS[keyof typeof VIDEO_STATUS]
): Promise<void> {
    const opId = await concurrencyManager.startProcessingVideo(`${videoId}-status-update`);
    if (!opId) {
        log('[StatusObserver] Another operation in progress, skipping status update');
        return;
    }

    try {
        const now = Date.now();
        const existing = STATE.records[videoId];

        if (existing) {
            // 更新现有记录
            const result = await storageManager.updateRecord(
                videoId,
                (current) => {
                    const cur = current[videoId];
                    if (!cur) {
                        throw new Error(`Record ${videoId} not found`);
                    }
                    const updated = { ...cur } as VideoRecord;
                    // 使用安全的状态升级逻辑
                    updated.status = safeUpdateStatus(cur.status, newStatus);
                    updated.updatedAt = now;
                    return updated;
                },
                opId
            );

            if (result.success) {
                log(`[StatusObserver] Status updated to ${newStatus} for ${videoId}`);
                updateFaviconForStatus(newStatus);

                // 显示状态名称
                const statusName = newStatus === VIDEO_STATUS.VIEWED ? '已观看' :
                                 newStatus === VIDEO_STATUS.WANT ? '我想看' : '已浏览';
                showToast(`状态已自动更新为「${statusName}」`, 'success');
            } else {
                log(`[StatusObserver] Failed to update status: ${result.error}`);
            }
        } else {
            log('[StatusObserver] No existing record found, status update skipped');
        }
    } catch (error) {
        log('[StatusObserver] Error updating status:', error);
    } finally {
        concurrencyManager.finishProcessingVideo(`${videoId}-status-update`, opId);
    }
}

/**
 * 清理状态监听器
 */
function cleanupStatusObserver(): void {
    if (statusObserver) {
        statusObserver.disconnect();
        statusObserver = null;
        log('[StatusObserver] Observer cleaned up');
    }
}

/**
 * 导出清理函数供外部调用
 */
export function cleanupVideoDetailObservers(): void {
    cleanupStatusObserver();
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

// 轻量版“演员备注”注入（面板模式，默认关闭，通过 settings.videoEnhancement.enableActorRemarks 开启）
async function runActorRemarksQuick(timeoutMs?: number): Promise<void> {
    try {
        const enabled = ((STATE.settings as any)?.videoEnhancement?.enableActorRemarks === true);
        if (!enabled) return;

        const taskTimeoutMs = typeof timeoutMs === 'number' && timeoutMs > 0
            ? timeoutMs
            : getActorRemarksTaskTimeoutMs(STATE.settings as any);
        const timeoutGuard = createTaskTimeoutGuard(taskTimeoutMs);
        const mode = (((STATE.settings as any)?.videoEnhancement?.actorRemarksMode) === 'inline') ? 'inline' : 'panel';

        // 等待演员链接出现（页面结构可能变动，避免过早执行导致无效果）
        const firstActorLink = await waitForElement('a[href^="/actors/"]', timeoutGuard.timeoutMs > 0 ? Math.min(8000, timeoutGuard.timeoutMs) : 8000, 200);
        if (!firstActorLink) {
            log('actorRemarks: no actor links found (timeout)');
            return;
        }

        const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/actors/"]'));
        if (!links.length) {
            log('actorRemarks: no actor links found (empty)');
            return;
        }

        const actorBlock = links[0].closest<HTMLElement>('.panel-block') || (links[0].parentElement as HTMLElement | null);
        if (!actorBlock) {
            log('actorRemarks: actor container not found');
            return;
        }

        log('actorRemarks: start', { mode, actors: links.length });

        const buildBadgeText = (data: any): string => {
            const parts: string[] = [];
            if (typeof data?.age === 'number') parts.push(String(data.age));
            if (typeof data?.heightCm === 'number') parts.push(`${data.heightCm}cm`);
            if (data?.cup) parts.push(String(data.cup).toUpperCase());
            let txt = parts.length ? parts.join(' / ') : '';
            if (data?.retired) txt = txt ? `${txt} / 引退` : '引退';
            return txt;
        };

        const ensurePanel = (): HTMLElement => {
            let panel = document.getElementById('enhanced-actor-remarks');
            if (panel) return panel;
            panel = document.createElement('div');
            panel.id = 'enhanced-actor-remarks';
            panel.style.cssText = 'margin:12px 0;padding:12px;background:#fff7ed;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;color:#78350f;font-size:13px;';
            const title = document.createElement('div');
            title.textContent = '演员备注';
            title.style.cssText = 'font-weight:bold;margin-bottom:6px;color:#92400e;';
            panel.appendChild(title);
            actorBlock.parentElement?.insertBefore(panel, actorBlock.nextSibling);
            return panel;
        };

        const processed = new Set<string>();
        let renderedCount = 0;

        // 优化：并行查询所有演员信息
        const actorTasks = links.map(async (a) => {
            const name = (a.textContent || '').trim();
            if (!name || processed.has(name)) return null;
            processed.add(name);

            try {
                const data = await actorExtraInfoService.getActorRemarks(name, STATE.settings as any);
                return { element: a, name, data };
            } catch (e) {
                log('actorRemarks: fetch failed for', name, e);
                return null;
            }
        });

        // 等待所有查询完成
        let taskTimedOut = false;
        const timeoutPromise = timeoutGuard.timeoutMs > 0
            ? new Promise<never>((_, reject) => {
                window.setTimeout(() => {
                    taskTimedOut = true;
                    reject(new Error(`Task timeout after ${timeoutGuard.timeoutMs}ms`));
                }, timeoutGuard.timeoutMs);
            })
            : null;

        const results = timeoutPromise
            ? await Promise.race([Promise.all(actorTasks), timeoutPromise]) as Array<{ element: HTMLAnchorElement; name: string; data: any } | null>
            : await Promise.all(actorTasks);

        timeoutGuard.throwIfTimedOut();
        if (taskTimedOut) {
            throw new Error(`Task timeout after ${timeoutGuard.timeoutMs}ms`);
        }

        // 统一渲染结果
        for (const result of results) {
            if (!result) continue;

            const { element: a, name, data } = result;
            const badgeText = data ? buildBadgeText(data) : '';

            // 兜底：抓不到字段时，展示外链入口
            const wikiUrl = data?.wikiUrl || `https://ja.wikipedia.org/wiki/${encodeURIComponent(name)}`;
            const xslistUrl = (data as any)?.xslistUrl || `https://xslist.org/search?query=${encodeURIComponent(name)}&lg=zh`;

            if (mode === 'inline') {
                // 只移除当前演员 a 后面紧挨着的备注，避免同一父节点下互相覆盖
                const existing = a.nextElementSibling as HTMLElement | null;
                if (existing?.classList?.contains('jdb-actor-remarks-inline')) existing.remove();

                const wrap = document.createElement('span');
                wrap.className = 'jdb-actor-remarks-inline';
                wrap.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-left:6px;';

                if (badgeText) {
                    const infoEl = document.createElement('span');
                    infoEl.textContent = badgeText;
                    infoEl.style.cssText = 'background:#ffedd5;color:#7c2d12;padding:1px 6px;border-radius:999px;font-size:12px;line-height:18px;';
                    wrap.appendChild(infoEl);
                } else {
                    const link1 = document.createElement('a');
                    link1.href = wikiUrl;
                    link1.target = '_blank';
                    link1.textContent = 'Wiki';
                    link1.style.cssText = 'color:#b45309;text-decoration:underline;font-size:12px;';
                    wrap.appendChild(link1);

                    const link2 = document.createElement('a');
                    link2.href = xslistUrl;
                    link2.target = '_blank';
                    link2.textContent = 'xslist';
                    link2.style.cssText = 'color:#b45309;text-decoration:underline;font-size:12px;';
                    wrap.appendChild(link2);
                }

                a.insertAdjacentElement('afterend', wrap);
            } else {
                const panel = ensurePanel();

                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0;flex-wrap:wrap;';
                const nameEl = document.createElement('span');
                nameEl.textContent = name;
                nameEl.style.cssText = 'font-weight:600;';
                row.appendChild(nameEl);

                if (badgeText) {
                    const infoEl = document.createElement('span');
                    infoEl.textContent = badgeText;
                    infoEl.style.cssText = 'background:#ffedd5;color:#7c2d12;padding:2px 6px;border-radius:12px;font-size:12px;';
                    row.appendChild(infoEl);
                } else {
                    const link1 = document.createElement('a');
                    link1.href = wikiUrl;
                    link1.target = '_blank';
                    link1.textContent = 'Wiki';
                    link1.style.cssText = 'margin-left:6px;color:#b45309;text-decoration:underline;';
                    row.appendChild(link1);

                    const link2 = document.createElement('a');
                    link2.href = xslistUrl;
                    link2.target = '_blank';
                    link2.textContent = 'xslist';
                    link2.style.cssText = 'margin-left:6px;color:#b45309;text-decoration:underline;';
                    row.appendChild(link2);
                }
                panel.appendChild(row);
            }

            renderedCount += 1;
        }

        if (mode === 'panel') {
            const panel = document.getElementById('enhanced-actor-remarks');
            if (panel && renderedCount === 0) {
                panel.remove();
            }
        }

        log('actorRemarks: done', { mode, rendered: renderedCount });
    } catch (e) {
        if (isTaskTimeoutError(e)) throw e;
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

        // 独立：演员备注（受主开关控制）
        try {
            const enabledActorRemarks = (enableVideoEnhancement && (STATE.settings as any)?.videoEnhancement?.enableActorRemarks === true);
            if (enabledActorRemarks) {
                const FLAG = '__jdb_actorRemarks_scheduled__';
                if (!(window as any)[FLAG]) {
                    (window as any)[FLAG] = true;
                    const actorRemarksTaskTimeoutMs = getActorRemarksTaskTimeoutMs(STATE.settings as any);
                    initOrchestrator.add('deferred', async () => {
                        try {
                            await runActorRemarksQuick(actorRemarksTaskTimeoutMs);
                        } catch (e) {
                            if (isTaskTimeoutError(e)) throw e;
                        }
                    }, { label: 'actorRemarks:run', idle: true, idleTimeout: 5000, delayMs: 1200, timeout: actorRemarksTaskTimeoutMs });
                }
            }
        } catch {}

        // 独立：影片页收藏与评分（受主开关控制）
        try {
            const enabledVideoFavoriteRating = (enableVideoEnhancement && (STATE.settings as any)?.videoEnhancement?.enableVideoFavoriteRating === true);
            if (enabledVideoFavoriteRating) {
                const FLAG = '__jdb_videoFavoriteRating_scheduled__';
                if (!(window as any)[FLAG]) {
                    (window as any)[FLAG] = true;
                    initOrchestrator.add('deferred', async () => {
                        try { await videoFavoriteRatingEnhancer.init(); } catch {}
                    }, { label: 'videoFavoriteRating:init', idle: true, idleTimeout: 5000, delayMs: 1000 });
                }
            }
        } catch {}

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
        
        // 🆕 设置状态变化监听器，自动检测用户点击"看过"/"想看"按钮
        try {
            setupStatusChangeObserver(videoId);
        } catch (e) { log('setupStatusChangeObserver error:', e as any); }
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
        const ve: any = (settings as any).videoEnhancement || {};

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
        const l3 = line('演员备注（Wiki/xslist）', ve.enableActorRemarks === true, (v) => onSave(({ enableActorRemarks: v } as any)));

        panel.appendChild(title);
        panel.appendChild(l1);
        panel.appendChild(l2);
        panel.appendChild(l3);

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
    
    // 获取锁定字段列表
    const lockedFields = new Set(record.manuallyEditedFields || []);

    // 始终更新数据字段（除了状态、时间戳和锁定字段）
    // 用户专属字段（userRating, userNotes, isFavorite）永远不会被覆盖
    if (latestData.title && !lockedFields.has('title')) record.title = latestData.title;
    if (latestData.tags && !lockedFields.has('tags')) record.tags = latestData.tags;
    if (latestData.releaseDate !== undefined && !lockedFields.has('releaseDate')) record.releaseDate = latestData.releaseDate;
    record.javdbUrl = currentUrl; // 始终更新URL
    if (latestData.javdbImage !== undefined) record.javdbImage = latestData.javdbImage;
    
    // 🆕 更新新增字段（跳过锁定字段）
    if (latestData.videoCode !== undefined) record.videoCode = latestData.videoCode;
    if (latestData.duration !== undefined && !lockedFields.has('duration')) record.duration = latestData.duration;
    if (latestData.director !== undefined && !lockedFields.has('director')) record.director = latestData.director;
    if (latestData.directorUrl !== undefined) record.directorUrl = latestData.directorUrl;
    if (latestData.maker !== undefined && !lockedFields.has('maker')) record.maker = latestData.maker;
    if (latestData.makerUrl !== undefined) record.makerUrl = latestData.makerUrl;
    if (latestData.publisher !== undefined) record.publisher = latestData.publisher;
    if (latestData.publisherUrl !== undefined) record.publisherUrl = latestData.publisherUrl;
    if (latestData.series !== undefined && !lockedFields.has('series')) record.series = latestData.series;
    if (latestData.seriesUrl !== undefined) record.seriesUrl = latestData.seriesUrl;
    if (latestData.rating !== undefined) record.rating = latestData.rating;
    if (latestData.ratingCount !== undefined) record.ratingCount = latestData.ratingCount;
    if (latestData.actors !== undefined && !lockedFields.has('actors')) record.actors = latestData.actors;
    if (latestData.wantToWatchCount !== undefined) record.wantToWatchCount = latestData.wantToWatchCount;
    if (latestData.watchedCount !== undefined) record.watchedCount = latestData.watchedCount;
    if (latestData.categories !== undefined && !lockedFields.has('categories')) record.categories = latestData.categories;
    
    record.updatedAt = now;

    // 检查哪些字段发生了变化
    const changes: string[] = [];
    if (oldRecord.title !== record.title) changes.push('标题');
    if (JSON.stringify(oldRecord.tags) !== JSON.stringify(record.tags)) changes.push('标签');
    if (oldRecord.releaseDate !== record.releaseDate) changes.push('发布日期');
    if (oldRecord.javdbUrl !== record.javdbUrl) changes.push('URL');
    if (oldRecord.javdbImage !== record.javdbImage) changes.push('封面图片');
    // 🆕 检查新增字段的变化
    if (oldRecord.videoCode !== record.videoCode) changes.push('番号前缀');
    if (oldRecord.duration !== record.duration) changes.push('时长');
    if (oldRecord.director !== record.director) changes.push('导演');
    if (oldRecord.directorUrl !== record.directorUrl) changes.push('导演链接');
    if (oldRecord.maker !== record.maker) changes.push('片商');
    if (oldRecord.makerUrl !== record.makerUrl) changes.push('片商链接');
    if (oldRecord.publisher !== record.publisher) changes.push('发行商');
    if (oldRecord.publisherUrl !== record.publisherUrl) changes.push('发行商链接');
    if (oldRecord.series !== record.series) changes.push('系列');
    if (oldRecord.seriesUrl !== record.seriesUrl) changes.push('系列链接');
    if (oldRecord.rating !== record.rating) changes.push('评分');
    if (oldRecord.ratingCount !== record.ratingCount) changes.push('评分人数');
    if (JSON.stringify(oldRecord.actors) !== JSON.stringify(record.actors)) changes.push('演员');
    if (oldRecord.wantToWatchCount !== record.wantToWatchCount) changes.push('想看人数');
    if (oldRecord.watchedCount !== record.watchedCount) changes.push('看过人数');
    if (JSON.stringify(oldRecord.categories) !== JSON.stringify(record.categories)) changes.push('类别');

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
            
            // 获取锁定字段列表
            const lockedFieldsInner = new Set(currentRecord.manuallyEditedFields || []);

            // 应用数据更新（跳过锁定字段）
            if (latestData.title && !lockedFieldsInner.has('title')) updatedRecord.title = latestData.title;
            if (latestData.tags && !lockedFieldsInner.has('tags')) updatedRecord.tags = latestData.tags;
            if (latestData.releaseDate !== undefined && !lockedFieldsInner.has('releaseDate')) updatedRecord.releaseDate = latestData.releaseDate;
            updatedRecord.javdbUrl = currentUrl;
            if (latestData.javdbImage !== undefined) updatedRecord.javdbImage = latestData.javdbImage;
            
            // 🆕 更新新增字段（跳过锁定字段）
            if (latestData.videoCode !== undefined) updatedRecord.videoCode = latestData.videoCode;
            if (latestData.duration !== undefined && !lockedFieldsInner.has('duration')) updatedRecord.duration = latestData.duration;
            if (latestData.director !== undefined && !lockedFieldsInner.has('director')) updatedRecord.director = latestData.director;
            if (latestData.directorUrl !== undefined) updatedRecord.directorUrl = latestData.directorUrl;
            if (latestData.maker !== undefined && !lockedFieldsInner.has('maker')) updatedRecord.maker = latestData.maker;
            if (latestData.makerUrl !== undefined) updatedRecord.makerUrl = latestData.makerUrl;
            if (latestData.publisher !== undefined) updatedRecord.publisher = latestData.publisher;
            if (latestData.publisherUrl !== undefined) updatedRecord.publisherUrl = latestData.publisherUrl;
            if (latestData.series !== undefined && !lockedFieldsInner.has('series')) updatedRecord.series = latestData.series;
            if (latestData.seriesUrl !== undefined) updatedRecord.seriesUrl = latestData.seriesUrl;
            if (latestData.rating !== undefined) updatedRecord.rating = latestData.rating;
            if (latestData.ratingCount !== undefined) updatedRecord.ratingCount = latestData.ratingCount;
            if (latestData.actors !== undefined && !lockedFieldsInner.has('actors')) updatedRecord.actors = latestData.actors;
            if (latestData.wantToWatchCount !== undefined) updatedRecord.wantToWatchCount = latestData.wantToWatchCount;
            if (latestData.watchedCount !== undefined) updatedRecord.watchedCount = latestData.watchedCount;
            if (latestData.categories !== undefined && !lockedFieldsInner.has('categories')) updatedRecord.categories = latestData.categories;
            
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

        // 获取所有 panel-block 元素，用于提取各种字段
        const panelBlocks = Array.from(document.querySelectorAll<HTMLElement>('.panel-block'));
        
        // 辅助函数：根据标签名查找对应的值
        const findValueByLabel = (labels: string[]): string | undefined => {
            for (const block of panelBlocks) {
                const strongElement = block.querySelector('strong');
                const label = strongElement?.textContent?.trim() || '';
                if (labels.some(l => label.includes(l))) {
                    const valueElement = block.querySelector('.value');
                    if (valueElement) {
                        return valueElement.textContent?.trim();
                    }
                }
            }
            return undefined;
        };

        // 🆕 辅助函数：根据标签名查找对应的链接
        const findLinkByLabel = (labels: string[]): { text?: string; url?: string } | undefined => {
            for (const block of panelBlocks) {
                const strongElement = block.querySelector('strong');
                const label = strongElement?.textContent?.trim() || '';
                if (labels.some(l => label.includes(l))) {
                    const linkElement = block.querySelector<HTMLAnchorElement>('.value a');
                    if (linkElement) {
                        return {
                            text: linkElement.textContent?.trim(),
                            url: linkElement.getAttribute('href') || undefined
                        };
                    }
                }
            }
            return undefined;
        };

        // 🆕 提取番号前缀（从番号中提取，如 "JAC-229" -> "JAC"）
        const videoCode = videoId.split('-')[0] || undefined;

        // 获取发布日期
        let releaseDate = findValueByLabel(['日期', 'Date']);
        if (!releaseDate) {
            // 尝试通过正则匹配日期格式
            for (const block of panelBlocks) {
                const text = block.textContent?.trim();
                if (text) {
                    const dateMatch = text.match(/(\d{4}-\d{1,2}-\d{1,2})/);
                    if (dateMatch) {
                        releaseDate = dateMatch[1];
                        break;
                    }
                }
            }
        }
        log(`Release date: "${releaseDate || 'undefined'}"`);

        // 🆕 提取时长（分钟）
        let duration: number | undefined;
        const durationText = findValueByLabel(['時長', '时长', 'Duration']);
        if (durationText) {
            const durationMatch = durationText.match(/(\d+)/);
            if (durationMatch) {
                duration = parseInt(durationMatch[1], 10);
                log(`Duration: ${duration} minutes`);
            }
        }

        // 🆕 提取导演（名称 + 链接）
        const directorInfo = findLinkByLabel(['導演', '导演', 'Director']);
        const director = directorInfo?.text;
        const directorUrl = directorInfo?.url;
        if (director) log(`Director: "${director}"${directorUrl ? ` (${directorUrl})` : ''}`);

        // 🆕 提取片商（名称 + 链接）
        const makerInfo = findLinkByLabel(['片商', 'Maker', 'Studio']);
        const maker = makerInfo?.text;
        const makerUrl = makerInfo?.url;
        if (maker) log(`Maker: "${maker}"${makerUrl ? ` (${makerUrl})` : ''}`);

        // 🆕 提取发行商（名称 + 链接）
        const publisherInfo = findLinkByLabel(['發行', '发行', 'Publisher']);
        const publisher = publisherInfo?.text;
        const publisherUrl = publisherInfo?.url;
        if (publisher) log(`Publisher: "${publisher}"${publisherUrl ? ` (${publisherUrl})` : ''}`);

        // 🆕 提取系列（名称 + 链接）
        const seriesInfo = findLinkByLabel(['系列', 'Series']);
        const series = seriesInfo?.text;
        const seriesUrl = seriesInfo?.url;
        if (series) log(`Series: "${series}"${seriesUrl ? ` (${seriesUrl})` : ''}`);


        // 🆕 提取评分信息
        let rating: number | undefined;
        let ratingCount: number | undefined;
        const ratingText = findValueByLabel(['評分', '评分', 'Rating']);
        if (ratingText) {
            // 匹配格式如 "3.73分, 由87人評價"
            const ratingMatch = ratingText.match(/([\d.]+)分/);
            const countMatch = ratingText.match(/(\d+)人/);
            if (ratingMatch) {
                rating = parseFloat(ratingMatch[1]);
                log(`Rating: ${rating}`);
            }
            if (countMatch) {
                ratingCount = parseInt(countMatch[1], 10);
                log(`Rating count: ${ratingCount}`);
            }
        }

        // 🆕 提取演员列表
        const actors: string[] = [];
        for (const block of panelBlocks) {
            const strongElement = block.querySelector('strong');
            const label = strongElement?.textContent?.trim() || '';
            if (label.includes('演員') || label.includes('演员') || label.includes('Actor')) {
                const actorLinks = block.querySelectorAll<HTMLAnchorElement>('a[href^="/actors/"]');
                actorLinks.forEach(link => {
                    const actorName = link.textContent?.trim();
                    if (actorName && actorName !== 'N/A') {
                        actors.push(actorName);
                    }
                });
                break;
            }
        }
        if (actors.length > 0) log(`Actors: [${actors.join(', ')}]`);

        // 🆕 提取统计数据（想看人数、看过人数）
        let wantToWatchCount: number | undefined;
        let watchedCount: number | undefined;
        const statsText = findValueByLabel(['人想看', '人看過', '人看过']);
        if (statsText) {
            // 匹配格式如 "671人想看, 87人看過"
            const wantMatch = statsText.match(/(\d+)人想看/);
            const watchedMatch = statsText.match(/(\d+)人看[過过]/);
            if (wantMatch) {
                wantToWatchCount = parseInt(wantMatch[1], 10);
                log(`Want to watch count: ${wantToWatchCount}`);
            }
            if (watchedMatch) {
                watchedCount = parseInt(watchedMatch[1], 10);
                log(`Watched count: ${watchedCount}`);
            }
        }

        // 获取标签（类别）
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
                '.panel-block .value a',
                '.tags a',
                'a[href*="/genres/"]'
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

        // 🆕 提取类别标签（从"類別"字段）
        const categories: string[] = [];
        for (const block of panelBlocks) {
            const strongElement = block.querySelector('strong');
            const label = strongElement?.textContent?.trim() || '';
            if (label.includes('類別') || label.includes('类别') || label.includes('Category')) {
                const categoryLinks = block.querySelectorAll<HTMLAnchorElement>('a[href*="/tags"]');
                categoryLinks.forEach(link => {
                    const categoryName = link.textContent?.trim();
                    if (categoryName) {
                        categories.push(categoryName);
                    }
                });
                break;
            }
        }
        if (categories.length > 0) log(`Categories: [${categories.join(', ')}]`);

        // 提取描述文本，用于二次过滤
        let descriptionText: string | undefined;
        try {
            for (const block of panelBlocks) {
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
            // 🆕 新增字段
            videoCode,
            duration,
            director,
            directorUrl,
            maker,
            makerUrl,
            publisher,
            publisherUrl,
            series,
            seriesUrl,
            rating,
            ratingCount,
            actors: actors.length > 0 ? actors : undefined,
            wantToWatchCount,
            watchedCount,
            categories: categories.length > 0 ? categories : undefined,
        };
    } catch (error) {
        log(`Error extracting video data for ${videoId}:`, error);
        return null;
    }
}

async function createVideoRecord(videoId: string, now: number, currentUrl: string): Promise<VideoRecord | null> {
    try {
        // 使用统一的数据提取函数
        const extractedData = await extractVideoData(videoId);
        if (!extractedData) {
            log(`Failed to extract data for ${videoId}`);
            return null;
        }

        // 页面状态识别（我看過/我想看）
        const pageDetectedStatus = detectPageUserStatus();

        return {
            id: videoId,
            title: extractedData.title || document.title.replace(/ \| JavDB.*/, '').trim(),
            status: pageDetectedStatus ?? VIDEO_STATUS.BROWSED,
            createdAt: now,
            updatedAt: now,
            tags: extractedData.tags || [],
            releaseDate: extractedData.releaseDate,
            javdbUrl: currentUrl,
            javdbImage: extractedData.javdbImage,
            // 🆕 新增字段
            videoCode: extractedData.videoCode,
            duration: extractedData.duration,
            director: extractedData.director,
            directorUrl: extractedData.directorUrl,
            maker: extractedData.maker,
            makerUrl: extractedData.makerUrl,
            publisher: extractedData.publisher,
            publisherUrl: extractedData.publisherUrl,
            series: extractedData.series,
            seriesUrl: extractedData.seriesUrl,
            rating: extractedData.rating,
            ratingCount: extractedData.ratingCount,
            actors: extractedData.actors,
            wantToWatchCount: extractedData.wantToWatchCount,
            watchedCount: extractedData.watchedCount,
            categories: extractedData.categories,
        };
    } catch (error) {
        log(`Error creating video record for ${videoId}:`, error);
        return null;
    }
}
