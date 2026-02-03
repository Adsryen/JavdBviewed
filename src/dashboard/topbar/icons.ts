// src/dashboard/topbar/icons.ts

export function initTopbarIcons(): void {
  try {
    const titleIcon = document.getElementById('title-icon') as HTMLImageElement | null;
    if (titleIcon) {
      titleIcon.src = chrome.runtime.getURL('assets/favicon-32x32.png');
      titleIcon.onload = () => { try { titleIcon.style.display = 'block'; } catch {} };
      titleIcon.onerror = () => { try { titleIcon.style.display = 'none'; } catch {} };
    }
  } catch {}

  try {
    const brandIcon = document.getElementById('brand-icon') as HTMLImageElement | null;
    if (brandIcon) {
      brandIcon.src = chrome.runtime.getURL('assets/favicon-32x32.png');
      brandIcon.onload = () => { try { brandIcon.style.display = 'block'; } catch {} };
      brandIcon.onerror = () => { try { brandIcon.style.display = 'none'; } catch {} };
    }
  } catch {}
}
