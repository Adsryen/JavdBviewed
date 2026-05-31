import { log } from '../../features/contentState';

export function injectNavbarBadge(): void {
    try {
        if (document.getElementById('javdb-ext-badge')) return;

        const navbarEnd = document.querySelector('#navbar-menu-user .navbar-end') as HTMLElement | null;
        if (!navbarEnd) return;

        const badge = document.createElement('div');
        badge.id = 'javdb-ext-badge';
        badge.className = 'navbar-item';
        badge.innerHTML = `
            <span style="
                display: inline-flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                padding: 3px 8px;
                border-radius: 12px;
                background: rgba(59, 130, 246, 0.15);
                color: #60a5fa;
                border: 1px solid rgba(59, 130, 246, 0.3);
                white-space: nowrap;
                cursor: default;
                user-select: none;
            " title="Jav 助手已启用">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style="flex-shrink:0">
                    <circle cx="4" cy="4" r="4" fill="#3b82f6" opacity="0.4"/>
                    <circle cx="4" cy="4" r="2.5" fill="#60a5fa"/>
                </svg>
                Jav 助手已启用
            </span>
        `;

        navbarEnd.insertBefore(badge, navbarEnd.firstChild);
        log('Navbar badge injected');
    } catch (error) {
        log('Error injecting navbar badge:', error);
    }
}

export function removeUnwantedButtons(): void {
    try {
        const appButtons = document.querySelectorAll('a[href*="app.javdb"], a[href*="t.me/javdbnews"]');
        appButtons.forEach(button => {
            if (button.textContent?.includes('官方App') ||
                button.textContent?.includes('JavDB公告') ||
                button.textContent?.includes('Telegram')) {
                log(`Removing unwanted button: ${button.textContent}`);
                button.remove();
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            a[href*="app.javdb"]:not([href*="javdb.com"]),
            a[href*="t.me/javdbnews"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        log('Unwanted buttons removal completed');
    } catch (error) {
        log('Error removing unwanted buttons:', error);
    }
}
