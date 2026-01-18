/**
 * Cloudflare 人机验证处理模块
 */

import { logAsync } from '../logger';
import { showMessage } from '../ui/toast';

export interface VerificationResult {
    success: boolean;
    error?: string;
    html?: string;
}

/**
 * 检测响应是否为 Cloudflare 验证页面
 * 使用与sync.ts相同的严格检测逻辑
 */
export function isCloudflareChallenge(html: string, title?: string): boolean {
    // 检测标题（可选参数）
    if (title && title.includes('Security Verification')) {
        // 但还需要进一步检查内容
    }
    
    // 更严格的检测：必须同时满足多个条件
    const hasSecurityVerification = html.includes('Security Verification');
    const hasCompleteSecurityCheck = html.includes('Please complete the security check');
    const hasChallengeForm = html.includes('cf-challenge') || html.includes('cf_chl_opt');
    
    // 检查是否有正常的JavDB内容
    const hasNormalContent = html.includes('video-meta') || 
                            html.includes('movie-list') || 
                            html.includes('video-detail') ||
                            html.includes('panel-block');
    
    // 如果有正常内容，即使有验证关键词也不算验证页面（可能是缓存的文本）
    if (hasNormalContent) {
        return false;
    }
    
    // 必须同时有验证标题和验证表单才算验证页面
    return (hasSecurityVerification || hasCompleteSecurityCheck) && hasChallengeForm;
}

/**
 * 显示验证窗口并等待用户完成验证
 */
export async function handleCloudflareVerification(url: string): Promise<VerificationResult> {
    logAsync('INFO', 'Cloudflare 验证触发', { url });
    
    return new Promise((resolve) => {
        // 使用新标签页打开验证页面
        chrome.tabs.create({ url, active: true }, (tab) => {
            if (!tab || !tab.id) {
                resolve({ success: false, error: '无法打开验证页面' });
                return;
            }
            
            const tabId = tab.id;
            logAsync('INFO', 'Cloudflare 验证标签页已打开', { tabId, url });
            
            // 创建提示模态窗口
            const modal = createVerificationPromptModal(tabId, (result) => {
                resolve(result);
            });
            
            document.body.appendChild(modal);
        });
    });
}

/**
 * 创建验证提示模态窗口（监控新标签页）
 */
function createVerificationPromptModal(tabId: number, onComplete: (result: VerificationResult) => void): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'cloudflare-verification-modal';
    modal.innerHTML = `
        <div class="verification-overlay"></div>
        <div class="verification-content verification-prompt">
            <div class="verification-header">
                <h3><i class="fas fa-shield-alt"></i> 需要人机验证</h3>
                <button class="verification-close" title="取消验证">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="verification-body">
                <div class="verification-info">
                    <div class="verification-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <p class="verification-main-text">检测到 Cloudflare 人机验证</p>
                    <p class="verification-sub-text">已在新标签页中打开验证页面，请完成验证。</p>
                    <p class="verification-sub-text" style="color: #e67e22; font-weight: 500; margin-top: 12px;">
                        ⚠️ 重要提示：<br>
                        1. 完成验证后，请等待页面完全加载<br>
                        2. 确认看到正常内容后，点击"验证完成"<br>
                        3. 不要手动关闭验证标签页
                    </p>
                </div>
                <div class="verification-status">
                    <span class="status-text">等待验证中...</span>
                    <div class="status-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            </div>
            <div class="verification-footer">
                <button class="verification-cancel-btn">取消同步</button>
                <button class="verification-complete-btn">验证完成</button>
            </div>
        </div>
    `;

    const closeBtn = modal.querySelector('.verification-close') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('.verification-cancel-btn') as HTMLButtonElement;
    const completeBtn = modal.querySelector('.verification-complete-btn') as HTMLButtonElement;
    const statusText = modal.querySelector('.status-text') as HTMLSpanElement;
    const statusSpinner = modal.querySelector('.status-spinner') as HTMLElement;

    let checkInterval: number | null = null;
    let isVerified = false;
    let tabClosed = false;

    // 监听标签页关闭
    const tabRemovedListener = (closedTabId: number) => {
        if (closedTabId === tabId) {
            tabClosed = true;
            logAsync('INFO', 'Cloudflare 验证标签页已关闭', { tabId });
        }
    };
    chrome.tabs.onRemoved.addListener(tabRemovedListener);

    // 开始检查验证状态（通过标签页标题）
    const startChecking = () => {
        if (checkInterval) {
            clearInterval(checkInterval);
        }

        checkInterval = window.setInterval(() => {
            if (tabClosed) {
                // 标签页被关闭，可能验证完成
                return;
            }

            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError || !tab) {
                    tabClosed = true;
                    return;
                }

                const title = tab.title || '';
                logAsync('DEBUG', 'Cloudflare 验证标签页检查', { 
                    tabId,
                    title,
                    url: tab.url
                });

                // 检查标题是否不再包含 Security Verification
                if (title && !title.includes('Security Verification')) {
                    // 验证可能完成
                    isVerified = true;
                    statusText.textContent = '检测到验证完成';
                    statusSpinner.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i>';
                    completeBtn.classList.add('verification-btn-highlight');
                }
            });
        }, 1500);
    };

    // 清理函数
    const cleanup = () => {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        chrome.tabs.onRemoved.removeListener(tabRemovedListener);
        
        // 关闭验证标签页（如果还存在）
        if (!tabClosed) {
            chrome.tabs.remove(tabId).catch((err) => {
                console.log('Tab already closed or error:', err);
            });
        }
        
        modal.remove();
    };

    // 取消按钮
    const handleCancel = () => {
        logAsync('INFO', 'Cloudflare 验证被用户取消');
        cleanup();
        onComplete({ success: false, error: '用户取消验证' });
    };

    // 验证完成按钮
    const handleComplete = async () => {
        logAsync('INFO', 'Cloudflare 验证完成确认，开始获取页面内容');
        
        try {
            // 等待一下，确保页面完全加载
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 在验证标签页中获取HTML内容
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => document.documentElement.outerHTML
            });
            
            if (!results || results.length === 0 || !results[0].result) {
                throw new Error('无法获取页面内容');
            }
            
            const html = results[0].result as string;
            logAsync('INFO', `成功获取页面内容，${html.length} 字节`);
            
            // 再次检查是否还是验证页面
            const hasSecurityVerification = html.includes('Security Verification');
            const hasCompleteSecurityCheck = html.includes('Please complete the security check');
            const hasChallengeForm = html.includes('cf-challenge') || html.includes('cf_chl_opt');
            const hasNormalContent = html.includes('video-meta') || 
                                    html.includes('movie-list') || 
                                    html.includes('video-detail') ||
                                    html.includes('panel-block');
            
            if (!hasNormalContent && (hasSecurityVerification || hasCompleteSecurityCheck) && hasChallengeForm) {
                logAsync('WARN', '获取的页面仍然是验证页面');
                showMessage('页面尚未完全加载，请等待页面加载完成后再点击"验证完成"', 'warning');
                return; // 不关闭模态框，让用户重试
            }
            
            // 关闭标签页
            if (!tabClosed) {
                chrome.tabs.remove(tabId).catch((err) => {
                    console.log('Tab close error:', err);
                });
            }
            
            // 显示成功提示
            showMessage('人机验证完成，正在继续操作...', 'success');
            
            // 清理并返回成功（包含HTML）
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
            }
            chrome.tabs.onRemoved.removeListener(tabRemovedListener);
            modal.remove();
            
            onComplete({ success: true, html: html });
        } catch (error: any) {
            logAsync('ERROR', '获取页面内容失败', { error: error.message });
            showMessage('获取页面内容失败，请重试', 'error');
            // 不调用 onComplete，让用户可以重试
        }
    };

    closeBtn.addEventListener('click', handleCancel);
    cancelBtn.addEventListener('click', handleCancel);
    completeBtn.addEventListener('click', handleComplete);

    // 开始检查
    startChecking();

    // ESC 键取消
    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isVerified) {
            handleCancel();
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);

    return modal;
}
