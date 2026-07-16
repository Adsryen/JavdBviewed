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
import { EmptyState } from '../../../../ui/patterns/EmptyState/EmptyState';
import { FilterChip } from '../../../../ui/patterns/FilterChip/FilterChip';
import { PageHeader } from '../../../../ui/patterns/PageHeader/PageHeader';
import { resolveDashboardNavState } from '../../../../dashboard/tabs/navModel';
import type { EmbyLibraryState } from '../../../../features/embyLibrary/types';
import { STORAGE_KEYS } from '../../../../utils/config';
import { getValue } from '../../../../utils/storage';
import {
  coverArtStyle,
  filterMediaItems,
  heroItems,
  MEDIA_PREVIEW_ITEMS,
  resumeMediaItems,
  type MediaBrowseItem,
  type MediaBrowseSource,
  type MediaWatchFilter,
  relativeCarouselPos,
  sourceLabel,
  subPathToFilter,
} from './mediaBrowseModel';
import {
  buildServerOpenUrl,
  buildServerPlayUrl,
  formatWatchPercent,
  hasLibraryIndex,
  mapLibraryStateToBrowseItems,
  mergeLocalWatchEvidence,
  watchStateLabel,
} from './mediaLibraryIndexAdapter';
import { Media115PlayPanel } from './Media115PlayPanel';
import { Media115CleanupPanel } from './Media115CleanupPanel';
import { enqueueWatchedForCleanup } from '../../../../features/drive115/v2/drive115CleanupActions';
import { loadWatchEvidenceMap } from '../../../../features/media/mediaWatchEvidence';
import './mediaPage.css';

const FILTERS: { id: MediaBrowseSource; label: string }[] = [
  { id: 'all', label: '全部来源' },
  { id: 'emby', label: 'Emby' },
  { id: 'jellyfin', label: 'Jellyfin' },
  { id: '115', label: '115' },
];

const WATCH_FILTERS: { id: MediaWatchFilter; label: string }[] = [
  { id: 'all', label: '全部状态' },
  { id: 'in_progress', label: '在看' },
  { id: 'watched', label: '真实已看' },
  { id: 'not_watched', label: '未看完' },
];

const EMPTY_STATE: EmbyLibraryState = { entries: {}, updatedAt: 0 };

/**
 * 媒体库主页面
 */
export function MediaLibraryPage() {
  const [filter, setFilter] = useState<MediaBrowseSource>('all');
  const [watchFilter, setWatchFilter] = useState<MediaWatchFilter>('all');
  const [query, setQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [catalog, setCatalog] = useState<MediaBrowseItem[]>(MEDIA_PREVIEW_ITEMS);
  const [usingPreview, setUsingPreview] = useState(true);
  const [indexUpdatedAt, setIndexUpdatedAt] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [show115Panel, setShow115Panel] = useState(false);
  const [play115Query, setPlay115Query] = useState('');
  const [showCleanupPanel, setShowCleanupPanel] = useState(false);
  const [cleanupRefreshKey, setCleanupRefreshKey] = useState(0);

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
      const [state, evidence] = await Promise.all([
        getValue<EmbyLibraryState>(STORAGE_KEYS.EMBY_LIBRARY_STATE, EMPTY_STATE),
        loadWatchEvidenceMap().catch(() => ({})),
      ]);
      if (hasLibraryIndex(state)) {
        const mapped = mapLibraryStateToBrowseItems(state);
        setCatalog(mergeLocalWatchEvidence(mapped, evidence));
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

  // 卡片/工具栏打开 115 播放面板
  useEffect(() => {
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent<{ query?: string }>).detail;
      setPlay115Query(String(detail?.query || query || '').trim());
      setShow115Panel(true);
    };
    window.addEventListener('media-open-115-play', onOpen as EventListener);
    return () => window.removeEventListener('media-open-115-play', onOpen as EventListener);
  }, [query]);

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
  const resumeList = useMemo(() => resumeMediaItems(catalog, 8), [catalog]);
  const list = useMemo(
    () => filterMediaItems(catalog, filter, query, watchFilter),
    [catalog, filter, query, watchFilter],
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
        <PageHeader
          className="ml-page-header"
          title="媒体库"
          description={
            <>
              {statusLabel}
              {syncMessage ? (
                <>
                  <br />
                  <span className="ml-sync-msg">{syncMessage}</span>
                </>
              ) : null}
            </>
          }
        />
        <div className="ml-filters">
          {FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              active={filter === f.id}
              data-media-filter={f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </FilterChip>
          ))}
          {WATCH_FILTERS.map((f) => (
            <FilterChip
              key={`w-${f.id}`}
              active={watchFilter === f.id}
              data-media-watch-filter={f.id}
              onClick={() => setWatchFilter(f.id)}
            >
              {f.label}
            </FilterChip>
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setPlay115Query(query.trim());
              setShow115Panel(true);
            }}
          >
            115 播放
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCleanupPanel((v) => !v)}
          >
            115 清理清单
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
                    imageUrl={item.coverImageUrl}
                    artStyle={coverArtStyle(item)}
                    alt={item.code}
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

      {!usingPreview && resumeList.length > 0 ? (
        <section className="ml-resume" aria-label="继续观看">
          <div className="ml-section-head">
            <h3>继续观看</h3>
            <span>{resumeList.length} 部 · 在服务器网页续看</span>
          </div>
          <div className="ml-resume-row">
            {resumeList.map((item) => {
              const playUrl = buildServerPlayUrl(item) || buildServerOpenUrl(item);
              const pct = formatWatchPercent(item.userData);
              return (
                <a
                  key={`resume-${item.code}`}
                  className="ml-resume-card"
                  href={playUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={playUrl ? '在服务器网页续看' : item.title}
                  onClick={(e) => {
                    if (!playUrl) e.preventDefault();
                  }}
                >
                  <div
                    className="ml-resume-cover"
                    style={
                      item.coverImageUrl
                        ? {
                            backgroundImage: `url("${String(item.coverImageUrl).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`,
                            backgroundColor: '#0f172a',
                          }
                        : coverArtStyle(item)
                    }
                  />
                  <div className="ml-resume-body">
                    <div className="ml-resume-code">{item.code}</div>
                    <div className="ml-resume-title">{item.title}</div>
                    <div className="ml-resume-meta">
                      {sourceLabel(item.source)}
                      {pct ? ` · ${pct}` : ''}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {show115Panel ? (
        <Media115PlayPanel
          initialQuery={play115Query}
          onClose={() => setShow115Panel(false)}
        />
      ) : null}

      {showCleanupPanel ? (
        <Media115CleanupPanel
          refreshKey={cleanupRefreshKey}
          onClose={() => setShowCleanupPanel(false)}
        />
      ) : null}

      <section className="ml-catalog" aria-label="片库条目">
        <div className="ml-section-head">
          <h3>片库条目</h3>
          <span>
            {list.length} 部 · 横向封面 16:9
          </span>
        </div>

        {list.length === 0 ? (
          <EmptyState
            className="ml-empty"
            id="mediaLibraryEmpty"
            title="这里还没有可展示的条目"
            description={
              usingPreview
                ? '可先到设置中配置 Emby / Jellyfin 并完成媒体库同步。'
                : '当前筛选下无结果，可切换来源或清空搜索。'
            }
            action={
              <Button
                size="sm"
                onClick={() => {
                  window.location.hash = '#tab-settings/emby-settings';
                }}
              >
                前往 Emby / Jellyfin 设置
              </Button>
            }
          />
        ) : (
          <div className="ml-grid" id="mediaLibraryGrid" data-layout-check="media-grid">
            {list.map((item) => (
              <MediaCard
                key={item.code}
                item={item}
                usingPreview={usingPreview}
                onWatchChanged={() => {
                  void reloadCatalogFromStorage();
                }}
                onEnqueuedCleanup={() => {
                  setShowCleanupPanel(true);
                  setCleanupRefreshKey((k) => k + 1);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <div className="ml-note" role="note">
        {usingPreview
          ? '当前展示预览数据。完成 Emby/Jellyfin 媒体库同步后，将自动改用本地索引。'
          : '当前展示本地媒体库索引。Emby/Jellyfin 请在服务器网页播放；115 扩展内播放后续迭代。'}
      </div>
    </div>
  );
}

/**
 * 片库网格卡片：有服务器链接时整卡可外开；预览数据不可点进服务器
 */
function MediaCard({
  item,
  usingPreview,
  onWatchChanged,
  onEnqueuedCleanup,
}: {
  item: MediaBrowseItem;
  usingPreview: boolean;
  onWatchChanged?: () => void;
  onEnqueuedCleanup?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const detailUrl = usingPreview ? null : buildServerOpenUrl(item);
  const playUrl = usingPreview ? null : buildServerPlayUrl(item) || detailUrl;
  const openOnServer = (url: string | null) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const watchState = item.watchState;
  const watchLabel = watchState && watchState !== 'none' ? watchStateLabel(watchState) : '';
  const percentLabel = formatWatchPercent(item.userData);
  const watchBadge =
    watchState === 'watched'
      ? { tone: 'success' as const, text: watchLabel }
      : watchState === 'in_progress'
        ? { tone: 'warning' as const, text: percentLabel ? `${watchLabel} ${percentLabel}` : watchLabel }
        : usingPreview
          ? { tone: 'warning' as const, text: '预览' }
          : { tone: 'success' as const, text: '已入库' };

  const canTogglePlayed = Boolean(detailUrl && item.itemId && item.serverUrl && !usingPreview);
  const isWatched = watchState === 'watched';

  const setPlayed = async (played: boolean) => {
    if (!canTogglePlayed || busy) return;
    setBusy(true);
    try {
      await new Promise<{ success?: boolean; error?: string }>((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(
            {
              type: 'EMBY_LIBRARY_SET_PLAYED',
              itemId: item.itemId,
              serverUrl: item.serverUrl,
              serverId: item.serverId,
              played,
            },
            (resp) => {
              const err = chrome.runtime.lastError;
              if (err) {
                reject(new Error(err.message));
                return;
              }
              resolve(resp || {});
            },
          );
        } catch (e) {
          reject(e);
        }
      }).then((resp) => {
        if (!resp.success) {
          const err = resp.error || '写回失败';
          if (/登录|令牌|ApiKey|UserData|用户/i.test(err)) {
            throw new Error(`${err}\n\n请到「设置 → Emby/Jellyfin」中登录媒体服务器用户账号后再试。`);
          }
          throw new Error(err);
        }
      });
      onWatchChanged?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-alert
      window.alert(`标记失败：${msg}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="ml-card" data-code={item.code} data-layout-card="1" data-watch-state={watchState || 'none'}>
      <div className="ml-card-cover">
        <button
          type="button"
          className="ml-card-hit"
          onClick={() => openOnServer(playUrl || detailUrl)}
          disabled={!playUrl && !detailUrl}
          title={
            playUrl
              ? `在服务器网页播放${watchLabel ? ` · ${watchLabel}` : ''}`
              : usingPreview
                ? '预览数据，无服务器链接'
                : '缺少服务器链接'
          }
        >
          <MediaCover
            imageUrl={item.coverImageUrl}
            artStyle={coverArtStyle(item)}
            alt={item.code}
            badges={
              <>
                <Badge tone={item.source === 'emby' ? 'primary' : item.source === 'jellyfin' ? 'info' : 'neutral'}>
                  {sourceLabel(item.source)}
                </Badge>
                <Badge tone={watchBadge.tone}>{watchBadge.text}</Badge>
              </>
            }
            footer={
              <>
                <span className="ml-code">{item.code}</span>
                <div className="ml-card-title">{item.title}</div>
              </>
            }
            showPlayHint={Boolean(playUrl || detailUrl)}
          />
        </button>
      </div>
      <div className="ml-meta">
        <span>{item.serverName || sourceLabel(item.source)}</span>
        {detailUrl || playUrl ? (
          <span className="ml-link-group">
            {playUrl ? (
              <a
                className="ml-open-link"
                href={playUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                播放
              </a>
            ) : null}
            {detailUrl ? (
              <a
                className="ml-open-link ml-open-link-secondary"
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                详情
              </a>
            ) : null}
          </span>
        ) : (
          <span>{item.year || '—'}</span>
        )}
      </div>
      {canTogglePlayed ? (
        <div className="ml-card-actions">
          <button
            type="button"
            className="ml-watch-btn"
            disabled={busy}
            onClick={() => void setPlayed(!isWatched)}
            title={isWatched ? '在 Emby/JF 标记为未看' : '在 Emby/JF 标记为真实已看'}
          >
            {busy ? '…' : isWatched ? '标为未看' : '标为真实已看'}
          </button>
          {isWatched ? (
            <button
              type="button"
              className="ml-watch-btn"
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const ret = await enqueueWatchedForCleanup({
                      code: item.code,
                      title: item.title,
                      embyItemId: item.itemId,
                      embyServerUrl: item.serverUrl,
                    });
                    onEnqueuedCleanup?.();
                    // eslint-disable-next-line no-alert
                    window.alert(
                      ret.bound
                        ? `已加入 115 清理清单（已绑定文件）`
                        : `已加入清理清单${ret.message ? `：${ret.message}` : ''}`,
                    );
                  } catch (e) {
                    // eslint-disable-next-line no-alert
                    window.alert(e instanceof Error ? e.message : String(e));
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
              title="真实已看 → 加入 115 待清理清单"
            >
              加入清理
            </button>
          ) : null}
          <button
            type="button"
            className="ml-watch-btn"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('media-open-115-play', { detail: { query: item.code } }),
              );
            }}
            title="在 115 搜索并播放"
          >
            115
          </button>
        </div>
      ) : item.source === '115' || usingPreview ? (
        <div className="ml-card-actions">
          <button
            type="button"
            className="ml-watch-btn"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('media-open-115-play', { detail: { query: item.code } }),
              );
            }}
            title="在 115 搜索并播放"
          >
            115 播放
          </button>
        </div>
      ) : null}
    </article>
  );
}
