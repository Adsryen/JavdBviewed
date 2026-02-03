import { extractVideoIdFromPage } from './videoId';

// Lightweight messaging for content script
async function sendDb<T = any>(type: string, payload?: any, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timer: number | undefined;
    try { timer = window.setTimeout(() => reject(new Error(`DB message timeout: ${type}`)), timeoutMs); } catch {}
    try {
      chrome.runtime.sendMessage({ type, payload }, (resp) => {
        if (timer) window.clearTimeout(timer);
        const lastErr = chrome.runtime.lastError;
        if (lastErr) { reject(new Error(lastErr.message || 'runtime error')); return; }
        if (!resp || resp.success !== true) { reject(new Error(resp?.error || 'unknown db error')); return; }
        resolve(resp as T);
      });
    } catch (e) {
      if (timer) window.clearTimeout(timer);
      reject(e as any);
    }
  });
}

function formatDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function extractTagsFromPage(): string[] {
  const set = new Set<string>();
  try {
    // 常见：链接到 /tags/xxx 的元素
    document.querySelectorAll('a[href*="/tags/"]').forEach((a) => {
      const t = (a.textContent || '').trim();
      if (t) set.add(t);
    });
    // 兜底：.tag 元素
    document.querySelectorAll('.tag, .tags .item, .video-tags a').forEach((el) => {
      const t = (el.textContent || '').trim();
      if (t) set.add(t);
    });
  } catch {}
  return Array.from(set);
}

const sessionCounted = new Set<string>();

export async function initInsightsCollector(): Promise<void> {
  try {
    const videoId = extractVideoIdFromPage();
    if (!videoId) return;
    if (sessionCounted.has(videoId)) return; // 避免同会话重复计数

    const tags = extractTagsFromPage();
    if (tags.length === 0) return;

    const date = formatDate();
    // 读取当日记录
    const resp = await sendDb<{ success: true; records: any[] }>('DB:INSIGHTS_VIEWS_RANGE', { startDate: date, endDate: date });
    const exists = Array.isArray(resp?.records) && resp.records[0] ? resp.records[0] : undefined;

    const movies: string[] = Array.isArray(exists?.movies) ? exists.movies.slice() : [];
    if (movies.includes(videoId)) { sessionCounted.add(videoId); return; }

    const counts: Record<string, number> = { ...(exists?.tags || {}) };
    for (const t of tags) counts[t] = (counts[t] || 0) + 1;
    movies.push(videoId);

    const view = { date, tags: counts, movies, status: 'final' };
    await sendDb('DB:INSIGHTS_VIEWS_PUT', { view });
    sessionCounted.add(videoId);
  } catch {
    // 忽略失败，避免影响页面体验
  }
}
