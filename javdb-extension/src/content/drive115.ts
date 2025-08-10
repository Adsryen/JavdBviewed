/**
 * 115网盘内容脚本集成
 */

import { getDrive115Service } from '../services/drive115';
import { extractVideoIdFromPage } from './videoId';
import { showToast } from './toast';
import { log } from './state';

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
        // 静默初始化115功能

        // 首先初始化115服务（加载设置）
        const drive115Service = getDrive115Service();
        await drive115Service.initialize();

        // 检查是否启用115功能
        if (!drive115Service.isEnabled()) {
            return;
        }

        // 在详情页添加115按钮
        if (window.location.pathname.startsWith('/v/')) {
            await addDrive115ButtonToDetailPage();
        }

        // 静默完成115功能初始化
    } catch (error) {
        console.error('初始化115功能失败:', error);
    }
}



/**
 * 在详情页添加115按钮
 */
async function addDrive115ButtonToDetailPage(): Promise<void> {
    const videoId = extractVideoIdFromPage();
    if (!videoId) {
        log('无法获取视频ID，跳过添加115按钮');
        return;
    }

    // 查找磁链区域
    const magnetSection = findMagnetSection();
    if (!magnetSection) {
        log('未找到磁链区域，跳过添加115按钮');
        return;
    }

    // 为每个磁力链接添加"推送115"按钮
    addPushButtonsToMagnetItems(videoId);
}



/**
 * 查找磁链区域
 */
function findMagnetSection(): HTMLElement | null {
    // 尝试多种选择器
    const selectors = [
        '.magnet-links',
        '.torrents',
        '.download-links',
        '[class*="magnet"]',
        '[class*="torrent"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
            return element;
        }
    }

    // 如果没找到专门的磁链区域，查找包含磁链的区域
    const allElements = document.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element.textContent?.includes('magnet:') || element.innerHTML?.includes('magnet:')) {
            return element as HTMLElement;
        }
    }

    return null;
}

/**
 * 创建115容器
 */
function createDrive115Container(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'drive115-container';
    container.style.cssText = `
        margin: 20px 0;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background-color: #f9f9f9;
    `;
    return container;
}

/**
 * 从页面获取磁链
 */
function getMagnetLinksFromPage(): Array<{ name: string; url: string }> {
    const magnetLinks: Array<{ name: string; url: string }> = [];
    
    // 查找所有磁链
    const links = document.querySelectorAll('a[href^="magnet:"]');

    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const href = link.getAttribute('href');
        if (href) {
            magnetLinks.push({
                name: link.textContent?.trim() || '未知磁链',
                url: href
            });
        }
    }

    // 如果没找到链接，尝试从文本中提取
    if (magnetLinks.length === 0) {
        const magnetRegex = /magnet:\?xt=urn:btih:[a-fA-F0-9]{40}[^\s]*/g;
        const pageText = document.body.innerHTML;
        const matches = pageText.match(magnetRegex);
        
        if (matches) {
            matches.forEach((match, index) => {
                magnetLinks.push({
                    name: `磁链 ${index + 1}`,
                    url: match
                });
            });
        }
    }

    return magnetLinks;
}

/**
 * 为磁力链接添加"推送115"按钮
 */
function addPushButtonsToMagnetItems(videoId: string): void {
    // 查找所有磁力链接项
    const magnetItems = document.querySelectorAll('#magnets-content .item');

    magnetItems.forEach((item, index) => {
        // 检查是否已经添加过按钮
        if (item.querySelector('.drive115-push-btn')) {
            return;
        }

        // 获取磁力链接
        const magnetLink = item.querySelector('a[href^="magnet:"]') as HTMLAnchorElement;
        if (!magnetLink) {
            return;
        }

        const magnetUrl = magnetLink.href;
        const magnetName = magnetLink.querySelector('.name')?.textContent?.trim() || `磁链 ${index + 1}`;

        // 查找按钮容器
        const buttonsContainer = item.querySelector('.buttons');
        if (!buttonsContainer) {
            return;
        }

        // 创建"推送115"按钮
        const pushButton = document.createElement('button');
        pushButton.className = 'button is-success is-small drive115-push-btn';
        pushButton.innerHTML = '&nbsp;推送115&nbsp;';
        pushButton.title = '推送到115网盘离线下载';
        pushButton.style.marginLeft = '5px';

        // 添加按钮到容器
        buttonsContainer.appendChild(pushButton);

        // 绑定点击事件
        pushButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await handlePushToDrive115(pushButton, videoId, magnetUrl, magnetName);
        });
    });
}

/**
 * 处理推送到115网盘（新的跨域实现）- 导出供其他模块使用
 */
export async function handlePushToDrive115(
    button: HTMLButtonElement,
    videoId: string,
    magnetUrl: string,
    magnetName: string
): Promise<void> {
    try {
        // 检查115功能是否启用
        const drive115Service = getDrive115Service();
        if (!drive115Service.isEnabled()) {
            showToast('115网盘功能未启用，请先在设置中启用', 'error');
            return;
        }

        // 更新按钮状态
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '推送中...';
        button.className = 'button is-warning is-small drive115-push-btn';

        log(`推送磁链到115网盘: ${magnetName} (${videoId})`);

        // 使用新的跨域推送方法
        const result = await pushToDrive115ViaCrossDomain({
            videoId,
            magnetUrl,
            magnetName
        });

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

            // 推送成功后自动标记为已看
            try {
                log('开始标记视频为已看...');
                console.log('[JavDB Ext] 开始标记视频为已看...');
                await markVideoAsWatched(videoId);
                log('markVideoAsWatched函数执行完毕');
                console.log('[JavDB Ext] markVideoAsWatched函数执行完毕');

                // 由于markVideoAsWatched内部会刷新页面，不需要恢复按钮状态
                return;

            } catch (error) {
                console.warn('自动标记已看失败:', error);
                console.error('[JavDB Ext] 自动标记已看失败:', error);

                // 标记已看失败时，仍然恢复按钮状态
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

        // 从页面中提取CSRF token
        const csrfToken = extractCSRFToken();
        if (!csrfToken) {
            throw new Error('无法获取CSRF token');
        }

        log(`提取到CSRF token: ${csrfToken.substring(0, 20)}...`);

        // 构建reviews URL
        const reviewsUrl = `https://javdb.com${videoPath}/reviews`;

        // 准备请求数据
        const formData = new URLSearchParams({
            'authenticity_token': csrfToken,
            'video_review[score]': '4',
            'video_review[content]': '',
            'video_review[status]': 'watched',
            'commit': '保存'
        });

        log(`发送标记已看请求到: ${reviewsUrl}`);

        // 发送请求
        const response = await fetch(reviewsUrl, {
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
        });

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



/**
 * 渲染115按钮（保留原有功能）
 */
function renderDrive115Buttons(
    container: HTMLElement,
    videoId: string,
    magnetLinks: Array<{ name: string; url: string }>
): void {
    container.innerHTML = `
        <div class="drive115-section">
            <h3>115网盘离线下载</h3>
            <div class="drive115-buttons">
                ${magnetLinks.map((magnet, index) => `
                    <div class="drive115-magnet-item">
                        <span class="magnet-name">${magnet.name}</span>
                        <button class="drive115-download-btn" data-video-id="${videoId}" data-magnet-url="${magnet.url}">
                            离线下载
                        </button>
                    </div>
                `).join('')}
                ${magnetLinks.length > 1 ? `
                    <div class="drive115-batch-actions">
                        <button class="drive115-batch-download-btn" data-video-id="${videoId}">
                            批量下载全部
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // 添加样式
    addDrive115Styles();

    // 绑定事件
    bindDrive115Events(container, videoId, magnetLinks);
}

/**
 * 添加115样式
 */
function addDrive115Styles(): void {
    if (document.getElementById('drive115-styles')) {
        return; // 已经添加过了
    }

    const style = document.createElement('style');
    style.id = 'drive115-styles';
    style.textContent = `
        /* 推送115按钮样式 */
        .drive115-push-btn {
            transition: all 0.2s ease !important;
        }

        .drive115-push-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .drive115-push-btn:disabled {
            transform: none !important;
            box-shadow: none !important;
        }

        /* 确保按钮在磁力链接项中正确显示 */
        #magnets-content .item .buttons {
            display: flex;
            align-items: center;
            gap: 5px;
        }
    `;
    
    document.head.appendChild(style);
}



/**
 * 绑定115事件（保留原有功能）
 */
function bindDrive115Events(
    container: HTMLElement,
    videoId: string,
    magnetLinks: Array<{ name: string; url: string }>
): void {
    // 单个下载按钮
    const downloadBtns = container.querySelectorAll('.drive115-download-btn');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const target = e.target as HTMLButtonElement;
            const magnetUrl = target.getAttribute('data-magnet-url');
            
            if (magnetUrl) {
                await handleSingleDownload(target, videoId, magnetUrl);
            }
        });
    });

    // 批量下载按钮
    const batchBtn = container.querySelector('.drive115-batch-download-btn');
    if (batchBtn) {
        batchBtn.addEventListener('click', async (e) => {
            const target = e.target as HTMLButtonElement;
            await handleBatchDownload(target, videoId, magnetLinks);
        });
    }
}

/**
 * 处理单个下载
 */
async function handleSingleDownload(
    button: HTMLButtonElement, 
    videoId: string, 
    magnetUrl: string
): Promise<void> {
    try {
        button.disabled = true;
        button.textContent = '下载中...';

        const drive115Service = getDrive115Service();
        const result = await drive115Service.downloadOffline({
            videoId,
            magnetUrl,
            autoVerify: true,
            notify: true
        });

        if (result.success) {
            button.textContent = '下载成功';
            button.style.backgroundColor = '#28a745';
            showToast(`${videoId} 离线下载成功`, 'success');
            
            if (result.verificationResult?.verified) {
                showToast(`找到 ${result.verificationResult.foundFiles?.length || 0} 个文件`, 'info');
            }
        } else {
            throw new Error(result.error || '下载失败');
        }
    } catch (error) {
        console.error('115下载失败:', error);
        button.textContent = '下载失败';
        button.style.backgroundColor = '#dc3545';
        showToast(`${videoId} 离线下载失败: ${error}`, 'error');
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.textContent = '离线下载';
            button.style.backgroundColor = '#007bff';
        }, 3000);
    }
}



/**
 * 从元素中提取视频ID
 */
function extractVideoIdFromElement(element: HTMLElement): string | null {
    // 尝试从链接中提取
    const link = element.querySelector('a[href*="/v/"]') as HTMLAnchorElement;
    if (link) {
        const match = link.href.match(/\/v\/([^/?]+)/);
        if (match) {
            return match[1];
        }
    }

    // 尝试从文本中提取
    const text = element.textContent || '';
    const codeMatch = text.match(/[A-Z]+-\d+/);
    if (codeMatch) {
        return codeMatch[0];
    }

    return null;
}




