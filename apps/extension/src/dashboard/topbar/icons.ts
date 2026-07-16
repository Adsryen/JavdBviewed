// src/dashboard/topbar/icons.ts

let themeObserver: MutationObserver | null = null;

function updateFavicon(): void {
  const favicon32 = document.getElementById('favicon-32') as HTMLLinkElement | null;
  const favicon16 = document.getElementById('favicon-16') as HTMLLinkElement | null;

  const path32 = 'assets/favicons/dark/favicon-32x32.png';
  const path16 = 'assets/favicons/dark/favicon-16x16.png';

  if (favicon32) {
    favicon32.href = chrome.runtime.getURL(path32);
  }

  if (favicon16) {
    favicon16.href = chrome.runtime.getURL(path16);
  }
}

function updateIconsForTheme(): void {
  const faviconPath = 'assets/favicons/dark/favicon-32x32.png';

  // 固定使用深色图标，保证 title/标签页图标在亮色主题下仍保持白色主体。
  updateFavicon();

  try {
    const titleIcon = document.getElementById('title-icon') as HTMLImageElement | null;
    if (titleIcon) {
      titleIcon.src = chrome.runtime.getURL(faviconPath);
      titleIcon.onload = () => { try { titleIcon.style.display = 'block'; } catch {} };
      titleIcon.onerror = () => { try { titleIcon.style.display = 'none'; } catch {} };
    }
  } catch {}

  try {
    const brandIcon = document.getElementById('brand-icon') as HTMLImageElement | null;
    if (brandIcon) {
      brandIcon.src = chrome.runtime.getURL(faviconPath);
      brandIcon.onload = () => { try { brandIcon.style.display = 'block'; } catch {} };
      brandIcon.onerror = () => { try { brandIcon.style.display = 'none'; } catch {} };
    }
  } catch {}
}

export function initTopbarIcons(): void {
  // 初始化图标
  updateIconsForTheme();

  // 只创建一次观察器
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => {
      updateIconsForTheme();
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
}
