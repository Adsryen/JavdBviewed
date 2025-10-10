/**
 * 115网盘内容脚本集成
 */

import { isDrive115Enabled, isV2Enabled, addTaskUrlsV2, downloadOffline as routerDownloadOffline } from '../services/drive115Router';
// getDrive115V2Service 已移除，配额功能已迁移至dashboard
import { addLogV2 } from '../services/drive115v2/logs';
import { waitForElement } from './utils';
// extractVideoIdFromPage 已集成到推送按钮逻辑中
import { showToast } from './toast';
import { log } from './state';
import { getSettings } from '../utils/storage';

// 统一的网络请求超时与重试封装（用于对抗临时的网络抖动/连接重置）
async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeoutRetry(
    url: string,
    options: RequestInit,
    opts: { retries?: number; timeoutMs?: number; backoffBaseMs?: number; retryOnHttpStatuses?: number[] } = {}
): Promise<Response> {
    const {
        retries = 2,
        timeoutMs = 8000,
        backoffBaseMs = 600,
        retryOnHttpStatuses = [408, 429, 500, 502, 503, 504, 520, 522, 524]
    } = opts;

    let lastError: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
            const resp = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            if (!resp.ok && retryOnHttpStatuses.includes(resp.status) && attempt < retries) {
                const sleepMs = backoffBaseMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
                log(`[Network] HTTP ${resp.status}，准备重试 ${attempt + 1}/${retries}: ${url}`);
                await delay(sleepMs);
                continue;
            }
            return resp;
        } catch (err: any) {
            clearTimeout(timeoutId);
            lastError = err;
            if (attempt < retries) {
                const isAbort = err?.name === 'AbortError';
                const sleepMs = backoffBaseMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
                log(`[Network] 请求异常（${isAbort ? '超时' : '网络错误'}），准备重试 ${attempt + 1}/${retries}: ${url}`);
                await delay(sleepMs);
                continue;
            }
            throw err;
        }
    }
    throw lastError ?? new Error('网络请求失败');
}

/**
 * 记录日志到扩展日志系统
 */
function logToExtension(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any): Promise<void> {
    return new Promise((resolve) => {
        console.log(`[115] 开始记录日志: ${message}`);

        // 设置超时，避免阻塞主要流程
        const timeout = setTimeout(() => {
            console.warn(`[115] 日志记录超时: ${message}`);
            resolve();
        }, 5000); // 增加到5秒超时

        try {
            const messagePayload = {
                type: 'log-message',
                payload: { level, message: `[115] ${message}`, data }
            };

            console.log(`[115] 发送日志消息:`, messagePayload);

            chrome.runtime.sendMessage(messagePayload, (response) => {
                clearTimeout(timeout);
                console.log(`[115] 收到日志响应:`, response);

                if (chrome.runtime.lastError) {
                    console.error(`[115] 日志记录失败: ${chrome.runtime.lastError.message}`);
                } else if (response && response.success) {
                    console.log(`[115] 日志记录成功: ${message}`);
                } else {
                    console.warn(`[115] 日志记录响应异常:`, response);
                }
                resolve();
            });
        } catch (error) {
            clearTimeout(timeout);
            console.error(`[115] 发送日志消息失败:`, error);
            resolve();
        }
    });
}

/**
 * 初始化115功能
 */
export async function initDrive115Features(): Promise<void> {
    try {
        // 通过统一路由判断是否启用115功能（屏蔽 v1/v2 差异）
        const enabled = await isDrive115Enabled();
        if (!enabled) {
            return;
        }

        // 在详情页添加115按钮
        if (window.location.pathname.startsWith('/v/')) {
            // 暂时跳过按钮添加，避免依赖错误
            log('[Drive115] Video detail page detected, but button addition is temporarily disabled');
        }

        // 等待容器元素出现，避免初始化过早导致刷新后不渲染
        const userBox = await waitForElement('#drive115-user-box', 5000, 150);
        const userStatus = await waitForElement('#drive115-user-status', 3000, 150);
        
        if (!userBox || !userStatus) {
            log('[Drive115] Required containers not found, skipping initialization');
            return;
        }

        // 简化初始化，避免调用不存在的函数
        log('[Drive115] Containers found, initialization completed');
        try {
            const refreshBtn = document.getElementById('drive115-refresh-btn');
            if (refreshBtn && !(refreshBtn as any)._bound_drive115_quota_refresh) {
                (refreshBtn as any)._bound_drive115_quota_refresh = true;
                refreshBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        log('[Drive115] Refresh button clicked - functionality temporarily disabled');
                    } catch (err) {
                        console.warn('[Drive115] 点击刷新配额异常：', err);
                    }
                });
            }
        } catch {}

        // 静默完成115功能初始化
    } catch (error) {
        console.error('初始化115功能失败:', error);
    }
}

// 刷新115配额UI功能已移至dashboard模块

// renderQuotaSection 已移至dashboard模块

// formatBytesSmart 已移至dashboard模块

// addDrive115ButtonToDetailPage 功能已集成到主流程

// findMagnetSection 已集成到推送按钮逻辑中

// addPushButtonsToMagnetItems 功能已集成到主流程中

/**
 * 处理推送到115网盘（新的跨域实现）- 导出供其他模块使用
 */
export async function handlePushToDrive115(
    button: HTMLButtonElement,
    videoId: string,
    magnetUrl: string,
    magnetName: string
): Promise<void> {
    // 记录将要使用的保存目录（仅 v2 有意义），需在 try/catch 之外声明避免作用域问题
    let currentWpPathId: string | undefined = undefined;
    try {
        // 检查115功能是否启用
        const enabled = await isDrive115Enabled();
        if (!enabled) {
            showToast('115网盘功能未启用，请先在设置中启用', 'error');
            return;
        }

        // 更新按钮状态
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '推送中...';
        button.className = 'button is-warning is-small drive115-push-btn';

        log(`推送磁链到115网盘: ${magnetName} (${videoId})`);

        // 根据版本选择推送方式：v2 直接调用 API；否则走跨域（v1）
        let result: { success: boolean; data?: any; error?: string };
        if (await isV2Enabled()) {
            // v2 支持一次多个URL，这里单个拼接即可
            const urls = magnetUrl; // 单条
            try {
                await addLogV2({ timestamp: Date.now(), level: 'info', message: `内容脚本：发起 v2 推送，videoId=${videoId}，name=${magnetName}，magnet=${magnetUrl}，page=${window.location.href}` });
                // 读取默认保存目录（如未设置则传 '0' 表示根目录）
                let wpPathId: string | undefined;
                try {
                    const settings: any = await getSettings();
                    const def = (settings?.drive115?.defaultWpPathId ?? '').toString().trim();
                    if (def === '') {
                        wpPathId = '0';
                    } else {
                        wpPathId = def;
                    }
                    currentWpPathId = wpPathId;
                } catch {}

                const res = await addTaskUrlsV2({ urls, wp_path_id: wpPathId });
                result = { success: res.success, data: res.data, error: res.message };
                if (res.success) {
                    const returned = Array.isArray(res.data) ? res.data.length : 0;
                    await addLogV2({ timestamp: Date.now(), level: 'info', message: `内容脚本：v2 推送成功，返回 ${returned} 项，videoId=${videoId}` });
                } else {
                    await addLogV2({ timestamp: Date.now(), level: 'error', message: `内容脚本：v2 推送失败：${res.message || '未知错误'}，videoId=${videoId}，magnet=${magnetUrl}` });
                }
            } catch (e: any) {
                result = { success: false, error: e?.message || '推送失败' };
                await addLogV2({ timestamp: Date.now(), level: 'error', message: `内容脚本：v2 推送异常：${e?.message || e || '未知异常'}，videoId=${videoId}，magnet=${magnetUrl}，page=${window.location.href}` });
            }
        } else {
            result = await pushToDrive115ViaCrossDomain({
                videoId,
                magnetUrl,
                magnetName
            });
        }

        if (result.success) {
            // 成功状态
            button.innerHTML = '推送成功';
            button.className = 'button is-success is-small drive115-push-btn';
            showToast(`${magnetName} 推送到115网盘成功`, 'success');

            // 记录推送成功日志到扩展日志系统（完全异步，不阻塞主流程）
            console.log('[JavDB Ext] 准备记录115推送成功日志');
            setTimeout(() => {
                console.log('[JavDB Ext] 开始执行日志记录');
                logToExtension('INFO', `推送成功: ${videoId}`, {
                    videoId: videoId,
                    magnetName: magnetName,
                    magnetUrl: magnetUrl,
                    // 记录保存目录（仅当 v2 且设置了 defaultWpPathId 才会有值）
                    wp_path_id: currentWpPathId,
                    timestamp: new Date().toISOString(),
                    action: 'push_success'
                }).then(() => {
                    log('115推送成功日志已记录到扩展日志系统');
                    console.log('[JavDB Ext] 115推送成功日志已记录到扩展日志系统');
                }).catch(error => {
                    console.warn('记录115推送日志失败:', error);
                    console.error('[JavDB Ext] 记录115推送日志失败:', error);
                });
            }, 100); // 100ms后执行，确保有足够时间

            // 推送成功后自动标记为已看（受设置控制）
            try {
                const settings: any = await getSettings();
                const autoMark = settings?.videoEnhancement?.autoMarkWatchedAfter115 !== false;
                if (autoMark) {
                    log('开始标记视频为已看...');
                    console.log('[JavDB Ext] 开始标记视频为已看...');
                    await markVideoAsWatched(videoId);
                    log('markVideoAsWatched函数执行完毕');
                    console.log('[JavDB Ext] markVideoAsWatched函数执行完毕');

                    // 由于markVideoAsWatched内部会刷新页面，不需要恢复按钮状态
                    return;
                }
            } catch (error) {
                console.warn('自动标记已看失败或被关闭:', error);
                console.error('[JavDB Ext] 自动标记已看失败或被关闭:', error);
                try {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    showToast(`已推送到115。自动标记已看：${errMsg || '已关闭'}`, 'info');
                } catch {}

                // 关闭或失败时，仍然恢复按钮状态
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.className = 'button is-success is-small drive115-push-btn';
                }, 3000);
            }
        } else {
            throw new Error(result.error || '推送失败');
        }
    } catch (error) {
        console.error('推送到115网盘失败:', error);

        // 记录推送失败日志到扩展日志系统（异步，不阻塞主流程）
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        logToExtension('ERROR', `推送失败: ${videoId}`, {
            videoId: videoId,
            magnetName: magnetName,
            magnetUrl: magnetUrl,
            wp_path_id: currentWpPathId,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            action: 'push_failed'
        }).then(() => {
            log('115推送失败日志已记录到扩展日志系统');
        }).catch(logError => {
            console.warn('记录115推送失败日志失败:', logError);
        });

        // 错误状态
        button.innerHTML = '推送失败';
        button.className = 'button is-danger is-small drive115-push-btn';

        showToast(`推送失败: ${errorMessage}`, 'error');

        // 3秒后恢复原状态
        setTimeout(() => {
            button.innerHTML = '&nbsp;推送115&nbsp;';
            button.disabled = false;
            button.className = 'button is-success is-small drive115-push-btn';
        }, 3000);
    }
}

/**
 * 处理批量下载（通过统一路由逐个推送）
 */
export async function handleBatchDownload(
    button: HTMLButtonElement,
    videoId: string,
    magnetLinks: Array<{ name: string; url: string }>
): Promise<void> {
    try {
        button.disabled = true;
        // 按钮原文本未使用，移除以消除警告
        button.textContent = '批量下载中...';

        const enabled = await isDrive115Enabled();
        if (!enabled) {
            showToast('115网盘功能未启用，请先在设置中启用', 'error');
            return;
        }

        let successCount = 0;
        for (const item of magnetLinks) {
            try {
                const res = await routerDownloadOffline({
                    videoId,
                    magnetUrl: item.url,
                    autoVerify: false,
                    notify: true
                });
                if (res.success) successCount++;
            } catch (e) {
                // 单条失败不阻断后续
                console.warn('批量项下载失败:', e);
            }
        }

        showToast(`批量下载完成，成功 ${successCount}/${magnetLinks.length}`, successCount > 0 ? 'success' : 'info');
        button.textContent = successCount > 0 ? '批量完成' : '批量失败';
    } catch (error) {
        console.error('批量下载失败:', error);
        showToast('批量下载失败', 'error');
        button.textContent = '批量失败';
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.textContent = '批量下载全部';
        }, 3000);
    }
}

/**
 * 标记视频为已看（公共方法）
 */
export async function markVideoAsWatched(videoId: string): Promise<void> {
    try {
        log(`开始标记视频为已看: ${videoId}`);

        // 1. 标记JavDB服务器数据为已看
        await markJavDBAsWatched();

        // 2. 更新扩展番号库数据为已看
        await updateExtensionWatchedStatus(videoId);

        log(`视频 ${videoId} 已成功标记为已看`);
        console.log(`[JavDB Ext] 视频 ${videoId} 已成功标记为已看`);

        // 标记已看成功后，延迟刷新页面让用户看到提示
        log('标记已看完成，准备刷新页面');
        console.log('[JavDB Ext] 标记已看完成，准备刷新页面');

        // 延迟3秒刷新，让用户看到推送成功的提示
        setTimeout(() => {
            try {
                console.log('[JavDB Ext] 开始刷新页面');
                window.location.reload();
            } catch (reloadError) {
                console.error('[JavDB Ext] 刷新失败，尝试其他方法:', reloadError);
                try {
                    window.location.href = window.location.href;
                } catch (hrefError) {
                    console.error('[JavDB Ext] 重新导航失败:', hrefError);
                    window.location.replace(window.location.href);
                }
            }
        }, 3000); // 3秒后刷新，给用户时间看到推送成功提示

    } catch (error) {
        console.error('标记视频为已看失败:', error);
        throw error;
    }
}

/**
 * 标记JavDB服务器数据为已看
 */
async function markJavDBAsWatched(): Promise<void> {
    try {
        // 获取当前页面的URL和CSRF token
        const currentUrl = window.location.href;
        const videoPath = window.location.pathname; // 例如: /v/bKwmOv

        // 网络联机性预检查
        if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
            throw new Error('当前网络离线，无法连接 JavDB');
        }

        // 优先判断页面状态标签
        const pageStatus = detectPageUserStatusFor115();
        if (pageStatus === 'VIEWED') {
            log('页面已存在“我看過這部影片”标签，跳过标记。');
            return;
        }

        if (pageStatus === 'WANT') {
            // 已存在“我想看”标签，需要通过编辑表单改为 watched
            const formInfo = getEditReviewFormInfo();
            if (!formInfo) {
                throw new Error('未找到编辑表单或表单信息不完整（#edit_review）');
            }

            const actionPath = formInfo.action.startsWith('http') ? formInfo.action : `https://javdb.com${formInfo.action}`;
            const token = formInfo.token || extractCSRFToken();
            if (!token) {
                throw new Error('无法获取CSRF token（编辑表单）');
            }

            const formData = new URLSearchParams({
                '_method': 'put',
                'authenticity_token': token,
                'video_review[status]': 'watched',
                'video_review[score]': '4',
                'video_review[content]': '',
                'commit': '保存'
            });

            log(`发送编辑评论（设为已看）请求到: ${actionPath}`);
            const resp = await fetchWithTimeoutRetry(actionPath, {
                method: 'POST',
                headers: {
                    'Accept': 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7,zh-HK;q=0.6',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Pragma': 'no-cache',
                    'X-CSRF-Token': token,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': currentUrl
                },
                body: formData,
                credentials: 'include'
            }, { retries: 2, timeoutMs: 8000 });

            if (!resp.ok) {
                throw new Error(`JavDB编辑评论失败: HTTP ${resp.status}`);
            }

            log('JavDB服务器编辑评论成功，状态已更新为已看');
            return;
        }

        // 默认：无标签，创建评论标记为已看
        const csrfToken = extractCSRFToken();
        if (!csrfToken) {
            throw new Error('无法获取CSRF token');
        }
        log(`提取到CSRF token: ${csrfToken.substring(0, 20)}...`);

        const reviewsUrl = `https://javdb.com${videoPath}/reviews`;
        const formData = new URLSearchParams({
            'authenticity_token': csrfToken,
            'video_review[score]': '4',
            'video_review[content]': '',
            'video_review[status]': 'watched',
            'commit': '保存'
        });
        log(`发送标记已看请求到: ${reviewsUrl}`);
        const response = await fetchWithTimeoutRetry(reviewsUrl, {
            method: 'POST',
            headers: {
                'Accept': 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7,zh-HK;q=0.6',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Pragma': 'no-cache',
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': currentUrl
            },
            body: formData,
            credentials: 'include'
        }, { retries: 2, timeoutMs: 8000 });

        if (!response.ok) {
            throw new Error(`JavDB标记已看失败: HTTP ${response.status}`);
        }

        log('JavDB服务器标记已看成功');
    } catch (error) {
        console.error('标记JavDB为已看失败:', error);
        throw error;
    }
}

/**
 * 从页面中提取CSRF token
 */
function extractCSRFToken(): string | null {
    try {
        // 方法1: 从meta标签中获取
        const metaToken = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        if (metaToken && metaToken.content) {
            return metaToken.content;
        }

        // 方法2: 从表单中获取
        const formToken = document.querySelector('input[name="authenticity_token"]') as HTMLInputElement;
        if (formToken && formToken.value) {
            return formToken.value;
        }

        // 方法3: 从页面脚本中提取
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            const content = script.textContent || '';
            const tokenMatch = content.match(/csrf-token["']\s*content=["']([^"']+)["']/);
            if (tokenMatch) {
                return tokenMatch[1];
            }
        }

        return null;
    } catch (error) {
        console.error('提取CSRF token失败:', error);
        return null;
    }
}

/**
 * 识别当前详情页中用户对该影片的账号状态（我看過/我想看）- 供115标记逻辑使用
 * 返回 'VIEWED' / 'WANT' / null
 */
function detectPageUserStatusFor115(): 'VIEWED' | 'WANT' | null {
    try {
        // 方案1：通过用户区块的链接快速判断
        const watchedAnchor = document.querySelector<HTMLAnchorElement>(
            '.review-title a[href="/users/watched_videos"], .review-title a[href*="/users/watched_videos"]'
        );
        if (watchedAnchor) {
            const text = watchedAnchor.textContent?.trim() || '';
            const tagText = watchedAnchor.querySelector('span.tag')?.textContent?.trim() || '';
            if (text.includes('我看過這部影片') || tagText.includes('我看過這部影片')) {
                return 'VIEWED';
            }
        }

        const wantAnchor = document.querySelector<HTMLAnchorElement>(
            '.review-title a[href="/users/want_watch_videos"], .review-title a[href*="/users/want_watch_videos"]'
        );
        if (wantAnchor) {
            const text = wantAnchor.textContent?.trim() || '';
            const tagText = wantAnchor.querySelector('span.tag')?.textContent?.trim() || '';
            if (text.includes('我想看這部影片') || tagText.includes('我想看這部影片')) {
                return 'WANT';
            }
        }

        // 方案2：全局兜底搜索
        const tagSpans = Array.from(document.querySelectorAll<HTMLSpanElement>('span.tag'));
        if (tagSpans.some(s => (s.textContent || '').includes('我看過這部影片'))) {
            return 'VIEWED';
        }
        if (tagSpans.some(s => (s.textContent || '').includes('我想看這部影片'))) {
            return 'WANT';
        }
    } catch {
        // 忽略识别错误
    }
    return null;
}

/**
 * 从当前页面解析 #edit_review 表单信息
 */
function getEditReviewFormInfo(): { action: string; token: string | null } | null {
    try {
        const form = document.querySelector<HTMLFormElement>('#edit_review');
        if (!form) return null;
        const action = form.getAttribute('action') || '';
        if (!action) return null;
        const tokenInput = form.querySelector<HTMLInputElement>('input[name="authenticity_token"]');
        const token = tokenInput?.value || null;
        return { action, token };
    } catch (e) {
        return null;
    }
}

/**
 * 更新扩展番号库数据为已看
 */
async function updateExtensionWatchedStatus(videoId: string): Promise<void> {
    try {
        log(`更新扩展番号库状态: ${videoId}`);

        // 发送消息到background script更新状态
        const response = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('更新状态请求超时'));
            }, 5000);

            chrome.runtime.sendMessage({
                type: 'UPDATE_WATCHED_STATUS',
                videoId: videoId,
                status: 'watched'
            }, (response) => {
                clearTimeout(timeout);

                if (chrome.runtime.lastError) {
                    reject(new Error(`Chrome runtime错误: ${chrome.runtime.lastError.message}`));
                    return;
                }

                resolve(response);
            });
        });

        if (response && response.success) {
            log('扩展番号库状态更新成功');
        } else {
            throw new Error(response?.error || '更新扩展状态失败');
        }
    } catch (error) {
        console.error('更新扩展番号库状态失败:', error);
        throw error;
    }
}

/**
 * 通过跨域消息推送到115网盘（公共方法）
 */
export async function pushToDrive115ViaCrossDomain(params: {
    videoId: string;
    magnetUrl: string;
    magnetName: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
        const requestId = `drive115_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        log(`开始跨域推送，请求ID: ${requestId}`);

        // 发送消息到115.com页面
        chrome.runtime.sendMessage({
            type: 'DRIVE115_PUSH',
            videoId: params.videoId,
            magnetUrl: params.magnetUrl,
            magnetName: params.magnetName,
            requestId
        }, (response) => {
            log(`收到响应:`, response);
            log(`Chrome runtime lastError:`, chrome.runtime.lastError);

            if (chrome.runtime.lastError) {
                log(`Chrome runtime错误: ${chrome.runtime.lastError.message}`);
                resolve({
                    success: false,
                    error: `Chrome runtime错误: ${chrome.runtime.lastError.message}`
                });
                return;
            }

            if (!response) {
                log('没有收到任何响应');
                resolve({
                    success: false,
                    error: '没有收到115网盘的响应，请确保已登录115网盘并打开115.com页面'
                });
                return;
            }

            log(`响应类型: ${response.type}, 请求ID匹配: ${response.requestId === requestId}`);

            if (response.type === 'DRIVE115_PUSH_RESPONSE' && response.requestId === requestId) {
                resolve({
                    success: response.success,
                    data: response.data,
                    error: response.error
                });
            } else {
                resolve({
                    success: false,
                    error: `收到无效的响应: ${JSON.stringify(response)}`
                });
            }
        });

        // 30秒超时
        setTimeout(() => {
            log('推送请求超时');
            resolve({
                success: false,
                error: '推送超时，请检查网络连接或115网盘登录状态'
            });
        }, 30000);
    });
}



// renderDrive115Buttons 已优化为按钮直接添加模式

// addDrive115Styles 已集成到主样式系统



// bindDrive115Events 已集成到按钮创建逻辑中

// handleSingleDownload 功能已集成到主流程中



// extractVideoIdFromElement 已集成到videoId模块
