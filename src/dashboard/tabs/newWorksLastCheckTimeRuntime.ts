export interface NewWorksLastCheckTimeDeps {
  now?: number;
  doc?: Document;
}

export function formatNewWorksLastCheckTime(lastCheckTime: number, now: number = Date.now()): string {
  const diff = now - lastCheckTime;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  if (hours < 24) {
    return `${hours}小时前`;
  }
  if (days < 7) {
    return `${days}天前`;
  }

  return new Date(lastCheckTime).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

export function updateNewWorksLastCheckTimeDisplay(
  lastCheckTime: number | undefined,
  deps: NewWorksLastCheckTimeDeps = {},
): void {
  const doc = deps.doc || document;
  const display = doc.getElementById('lastCheckTimeDisplay');
  const textEl = doc.getElementById('lastCheckTimeText');

  if (!display || !textEl) return;

  if (lastCheckTime) {
    textEl.textContent = `上次检查：${formatNewWorksLastCheckTime(lastCheckTime, deps.now)}`;
    display.style.display = 'flex';
  } else {
    display.style.display = 'none';
  }
}
