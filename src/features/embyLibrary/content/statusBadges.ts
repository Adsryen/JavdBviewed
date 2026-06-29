/**
 * @file statusBadges.ts
 * @description statusBadges
 * @module features/embyLibrary
 */
import { STATE } from '../../contentState';
import {
  buildMediaItemUrl,
  findLibraryMatches,
  normalizeServerUrl,
} from '../domain/libraryIndex';
import type { EmbyLibraryIndexEntry } from '../types';

type BadgeContext = 'list' | 'detail';

function isLibraryStatusEnabled(context: BadgeContext): boolean {
  const config = (STATE.settings as any)?.emby?.libraryStatus;
  if (config?.enabled !== true) return false;
  if (context === 'list') return config.showOnList !== false;
  return config.showOnDetail !== false;
}

function getLabel(entry: EmbyLibraryIndexEntry): string {
  return entry.serverType === 'jellyfin' ? 'Jellyfin已入库' : 'Emby已入库';
}

function getClassName(entry: EmbyLibraryIndexEntry): string {
  const style = entry.serverType === 'jellyfin' ? 'is-link' : 'is-success';
  return `tag ${style} is-light emby-library-status-tag emby-library-status-${entry.serverType}`;
}

function hasLibraryIndex(): boolean {
  const state = STATE.embyLibraryState;
  if (!state) return false;
  if (Number(state.updatedAt || 0) > 0) return true;
  return Object.keys(state.entries || {}).length > 0;
}

function getConfiguredServerKeys(): Set<string> {
  const servers = (STATE.settings as any)?.emby?.mediaServers;
  if (!Array.isArray(servers)) return new Set();

  return new Set(servers
    .filter((server) => server && server.enabled !== false && server.url)
    .map((server) => `${server.type === 'jellyfin' ? 'jellyfin' : 'emby'}:${normalizeServerUrl(String(server.url || ''))}`));
}

function getConfiguredMatches(videoId: string): EmbyLibraryIndexEntry[] {
  const configuredServerKeys = getConfiguredServerKeys();
  if (configuredServerKeys.size === 0) return [];

  return findLibraryMatches(STATE.embyLibraryState, videoId).filter((entry) => {
    const entryKey = `${entry.serverType}:${normalizeServerUrl(entry.serverUrl)}`;
    return configuredServerKeys.has(entryKey);
  });
}

export function renderLibraryStatusBadges(container: HTMLElement, videoId: string, context: BadgeContext): void {
  container.querySelectorAll('.emby-library-status-tag').forEach((tag) => tag.remove());

  if (!isLibraryStatusEnabled(context)) return;

  const matches = getConfiguredMatches(videoId);
  if (matches.length === 0) return;

  for (const entry of matches) {
    const badge = document.createElement('a');
    badge.className = getClassName(entry);
    badge.textContent = getLabel(entry);
    badge.href = buildMediaItemUrl(entry);
    badge.target = '_blank';
    badge.rel = 'noopener noreferrer';
    badge.title = `${entry.serverName}: ${entry.itemName}`;
    badge.dataset.embyLibraryServerType = entry.serverType;
    badge.dataset.embyLibraryItemId = entry.itemId;
    container.appendChild(badge);
  }
}

export function ensureListTagContainer(item: HTMLElement): HTMLElement | null {
  let tagContainer = item.querySelector<HTMLElement>('.tags.has-addons') || item.querySelector<HTMLElement>('.tags');
  if (tagContainer) return tagContainer;

  const videoTitle = item.querySelector('.video-title');
  if (!videoTitle) return null;

  tagContainer = document.createElement('div');
  tagContainer.className = 'tags has-addons';
  videoTitle.appendChild(tagContainer);
  return tagContainer;
}

export function renderDetailLibraryStatus(videoId: string): void {
  const firstBlock = document.querySelector<HTMLElement>('.movie-panel-info .panel-block.first-block, .panel-block.first-block');
  if (!firstBlock) return;

  const existing = firstBlock.querySelector<HTMLElement>('.emby-library-detail-tags');
  if (existing) existing.remove();

  if (!isLibraryStatusEnabled('detail')) return;
  if (!hasLibraryIndex()) {
    const wrapper = document.createElement('span');
    wrapper.className = 'emby-library-detail-tags tags has-addons';
    wrapper.style.cssText = 'display:inline-flex;gap:4px;margin-left:8px;vertical-align:middle;';

    const hint = document.createElement('span');
    hint.className = 'tag is-warning is-light emby-library-sync-hint';
    hint.textContent = '媒体库未同步';
    hint.title = '请先在设置页同步 Emby/Jellyfin 媒体库';
    wrapper.appendChild(hint);
    firstBlock.appendChild(wrapper);
    return;
  }

  const matches = getConfiguredMatches(videoId);
  if (matches.length === 0) return;

  const wrapper = document.createElement('span');
  wrapper.className = 'emby-library-detail-tags tags has-addons';
  wrapper.style.cssText = 'display:inline-flex;gap:4px;margin-left:8px;vertical-align:middle;';
  renderLibraryStatusBadges(wrapper, videoId, 'detail');
  firstBlock.appendChild(wrapper);
}
