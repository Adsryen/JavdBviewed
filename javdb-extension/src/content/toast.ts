// src/content/toast.ts

import { TOAST_CONFIG } from './state';

// --- Toast Message System ---

function loadFontAwesome(): void {
    // 检查是否已经加载了Font Awesome
    if (document.querySelector('link[href*="font-awesome"]') || document.querySelector('link[href*="fontawesome"]')) {
        return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
}

function createToastContainer(): HTMLElement {
    let container = document.getElementById('javdb-ext-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'javdb-ext-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: ${TOAST_CONFIG.Z_INDEX};
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column-reverse;
            align-items: flex-end;
            gap: 8px;
        `;
        document.body.appendChild(container);
    }
    return container;
}

export function showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    // 确保Font Awesome已加载
    loadFontAwesome();

    const container = createToastContainer();

    // 限制最大消息数量
    while (container.children.length >= TOAST_CONFIG.MAX_MESSAGES) {
        const lastChild = container.lastChild as HTMLElement;
        if (lastChild) {
            fadeOutToast(lastChild);
        }
    }

    const toast = document.createElement('div');

    // 根据类型设置渐变背景
    let backgroundGradient: string;
    let iconClass: string;

    switch (type) {
        case 'success':
            backgroundGradient = 'linear-gradient(to right, #2a9d8f, #4CAF50)';
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            backgroundGradient = 'linear-gradient(to right, #e76f51, #d90429)';
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'info':
        default:
            backgroundGradient = 'linear-gradient(to right, #2a9d8f, #264653)';
            iconClass = 'fas fa-info-circle';
            break;
    }

    toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 22px;
        border-radius: 10px;
        background: ${backgroundGradient};
        color: #fff;
        font-family: "Microsoft YaHei", "Segoe UI", Roboto, sans-serif;
        font-size: 15px;
        font-weight: 500;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        min-width: 280px;
        max-width: 350px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        word-wrap: break-word;
    `;

    // 创建图标元素
    const icon = document.createElement('i');
    icon.className = iconClass;
    icon.style.cssText = `
        font-size: 22px;
        line-height: 1;
        flex-shrink: 0;
    `;

    // 创建文本元素
    const textElement = document.createElement('span');
    textElement.textContent = message;

    // 组装toast
    toast.appendChild(icon);
    toast.appendChild(textElement);
    container.appendChild(toast);

    // 触发动画
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // 自动消失
    setTimeout(() => {
        fadeOutToast(toast);
    }, TOAST_CONFIG.DISPLAY_DURATION);
}

function fadeOutToast(toast: HTMLElement): void {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, TOAST_CONFIG.FADE_DURATION);
}
