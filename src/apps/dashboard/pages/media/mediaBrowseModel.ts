/**
 * @file mediaBrowseModel.ts
 * @description 媒体库浏览页的预览目录与纯函数筛选/轮播位置计算
 * @module apps/dashboard/pages/media
 */
export type MediaBrowseSource = 'all' | 'emby' | 'jellyfin' | '115';

export type MediaBrowseItem = {
  code: string;
  title: string;
  source: Exclude<MediaBrowseSource, 'all'>;
  year: string;
  hue: number; // 预览封面渐变色相（真实索引接入后可废弃）
};

/**
 * UI 预览用片单，直至接入 Emby/Jellyfin 真实索引（Phase B）
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
): MediaBrowseItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter !== 'all' && item.source !== filter) return false;
    if (!q) return true;
    return item.code.toLowerCase().includes(q) || item.title.toLowerCase().includes(q);
  });
}

/**
 * 计算堆叠轮播中卡片相对中心的位置（支持环形）
 *
 * @returns 相对位移，约在 -floor(n/2) … floor(n/2)
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
export function heroItems(items: MediaBrowseItem[] = MEDIA_PREVIEW_ITEMS): MediaBrowseItem[] {
  return items.slice(0, 5);
}

/**
 * 兼容旧 hash 子路径（#tab-media/emby）到页内筛选
 */
export function subPathToFilter(subPath?: string): MediaBrowseSource {
  if (subPath === 'emby') return 'emby';
  if (subPath === 'jellyfin') return 'jellyfin';
  if (subPath === '115') return '115';
  return 'all';
}
