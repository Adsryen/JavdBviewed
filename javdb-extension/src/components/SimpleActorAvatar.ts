// 简化版演员头像组件
export class SimpleActorAvatar {
    private static readonly DEFAULT_AVATARS = {
        female: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNGRkI2QzEiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEyIDUyQzEyIDQyLjA1ODkgMjAuMDU4OSAzNCAzMCAzNEgzNEM0My45NDExIDM0IDUyIDQyLjA1ODkgNTIgNTJWNjRIMTJWNTJaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
        male: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM5M0M1RkQiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEyIDUyQzEyIDQyLjA1ODkgMjAuMDU4OSAzNCAzMCAzNEgzNEM0My45NDExIDM0IDUyIDQyLjA1ODkgNTIgNTJWNjRIMTJWNTJaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
        unknown: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM5Q0E0QUYiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEyIDUyQzEyIDQyLjA1ODkgMjAuMDU4OSAzNCAzMCAzNEgzNEM0My45NDExIDM0IDUyIDQyLjA1ODkgNTIgNTJWNjRIMTJWNTJaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo='
    };

    static create(
        actorId: string,
        avatarUrl: string | undefined,
        gender: 'female' | 'male' | 'unknown',
        size: 'small' | 'medium' | 'large' = 'medium',
        onClick?: (actorId: string) => void
    ): HTMLElement {
        const container = document.createElement('div');
        container.className = `actor-avatar actor-avatar-${size}`;
        
        if (onClick) {
            container.style.cursor = 'pointer';
            container.addEventListener('click', () => onClick(actorId));
        }

        const img = document.createElement('img');
        img.className = 'actor-avatar-img';
        img.alt = '演员头像';
        
        // 如果有头像URL，直接尝试使用，失败则回退到默认头像
        if (avatarUrl) {
            console.log(`SimpleActorAvatar: Loading ${avatarUrl} for ${actorId}`);

            // 直接设置头像URL
            img.src = avatarUrl;
            container.classList.add('actor-avatar-loading');

            img.onload = () => {
                console.log(`SimpleActorAvatar: Success loading ${avatarUrl} for ${actorId}`);
                container.classList.remove('actor-avatar-loading', 'actor-avatar-default');
                container.classList.add('actor-avatar-loaded');
            };

            img.onerror = () => {
                console.log(`SimpleActorAvatar: Failed loading ${avatarUrl} for ${actorId}, using default`);
                img.src = SimpleActorAvatar.DEFAULT_AVATARS[gender];
                container.classList.remove('actor-avatar-loading');
                container.classList.add('actor-avatar-default', 'actor-avatar-error');
            };
        } else {
            // 没有头像URL，直接使用默认头像
            img.src = SimpleActorAvatar.DEFAULT_AVATARS[gender];
            container.classList.add('actor-avatar-default');
        }

        container.appendChild(img);
        return container;
    }
}
