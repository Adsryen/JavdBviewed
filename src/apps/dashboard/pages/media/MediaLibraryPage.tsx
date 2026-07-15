/**
 * @file MediaLibraryPage.tsx
 * @description 媒体库浏览页：筛选 + 堆叠轮播 + 网格；优先展示本地 Emby/Jellyfin 索引
 * @module apps/dashboard/pages/media
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../../ui/primitives/Badge/Badge';
import { Button } from '../../../../ui/primitives/Button/Button';
import { Input } from '../../../../ui/primitives/Input/Input';
import { MediaCover } from '../../../../ui/primitives/MediaCover/MediaCover';
import { resolveDashboardNavState } from '../../../../dashboard/tabs/navModel';
import type { EmbyLibraryState } from '../../../../features/embyLibrary/types';
import { STORAGE_KEYS } from '../../../../utils/config';
import { getValue } from '../../../../utils/storage';
import {
  coverArtStyle,
  filterMediaItems,
  heroItems,
  MEDIA_PREVIEW_ITEMS,
  type MediaBrowseItem,
  type MediaBrowseSource,
  relativeCarouselPos,
  sourceLabel,
  subPathToFilter,
} from './mediaBrowseModel';
import {
  buildServerOpenUrl,
  hasLibraryIndex,
  mapLibraryStateToBrowseItems,
} from './mediaLibraryIndexAdapter';
import './mediaPage.css';

const FILTERS: { id: MediaBrowseSource; label: string }[] = [
  { id: 'all', label: '全部来源' },
  { id: 'emby', label: 'Emby' },
  { id: 'jellyfin', label: 'Jellyfin' },
  { id: '115', label: '115' },
];

const EMPTY_STATE: EmbyLibraryState = { entries: {}, updatedAt: 0 };

/**
 * 媒体库主页面
 */
export function MediaLibraryPage() {
  const [filter, setFilter] = useState<MediaBrowseSource>('all');
  const [query, setQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [catalog, setCatalog] = useState<MediaBrowseItem[]>(MEDIA_PREVIEW_ITEMS);
  const [usingPreview, setUsingPreview] = useState(true);
  const [indexUpdatedAt, setIndexUpdatedAt] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 兼容旧 hash 子路径
  useEffect(() => {
    const apply = () => {
      const state = resolveDashboardNavState(window.location.hash);
      if (state.tabId === 'tab-media') {
        setFilter(subPathToFilter(state.subPath));
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  /**
   * 从 storage 读取本地索引并刷新目录
   */
  const reloadCatalogFromStorage = async () => {
    setLoadingIndex(true);
    try {
      const state = await getValue<EmbyLibraryState>(
        STORAGE_KEYS.EMBY_LIBRARY_STATE,
        EMPTY_STATE,
      );
      if (hasLibraryIndex(state)) {
        setCatalog(mapLibraryStateToBrowseItems(state));
        setUsingPreview(false);
        setIndexUpdatedAt(state.updatedAt || 0);
      } else {
        setCatalog(MEDIA_PREVIEW_ITEMS);
        setUsingPreview(true);
        setIndexUpdatedAt(0);
      }
    } catch {
      setCatalog(MEDIA_PREVIEW_ITEMS);
      setUsingPreview(true);
      setIndexUpdatedAt(0);
    } finally {
      setLoadingIndex(false);
    }
  };

  // 首次进入读取索引
  useEffect(() => {
    void reloadCatalogFromStorage();
  }, []);

  /**
   * 触发后台媒体库同步后刷新本地目录
   */
  const handleSyncLibrary = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage('正在同步媒体库…');
    try {
      const response = await new Promise<{
        success?: boolean;
        synced?: number;
        failed?: number;
        error?: string;
      }>((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(
            { type: 'EMBY_LIBRARY_SYNC', manual: true },
            (resp) => {
              const err = chrome.runtime.lastError;
              if (err) {
                reject(new Error(err.message));
                return;
              }
              resolve(resp || {});
            },
          );
        } catch (error) {
          reject(error);
        }
      });

      await reloadCatalogFromStorage();

      if (response.success) {
        const synced = Number(response.synced || 0);
        const failed = Number(response.failed || 0);
        setSyncMessage(`同步完成：成功 ${synced} 台，失败 ${failed} 台`);
      } else {
        setSyncMessage(response.error || '同步失败，请到 Emby/Jellyfin 设置查看诊断');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSyncMessage(`同步失败：${message}`);
    } finally {
      setSyncing(false);
    }
  };

  const heroes = useMemo(() => heroItems(catalog), [catalog]);
  const list = useMemo(
    () => filterMediaItems(catalog, filter, query),
    [catalog, filter, query],
  );

  useEffect(() => {
    if (heroes.length === 0) return;
    const timer = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroes.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroes.length]);

  // 目录变化时复位轮播
  useEffect(() => {
    setHeroIndex(0);
  }, [catalog]);

  const goHero = (next: number) => {
    if (heroes.length === 0) return;
    setHeroIndex(((next % heroes.length) + heroes.length) % heroes.length);
  };

  const statusLabel = loadingIndex
    ? '正在读取本地索引…'
    : usingPreview
      ? '当前为预览数据（尚未同步到 Emby/Jellyfin 索引）'
      : `本地索引 · ${catalog.length} 部${indexUpdatedAt ? ` · 更新于 ${new Date(indexUpdatedAt).toLocaleString()}` : ''}`;

  return (
    <div className="ml-page" data-media-page data-media-stack="react">
      <div className="ml-toolbar">
        <div>
          <h2 className="ml-title">媒体库</h2>
          <p className="ml-desc">{statusLabel}</p>
          {syncMessage ? <p className="ml-sync-msg">{syncMessage}</p> : null}
        </div>
        <div className="ml-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`ml-chip${filter === f.id ? ' is-active' : ''}`}
              data-media-filter={f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <Button
            size="sm"
            variant="secondary"
            disabled={syncing}
            onClick={() => {
              void handleSyncLibrary();
            }}
          >
            {syncing ? '同步中…' : '同步媒体库'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={loadingIndex || syncing}
            onClick={() => {
              void reloadCatalogFromStorage();
            }}
          >
            刷新列表
          </Button>
          <div className="ml-search">
            <Input
              type="search"
              value={query}
              placeholder="搜索番号 / 标题 / 服务器"
              onChange={(e) => setQuery(e.currentTarget.value)}
              aria-label="搜索媒体库"
            />
          </div>
        </div>
      </div>

      {heroes.length > 0 ? (
        <section className="ml-hero" aria-label="推荐轮播">
          <div className="ml-hero-track">
            {heroes.map((item, i) => {
              const pos = relativeCarouselPos(i, heroIndex, heroes.length);
              const posAttr = pos >= -2 && pos <= 2 ? String(pos) : 'hide';
              return (
                <button
                  key={item.code}
                  type="button"
                  className="ml-hero-card"
                  data-pos={posAttr}
                  onClick={() => {
                    if (i !== heroIndex) goHero(i);
                  }}
                >
                  <MediaCover
                    hoverZoom={false}
                    showPlayHint={false}
                    artStyle={coverArtStyle(item)}
                    footer={
                      <>
                        <span className="ml-code">{item.code}</span>
                        <div className="ml-card-title">{item.title}</div>
                        {pos === 0 ? (
                          <div className="ml-hero-meta-inline">
                            {sourceLabel(item.source)}
                            {item.year ? ` · ${item.year}` : ''}
                            {item.serverName ? ` · ${item.serverName}` : ''}
                            {usingPreview ? ' · 预览' : ''}
                          </div>
                        ) : null}
                      </>
                    }
                  />
                </button>
              );
            })}
          </div>
          <button type="button" className="ml-hero-nav prev" aria-label="上一张" onClick={() => goHero(heroIndex - 1)}>
            ‹
          </button>
          <button type="button" className="ml-hero-nav next" aria-label="下一张" onClick={() => goHero(heroIndex + 1)}>
            ›
          </button>
          <div className="ml-hero-dots">
            {heroes.map((item, i) => (
              <button
                key={item.code}
                type="button"
                className={`ml-hero-dot${i === heroIndex ? ' is-active' : ''}`}
                aria-label={`第 ${i + 1} 张`}
                onClick={() => goHero(i)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="ml-catalog" aria-label="片库条目">
        <div className="ml-section-head">
          <h3>片库条目</h3>
          <span>
            {list.length} 部 · 横向封面 16:9
          </span>
        </div>

        {list.length === 0 ? (
          <div className="ml-empty" id="mediaLibraryEmpty">
            <div>
              <h3 style={{ margin: '0 0 4px' }}>这里还没有可展示的条目</h3>
              <p style={{ margin: '0 0 10px' }}>
                {usingPreview
                  ? '可先到设置中配置 Emby / Jellyfin 并完成媒体库同步。'
                  : '当前筛选下无结果，可切换来源或清空搜索。'}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  window.location.hash = '#tab-settings/emby-settings';
                }}
              >
                前往 Emby / Jellyfin 设置
              </Button>
            </div>
          </div>
        ) : (
          <div className="ml-grid" id="mediaLibraryGrid" data-layout-check="media-grid">
            {list.map((item) => (
              <MediaCard key={item.code} item={item} usingPreview={usingPreview} />
            ))}
          </div>
        )}
      </section>

      <div className="ml-note" role="note">
        {usingPreview
          ? '当前展示预览数据。完成 Emby/Jellyfin 媒体库同步后，将自动改用本地索引。'
          : '当前展示本地媒体库索引。播放仍可在服务器网页端打开（应用内播放后续迭代）。'}
      </div>
    </div>
  );
}

/**
 * 片库网格卡片：有服务器链接时整卡可外开；预览数据不可点进服务器
 */
function MediaCard({ item, usingPreview }: { item: MediaBrowseItem; usingPreview: boolean }) {
  const openUrl = usingPreview ? null : buildServerOpenUrl(item);
  const openOnServer = () => {
    if (!openUrl) return;
    window.open(openUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ml-card" data-code={item.code}>
      <button
        type="button"
        className="ml-card-hit"
        onClick={openOnServer}
        disabled={!openUrl}
        title={openUrl ? '在服务器网页打开' : usingPreview ? '预览数据，无服务器链接' : '缺少服务器链接'}
      >
        <MediaCover
          artStyle={coverArtStyle(item)}
          badges={
            <>
              <Badge tone={item.source === 'emby' ? 'primary' : item.source === 'jellyfin' ? 'info' : 'neutral'}>
                {sourceLabel(item.source)}
              </Badge>
              <Badge tone={usingPreview ? 'warning' : 'success'}>
                {usingPreview ? '预览' : '已索引'}
              </Badge>
            </>
          }
          footer={
            <>
              <span className="ml-code">{item.code}</span>
              <div className="ml-card-title">{item.title}</div>
            </>
          }
          showPlayHint={Boolean(openUrl)}
        />
      </button>
      <div className="ml-meta">
        <span>{item.serverName || sourceLabel(item.source)}</span>
        {openUrl ? (
          <a
            className="ml-open-link"
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            在服务器打开
          </a>
        ) : (
          <span>{item.year || '—'}</span>
        )}
      </div>
    </div>
  );
}
