/**
 * 115网盘内容脚本集成
 */

import { getDrive115Service } from '../services/drive115';
import { extractVideoIdFromPage } from './videoId';
import { showToast } from './toast';
import { log } from './state';

/**
 * 初始化115功能
 */
export async function initDrive115Features(): Promise<void> {
    try {
        const drive115Service = getDrive115Service();
        
        // 检查是否启用115功能
        if (!drive115Service.isEnabled()) {
            log('115功能未启用，跳过初始化');
            return;
        }

        log('初始化115功能...');

        // 在详情页添加115按钮
        if (window.location.pathname.startsWith('/v/')) {
            await addDrive115ButtonToDetailPage();
        }

        // 在列表页添加115按钮
        if (isListPage()) {
            await addDrive115ButtonsToListPage();
        }

        log('115功能初始化完成');
    } catch (error) {
        console.error('初始化115功能失败:', error);
    }
}

/**
 * 检查是否为列表页
 */
function isListPage(): boolean {
    return !!(
        document.querySelector('.movie-list') ||
        document.querySelector('.grid') ||
        document.querySelector('.item')
    );
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

    // 创建115按钮容器
    const drive115Container = createDrive115Container();
    
    // 添加到磁链区域后面
    magnetSection.parentNode?.insertBefore(drive115Container, magnetSection.nextSibling);

    // 获取磁链列表
    const magnetLinks = getMagnetLinksFromPage();
    if (magnetLinks.length === 0) {
        drive115Container.innerHTML = `
            <div class="drive115-section">
                <h3>115网盘离线下载</h3>
                <div class="drive115-no-magnets">未找到磁链</div>
            </div>
        `;
        return;
    }

    // 渲染115按钮
    renderDrive115Buttons(drive115Container, videoId, magnetLinks);
}

/**
 * 在列表页添加115按钮
 */
async function addDrive115ButtonsToListPage(): Promise<void> {
    const movieItems = document.querySelectorAll('.movie-list .item, .grid .item');
    
    for (const item of movieItems) {
        const videoId = extractVideoIdFromElement(item as HTMLElement);
        if (videoId) {
            addDrive115ButtonToListItem(item as HTMLElement, videoId);
        }
    }
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
    for (const element of allElements) {
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
    
    for (const link of links) {
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
 * 渲染115按钮
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
        .drive115-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
        }
        
        .drive115-magnet-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .drive115-magnet-item:last-child {
            border-bottom: none;
        }
        
        .magnet-name {
            flex: 1;
            margin-right: 10px;
            font-size: 14px;
            color: #555;
        }
        
        .drive115-download-btn, .drive115-batch-download-btn {
            padding: 6px 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s;
        }
        
        .drive115-download-btn:hover, .drive115-batch-download-btn:hover {
            background-color: #0056b3;
        }
        
        .drive115-download-btn:disabled, .drive115-batch-download-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        
        .drive115-batch-actions {
            margin-top: 15px;
            text-align: center;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        
        .drive115-no-magnets {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
        }
        
        .drive115-list-btn {
            padding: 4px 8px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            margin-left: 5px;
        }
        
        .drive115-list-btn:hover {
            background-color: #1e7e34;
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * 绑定115事件
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
 * 处理批量下载
 */
async function handleBatchDownload(
    button: HTMLButtonElement, 
    videoId: string, 
    magnetLinks: Array<{ name: string; url: string }>
): Promise<void> {
    try {
        button.disabled = true;
        button.textContent = '批量下载中...';

        const drive115Service = getDrive115Service();
        const tasks = magnetLinks.map(magnet => ({
            videoId,
            magnetUrl: magnet.url
        }));

        const result = await drive115Service.downloadBatch({
            tasks,
            autoVerify: true,
            notify: true
        });

        button.textContent = '批量完成';
        button.style.backgroundColor = '#28a745';
        
        showToast(
            `批量下载完成: 成功 ${result.successCount}/${result.totalTasks}`, 
            result.successCount > 0 ? 'success' : 'warning'
        );
    } catch (error) {
        console.error('115批量下载失败:', error);
        button.textContent = '批量失败';
        button.style.backgroundColor = '#dc3545';
        showToast(`批量下载失败: ${error}`, 'error');
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.textContent = '批量下载全部';
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

/**
 * 为列表项添加115按钮
 */
function addDrive115ButtonToListItem(item: HTMLElement, videoId: string): void {
    // 检查是否已经添加过按钮
    if (item.querySelector('.drive115-list-btn')) {
        return;
    }

    // 创建按钮
    const button = document.createElement('button');
    button.className = 'drive115-list-btn';
    button.textContent = '115';
    button.title = '115离线下载';
    
    // 添加到合适的位置
    const titleElement = item.querySelector('.title, .movie-title, h3, h4');
    if (titleElement) {
        titleElement.appendChild(button);
    } else {
        item.appendChild(button);
    }

    // 绑定点击事件
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 跳转到详情页，让用户选择磁链
        const detailLink = item.querySelector('a[href*="/v/"]') as HTMLAnchorElement;
        if (detailLink) {
            window.open(detailLink.href, '_blank');
        } else {
            showToast('无法找到详情页链接', 'error');
        }
    });
}
