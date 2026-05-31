export interface WebDAVFile {
  path: string;
  name: string;
  lastModified: string;
  size?: number;
  uploaderClientId?: string;
  uploaderDeviceLabel?: string;
  uploaderBrowserName?: string;
  uploadId?: string;
}

export function getUploaderMeta(file: WebDAVFile): { device: string; browser: string; isUnknown: boolean } {
  const device = String(file.uploaderDeviceLabel || file.uploaderClientId || '').trim();
  const browser = String(file.uploaderBrowserName || '').trim();
  return {
    device: device || '未知设备',
    browser: browser || '未知浏览器',
    isUnknown: !device && !browser,
  };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '未知大小';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatRelativeTime(dateString: string, now: Date = new Date()): string {
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return '刚刚';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  if (diffDays === 1) {
    return '昨天';
  }
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}周前`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}个月前`;
  }

  const years = Math.floor(diffDays / 365);
  return `${years}年前`;
}

export function parseDateFromFilename(filename: string): Date | null {
  const match = filename.match(/javdb-extension-backup-(\d{4}-\d{2}-\d{2})(?:-(\d{2})-(\d{2})-(\d{2}))?\.(?:json|zip)$/i);
  if (!match) return null;
  const datePart = match[1];
  const h = match[2] || '00';
  const m = match[3] || '00';
  const s = match[4] || '00';
  const iso = `${datePart}T${h}:${m}:${s}Z`;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t);
}

export function formatDateYMD(date: Date): string {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

export function buildBackupDateRangeLabel(files: WebDAVFile[]): string {
  const dates: Date[] = [];

  for (const file of files) {
    const date = parseDateFromFilename(file.name);
    if (date) dates.push(date);
  }

  if (dates.length === 0) {
    for (const file of files) {
      const timestamp = Date.parse(file.lastModified);
      if (!Number.isNaN(timestamp)) dates.push(new Date(timestamp));
    }
  }

  if (dates.length === 0) return '未知';

  dates.sort((a, b) => a.getTime() - b.getTime());
  const firstStr = formatDateYMD(dates[0]);
  const lastStr = formatDateYMD(dates[dates.length - 1]);
  return firstStr === lastStr ? firstStr : `${firstStr} ~ ${lastStr}`;
}
