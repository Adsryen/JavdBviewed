// src/components/ActorAvatar.ts
// 演员头像加载组件

import { globalCache } from '../utils/cache';

export interface ActorAvatarOptions {
    size?: 'small' | 'medium' | 'large'; // 头像尺寸
    lazy?: boolean; // 是否懒加载
    fallback?: string; // 自定义默认头像
    className?: string; // 自定义CSS类
    onClick?: (actorId: string) => void; // 点击回调
}

export class ActorAvatar {
    private static readonly DEFAULT_AVATARS = {
        female: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNGRkI2QzEiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEyIDUyQzEyIDQyLjA1ODkgMjAuMDU4OSAzNCAzMCAzNEgzNEM0My45NDExIDM0IDUyIDQyLjA1ODkgNTIgNTJWNjRIMTJWNTJaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
        male: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM5M0M1RkQiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEyIDUyQzEyIDQyLjA1ODkgMjAuMDU4OSAzNCAzMCAzNEgzNEM0My45NDExIDM0IDUyIDQyLjA1ODkgNTIgNTJWNjRIMTJWNTJaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
        unknown: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM5Q0E0QUYiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEyIDUyQzEyIDQyLjA1ODkgMjAuMDU4OSAzNCAzMCAzNEgzNEM0My45NDExIDM0IDUyIDQyLjA1ODkgNTIgNTJWNjRIMTJWNTJaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo='
    };

    private static readonly SIZE_CLASSES = {
        small: 'actor-avatar-small',
        medium: 'actor-avatar-medium', 
        large: 'actor-avatar-large'
    };

    private element: HTMLElement;
    private img: HTMLImageElement;
    private actorId: string;
    private options: ActorAvatarOptions;
    private isLoaded = false;
    private observer?: IntersectionObserver;

    constructor(
        actorId: string,
        avatarUrl: string | undefined,
        gender: 'female' | 'male' | 'unknown',
        options: ActorAvatarOptions = {}
    ) {
        this.actorId = actorId;
        this.options = {
            size: 'medium',
            lazy: true,
            ...options
        };

        this.element = this.createElement();
        this.img = this.createImageElement();
        this.element.appendChild(this.img);

        // 设置默认头像
        this.setDefaultAvatar(gender);

        // 如果有头像URL，尝试加载
        if (avatarUrl) {
            if (this.options.lazy) {
                this.setupLazyLoading(avatarUrl);
            } else {
                this.loadAvatar(avatarUrl);
            }
        }
    }

    /**
     * 创建容器元素
     */
    private createElement(): HTMLElement {
        const element = document.createElement('div');
        element.className = `actor-avatar ${ActorAvatar.SIZE_CLASSES[this.options.size!]}`;
        
        if (this.options.className) {
            element.className += ` ${this.options.className}`;
        }

        // 添加点击事件
        if (this.options.onClick) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => {
                this.options.onClick!(this.actorId);
            });
        }

        return element;
    }

    /**
     * 创建图片元素
     */
    private createImageElement(): HTMLImageElement {
        const img = document.createElement('img');
        img.className = 'actor-avatar-img';
        img.alt = `演员头像`;
        img.loading = 'lazy';
        
        // 添加错误处理
        img.addEventListener('error', () => {
            this.handleImageError();
        });

        img.addEventListener('load', () => {
            this.handleImageLoad();
        });

        return img;
    }

    /**
     * 设置默认头像
     */
    private setDefaultAvatar(gender: 'female' | 'male' | 'unknown'): void {
        const defaultAvatar = this.options.fallback || ActorAvatar.DEFAULT_AVATARS[gender];
        this.img.src = defaultAvatar;
        this.element.classList.add('actor-avatar-default');
    }

    /**
     * 设置懒加载
     */
    private setupLazyLoading(avatarUrl: string): void {
        if (!('IntersectionObserver' in window)) {
            // 不支持IntersectionObserver，直接加载
            this.loadAvatar(avatarUrl);
            return;
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.isLoaded) {
                        this.loadAvatar(avatarUrl);
                        this.observer?.unobserve(this.element);
                    }
                });
            },
            {
                rootMargin: '50px' // 提前50px开始加载
            }
        );

        this.observer.observe(this.element);
    }

    /**
     * 加载头像
     */
    private async loadAvatar(avatarUrl: string): Promise<void> {
        if (this.isLoaded) return;

        try {
            // 添加加载状态
            this.element.classList.add('actor-avatar-loading');
            console.log(`Loading avatar for ${this.actorId}: ${avatarUrl}`);

            // 尝试从缓存获取
            const cachedUrl = await this.getCachedImage(avatarUrl);
            if (cachedUrl) {
                console.log(`Using cached avatar for ${this.actorId}`);
                this.img.src = cachedUrl;
                return;
            }

            // 尝试多种加载方式
            let success = false;

            // 方式1: 直接加载（不设置crossOrigin）
            try {
                await this.tryLoadImage(avatarUrl, false);
                success = true;
                console.log(`Direct load success for ${this.actorId}`);
            } catch (error) {
                console.log(`Direct load failed for ${this.actorId}:`, error);
            }

            // 方式2: 如果直接加载失败，尝试设置crossOrigin
            if (!success) {
                try {
                    await this.tryLoadImage(avatarUrl, true);
                    success = true;
                    console.log(`CORS load success for ${this.actorId}`);
                } catch (error) {
                    console.log(`CORS load failed for ${this.actorId}:`, error);
                }
            }

            if (success) {
                // 缓存图片
                try {
                    const tempImg = new Image();
                    tempImg.src = avatarUrl;
                    await this.cacheImage(avatarUrl, tempImg);
                } catch (cacheError) {
                    console.warn(`Failed to cache avatar for ${this.actorId}:`, cacheError);
                }

                // 设置图片
                this.img.src = avatarUrl;
            } else {
                throw new Error('All loading methods failed');
            }

        } catch (error) {
            console.warn(`Failed to load actor avatar for ${this.actorId}:`, error);
            this.handleImageError();
        }
    }

    /**
     * 尝试加载图片
     */
    private async tryLoadImage(url: string, useCors: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const tempImg = new Image();
            if (useCors) {
                tempImg.crossOrigin = 'anonymous';
            }

            tempImg.onload = () => resolve();
            tempImg.onerror = () => reject(new Error(`Image load failed (CORS: ${useCors})`));

            // 设置超时
            setTimeout(() => {
                reject(new Error(`Image load timeout (CORS: ${useCors})`));
            }, 5000);

            tempImg.src = url;
        });
    }

    /**
     * 处理图片加载成功
     */
    private handleImageLoad(): void {
        this.isLoaded = true;
        this.element.classList.remove('actor-avatar-loading', 'actor-avatar-default');
        this.element.classList.add('actor-avatar-loaded');
    }

    /**
     * 处理图片加载失败
     */
    private handleImageError(): void {
        this.element.classList.remove('actor-avatar-loading');
        this.element.classList.add('actor-avatar-error');

        console.log(`Avatar load failed for ${this.actorId}, keeping default avatar`);

        // 保持默认头像，不需要额外操作
        // 默认头像已经在构造函数中设置了
    }

    /**
     * 从缓存获取图片
     */
    private async getCachedImage(url: string): Promise<string | null> {
        try {
            const cached = await globalCache.get(`actor_avatar_${url}`);
            return cached as string || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 缓存图片
     */
    private async cacheImage(url: string, img: HTMLImageElement): Promise<void> {
        try {
            // 将图片转换为base64并缓存
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            await globalCache.set(`actor_avatar_${url}`, dataUrl, 7 * 24 * 60 * 60 * 1000); // 缓存7天
        } catch (error) {
            // 缓存失败不影响显示
            console.warn('Failed to cache actor avatar:', error);
        }
    }

    /**
     * 更新头像URL
     */
    updateAvatar(
        avatarUrl: string | undefined, 
        gender: 'female' | 'male' | 'unknown'
    ): void {
        this.isLoaded = false;
        this.element.classList.remove('actor-avatar-loaded', 'actor-avatar-error');
        
        // 重置为默认头像
        this.setDefaultAvatar(gender);

        // 加载新头像
        if (avatarUrl) {
            if (this.options.lazy && this.observer) {
                this.setupLazyLoading(avatarUrl);
            } else {
                this.loadAvatar(avatarUrl);
            }
        }
    }

    /**
     * 获取DOM元素
     */
    getElement(): HTMLElement {
        return this.element;
    }

    /**
     * 销毁组件
     */
    destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    /**
     * 静态方法：创建头像元素
     */
    static create(
        actorId: string,
        avatarUrl: string | undefined,
        gender: 'female' | 'male' | 'unknown',
        options: ActorAvatarOptions = {}
    ): HTMLElement {
        const avatar = new ActorAvatar(actorId, avatarUrl, gender, options);
        return avatar.getElement();
    }
}

// CSS样式（需要添加到样式文件中）
export const ACTOR_AVATAR_STYLES = `
.actor-avatar {
    position: relative;
    display: inline-block;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f5f5f5;
    transition: all 0.3s ease;
}

.actor-avatar-small {
    width: 32px;
    height: 32px;
}

.actor-avatar-medium {
    width: 48px;
    height: 48px;
}

.actor-avatar-large {
    width: 64px;
    height: 64px;
}

.actor-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
}

.actor-avatar-loading .actor-avatar-img {
    opacity: 0.7;
}

.actor-avatar-loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border: 2px solid #ccc;
    border-top-color: #007bff;
    border-radius: 50%;
    animation: actor-avatar-spin 1s linear infinite;
}

.actor-avatar-error {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
}

.actor-avatar:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

@keyframes actor-avatar-spin {
    to {
        transform: rotate(360deg);
    }
}
`;
