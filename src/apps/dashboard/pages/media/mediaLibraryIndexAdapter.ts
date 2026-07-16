/**
 * @file mediaLibraryIndexAdapter.ts
 * @description 将 Emby/Jellyfin 本地索引状态适配为媒体库浏览条目
 * @module apps/dashboard/pages/media
 */
import { buildMediaItemUrl, buildMediaPlaybackUrl } from '../../../../features/embyLibrary/domain/libraryIndex';
import {
  computeWatchState,
  formatWatchPercent,
  watchStateLabel,
  type MediaWatchState,
} from '../../../../features/embyLibrary/domain/watchState';
import type { EmbyLibraryIndexEntry, EmbyLibraryState, EmbyWatchUserData } from '../../../../features/embyLibrary/types';
import type { MediaWatchEvidenceMap } from '../../../../features/media/mediaWatchEvidence';
import type { MediaBrowseItem, MediaBrowseSource } from './mediaBrowseModel';

/**
 * 从番号字符串生成稳定色相（预览渐变用）
 */
export function hueFromCode(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i += 1) {
    h = (h * 31 + code.charCodeAt(i)) % 360;
  }
  return h;
}

/**
 * 将索引条目映射为浏览用 source
 */
export function entryToSource(entry: EmbyLibraryIndexEntry): Exclude<MediaBrowseSource, 'all' | '115'> {
  return entry.serverType === 'jellyfin' ? 'jellyfin' : 'emby';
}

/**
 * 生成服务器网页端详情链接；字段不全时返回 null
 */
export function buildServerOpenUrl(
  item: Pick<MediaBrowseItem, 'serverUrl' | 'itemId' | 'source' | 'serverId'>,
): string | null {
  if (!item.serverUrl || !item.itemId) return null;
  if (item.source !== 'emby' && item.source !== 'jellyfin') return null;
  return buildMediaItemUrl({
    serverUrl: item.serverUrl,
    itemId: item.itemId,
    serverType: item.source,
    serverId: item.serverId,
  });
}

/**
 * 生成服务器网页端播放链接（Emby video 路由 / JF 详情页）
 */
export function buildServerPlayUrl(
  item: Pick<MediaBrowseItem, 'serverUrl' | 'itemId' | 'source' | 'serverId'>,
): string | null {
  if (!item.serverUrl || !item.itemId) return null;
  if (item.source !== 'emby' && item.source !== 'jellyfin') return null;
  return buildMediaPlaybackUrl({
    serverUrl: item.serverUrl,
    itemId: item.itemId,
    serverType: item.source,
    serverId: item.serverId,
  });
}

/**
 * 条目观看态（入库条目默认至少 in_library）
 */
export function resolveItemWatchState(entry: EmbyLibraryIndexEntry | null | undefined): MediaWatchState {
  if (!entry) return 'none';
  return computeWatchState(entry.userData);
}

export { formatWatchPercent, watchStateLabel };
export type { MediaWatchState };

/**
 * Emby 库状态 → 浏览列表（每个番号取第一条命中作为代表）
 */
export function mapLibraryStateToBrowseItems(state: EmbyLibraryState | null | undefined): MediaBrowseItem[] {
  if (!state?.entries) return [];
  const items: MediaBrowseItem[] = [];
  for (const [code, entries] of Object.entries(state.entries)) {
    if (!entries?.length) continue;
    const entry = entries[0];
    const source = entryToSource(entry);
    const watchState = resolveItemWatchState(entry);
    items.push({
      code,
      title: entry.itemName || code,
      source,
      year: '',
      hue: hueFromCode(code),
      coverImageUrl: entry.coverImageUrl,
      serverName: entry.serverName,
      itemId: entry.itemId,
      serverUrl: entry.serverUrl,
      serverId: entry.serverId,
      userData: entry.userData,
      watchState,
    });
  }
  // 番号字典序，稳定展示
  items.sort((a, b) => a.code.localeCompare(b.code));
  return items;
}

/**
 * 是否存在可用索引数据
 */
export function hasLibraryIndex(state: EmbyLibraryState | null | undefined): boolean {
  return mapLibraryStateToBrowseItems(state).length > 0;
}

/**
 * 合并本地 115 等观看证据（升级进度，不降级）
 */
export function mergeLocalWatchEvidence(
  items: MediaBrowseItem[],
  evidenceMap: MediaWatchEvidenceMap | null | undefined,
): MediaBrowseItem[] {
  if (!evidenceMap || !Object.keys(evidenceMap).length) return items;
  return items.map((item) => {
    const key = String(item.code || '').trim().toUpperCase();
    const ev = evidenceMap[key];
    if (!ev) return item;

    const localUd: EmbyWatchUserData = {
      played: ev.watched === true,
      positionTicks: 0,
      runtimeTicks: 0,
      percent: ev.percent,
      lastPlayedAt: ev.lastPlayedAt,
    };
    const mergedPercent = Math.max(item.userData?.percent || 0, localUd.percent);
    const mergedPlayed = Boolean(item.userData?.played || localUd.played || mergedPercent >= 90);
    const mergedUd: EmbyWatchUserData = {
      played: mergedPlayed,
      positionTicks: item.userData?.positionTicks || 0,
      runtimeTicks: item.userData?.runtimeTicks || 0,
      percent: mergedPercent,
      lastPlayedAt: Math.max(item.userData?.lastPlayedAt || 0, localUd.lastPlayedAt || 0),
    };
    const watchState = computeWatchState(mergedUd);
    return { ...item, userData: mergedUd, watchState };
  });
}
