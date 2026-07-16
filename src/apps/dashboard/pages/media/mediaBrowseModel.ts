/**
 * @file mediaBrowseModel.ts
 * @description 媒体库浏览页的目录模型、筛选与轮播位置计算
 * @module apps/dashboard/pages/media
 */
import type { EmbyWatchUserData } from '../../../../features/embyLibrary/types';
import type { MediaWatchState } from '../../../../features/embyLibrary/domain/watchState';

export type MediaBrowseSource = 'all' | 'emby' | 'jellyfin' | '115';

/** 真实观看筛选（与来源筛选叠加） */
export type MediaWatchFilter = 'all' | 'in_progress' | 'watched' | 'not_watched';

export type MediaBrowseItem = {
  code: string;
  title: string;
  source: Exclude<MediaBrowseSource, 'all'>;
  year: string;
  hue: number; // 无封面图时的渐变色相
  coverImageUrl?: string;
  serverName?: string;
  itemId?: string;
  serverUrl?: string;
  /** Emby/Jellyfin 服务端 ID，用于拼网页详情链接 */
  serverId?: string;
  /** 真实观看摘要（Emby/JF UserData） */
  userData?: EmbyWatchUserData;
  /** 推导后的展示态：已入库 / 在看 / 真实已看 */
  watchState?: MediaWatchState;
};

/**
 * 无真实索引时的预览片单
 */
export const MEDIA_PREVIEW_ITEMS: MediaBrowseItem[] = [
  { code: 'SSIS-458', title: '恋人未满的同居生活', source: 'emby', year: '2022', hue: 330 },
  { code: 'STARS-712', title: '第一次的温泉旅行', source: 'jellyfin', year: '2023', hue: 200 },
  { code: 'MIDV-401', title: '雨夜之后', source: 'emby', year: '2023', hue: 255 },
  { code: 'PRED-512', title: '都市夜行', source: 'jellyfin', year: '2024', hue: 170 },
  { code: 'IPX-987', title: '白衬衫与星期一', source: 'emby', year: '2021', hue: 20 },
  { code: 'CAWD-558', title: '海边的旧相机', source: '115', year: '2022', hue: 190 },
  { code: 'JUL-998', title: '隔壁的灯还亮着', source: 'emby', year: '2020', hue: 280 },
  { code: 'ABW-340', title: '夜间便利店', source: 'jellyfin', year: '2023', hue: 40 },
  { code: 'FSDSS-620', title: '玻璃温室', source: 'emby', year: '2024', hue: 145 },
  { code: 'ADN-480', title: '未寄出的信', source: 'jellyfin', year: '2022', hue: 300 },
  { code: 'HMN-445', title: '地铁末班车', source: '115', year: '2021', hue: 220 },
  { code: 'SSIS-790', title: '蓝色窗帘', source: 'emby', year: '2023', hue: 210 },
];

/**
 * 根据条目色相生成预览封面渐变
 */
export function coverGradient(item: MediaBrowseItem): string {
  const h = item.hue;
  return `linear-gradient(125deg, hsl(${h} 48% 48%), hsl(${(h + 36) % 360} 42% 28%) 50%, hsl(${(h + 18) % 360} 28% 14%))`;
}

/**
 * 封面 art 样式：优先真实封面图，否则渐变
 */
export function coverArtStyle(item: MediaBrowseItem): { backgroundImage?: string; background: string } {
  if (item.coverImageUrl) {
    // 使用 backgroundImage 单独字段，避免 JSON 引号在部分环境下解析异常
    const safeUrl = item.coverImageUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return {
      backgroundImage: `url("${safeUrl}")`,
      background: `${coverGradient(item)}`,
    };
  }
  return { background: coverGradient(item) };
}

/**
 * 来源展示名
 */
export function sourceLabel(source: MediaBrowseItem['source']): string {
  if (source === 'emby') return 'Emby';
  if (source === 'jellyfin') return 'Jellyfin';
  return '115';
}

/**
 * 按来源与关键词筛选片单
 */
export function filterMediaItems(
  items: MediaBrowseItem[],
  filter: MediaBrowseSource,
  query: string,
  watchFilter: MediaWatchFilter = 'all',
): MediaBrowseItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter !== 'all' && item.source !== filter) return false;
    if (watchFilter !== 'all') {
      const ws = item.watchState || 'none';
      if (watchFilter === 'watched' && ws !== 'watched') return false;
      if (watchFilter === 'in_progress' && ws !== 'in_progress') return false;
      if (watchFilter === 'not_watched' && (ws === 'watched' || ws === 'in_progress')) return false;
    }
    if (!q) return true;
    return (
      item.code.toLowerCase().includes(q)
      || item.title.toLowerCase().includes(q)
      || (item.serverName || '').toLowerCase().includes(q)
    );
  });
}

/**
 * 续看列表：在看优先，其次按 lastPlayedAt
 */
export function resumeMediaItems(items: MediaBrowseItem[], limit = 12): MediaBrowseItem[] {
  return items
    .filter((item) => item.watchState === 'in_progress' || (item.userData && item.userData.percent > 0 && item.watchState !== 'watched'))
    .sort((a, b) => (b.userData?.lastPlayedAt || 0) - (a.userData?.lastPlayedAt || 0))
    .slice(0, limit);
}

/**
 * 计算堆叠轮播中卡片相对中心的位置（环形）
 */
export function relativeCarouselPos(index: number, active: number, len: number): number {
  if (len <= 0) return 0;
  let d = index - active;
  if (d > len / 2) d -= len;
  if (d < -len / 2) d += len;
  return d;
}

/**
 * 轮播条使用的前几条条目
 */
export function heroItems(items: MediaBrowseItem[]): MediaBrowseItem[] {
  return items.slice(0, 5);
}

/**
 * 兼容旧 hash 子路径到页内筛选
 */
export function subPathToFilter(subPath?: string): MediaBrowseSource {
  if (subPath === 'emby') return 'emby';
  if (subPath === 'jellyfin') return 'jellyfin';
  if (subPath === '115') return '115';
  return 'all';
}
