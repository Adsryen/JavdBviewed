import { insViewsRange, insReportsGet, insReportsPut } from './db';
import { aggregateMonthly } from '../services/insights/aggregator';
import { renderTemplate } from '../services/insights/reportGenerator';

export const INSIGHTS_ALARM = "insights-monthly";

export interface SchedulerSettings {
  enabled: boolean;
  minuteOfDay: number;
}

function ym(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthStartEnd(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(v => Number(v));
  const start = `${y}-${String(m).padStart(2,'0')}-01`;
  const end = new Date(y, m, 0).toISOString().slice(0, 10);
  return { start, end };
}

async function loadTemplate(): Promise<string> {
  try {
    const url = chrome.runtime.getURL('assets/templates/insights-report.html');
    const res = await fetch(url);
    return await res.text();
  } catch {
    return '<!doctype html><html><body><p>模板加载失败</p></body></html>';
  }
}

async function ensureReportForMonth(month: string): Promise<boolean> {
  const exists = await insReportsGet(month);
  if (exists && exists.status === 'final') return false;
  const { start, end } = monthStartEnd(month);
  const days = await insViewsRange(start, end);
  const stats = aggregateMonthly(days, { topN: 10 });
  const tpl = await loadTemplate();
  const topBrief = (stats.tagsTop || []).slice(0, 5).map(t => `${t.name}(${t.count})`).join('、');
  const insightList = [
    topBrief ? `本月偏好标签集中于：${topBrief}` : '数据量较少，暂无法判断主要偏好',
    `累计观看天数：${days.length} 天`,
  ].map(s => `<li>${s}</li>`).join('');
  const fields: Record<string, string> = {
    reportTitle: `我的观影标签月报（${month.replace('-','年')}月）`,
    periodText: `统计范围：${start} ~ ${end}`,
    summary: '本报告基于本地统计数据生成，未包含演员/系列，仅统计标签。',
    insightList,
    methodology: '按影片ID去重，每部影片的标签计入当日计数；月度聚合统计 TopN、占比与趋势（图表将本地渲染）。',
    generatedAt: new Date().toLocaleString(),
    version: '0.0.1',
    baseHref: chrome.runtime.getURL('') || './',
    statsJSON: JSON.stringify(stats || {}),
  };
  const html = renderTemplate({ templateHTML: tpl, fields });
  const now = Date.now();
  await insReportsPut({ month, period: { start, end }, stats, html, createdAt: now, finalizedAt: now, status: 'final', origin: 'auto', version: '0.0.1' });
  try {
    const iconUrl = chrome.runtime.getURL('assets/favicon-48x48.png');
    const id = `insights-${month}-${now}`;
    chrome.notifications?.create?.(id, { type: 'basic', iconUrl, title: '月报已生成', message: `${month} 的观影标签月报已生成` } as any);
  } catch {}
  return true;
}

export function registerMonthlyAlarm(settings: SchedulerSettings = { enabled: true, minuteOfDay: 10 }): void {
  if (!settings.enabled || !('alarms' in chrome)) return;
  try {
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth() + 1; // schedule next month
    if (m >= 12) { y += 1; m = 0; }
    const next = new Date(y, m, 1, 0, 0, 0, 0);
    const when = next.getTime() + settings.minuteOfDay * 60_000;
    chrome.alarms.create(INSIGHTS_ALARM, { when });
  } catch {}
}

export function handleAlarm(name: string): void {
  if (name !== INSIGHTS_ALARM) return;
  try {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const month = ym(d);
    ensureReportForMonth(month).catch(() => {});
    // schedule next
    try {
      const now = new Date();
      let y = now.getFullYear();
      let m = now.getMonth() + 1;
      if (m >= 12) { y += 1; m = 0; }
      const next = new Date(y, m, 1, 0, 10, 0, 0); // default 00:10
      chrome.alarms.create(INSIGHTS_ALARM, { when: next.getTime() });
    } catch {}
  } catch {}
}

export function compensateOnStartup(): void {
  try {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const month = ym(d);
    ensureReportForMonth(month).catch(() => {});
  } catch {}
}
