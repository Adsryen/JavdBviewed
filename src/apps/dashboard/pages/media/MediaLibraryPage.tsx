/**
 * @file MediaLibraryPage.tsx
 * @description 媒体库浏览页（新 UI 栈样板）：页内筛选 + 堆叠轮播 + 卡片网格
 * @module apps/dashboard/pages/media
 *
 * 封面高度/悬浮策略统一走 MediaCover 原语，页面不再私自实现 16:9 算法。
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../../ui/primitives/Badge/Badge';
import { Button } from '../../../../ui/primitives/Button/Button';
import { Input } from '../../../../ui/primitives/Input/Input';
import { MediaCover } from '../../../../ui/primitives/MediaCover/MediaCover';
import { resolveDashboardNavState } from '../../../../dashboard/tabs/navModel';
import {
  coverGradient,
  filterMediaItems,
  heroItems,
  MEDIA_PREVIEW_ITEMS,
  type MediaBrowseItem,
  type MediaBrowseSource,
  relativeCarouselPos,
  sourceLabel,
  subPathToFilter,
} from './mediaBrowseModel';
import './mediaPage.css';

const FILTERS: { id: MediaBrowseSource; label: string }[] = [
  { id: 'all', label: '全部来源' },
  { id: 'emby', label: 'Emby' },
  { id: 'jellyfin', label: 'Jellyfin' },
  { id: '115', label: '115' },
];

/**
 * 媒体库主页面
 */
export function MediaLibraryPage() {
  const [filter, setFilter] = useState<MediaBrowseSource>('all');
  const [query, setQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  // 兼容旧 hash 子路径，仅驱动页内筛选
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

  const heroes = useMemo(() => heroItems(MEDIA_PREVIEW_ITEMS), []);
  const list = useMemo(
    () => filterMediaItems(MEDIA_PREVIEW_ITEMS, filter, query),
    [filter, query],
  );

  useEffect(() => {
    if (heroes.length === 0) return;
    const timer = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroes.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroes.length]);

  const goHero = (next: number) => {
    if (heroes.length === 0) return;
    setHeroIndex(((next % heroes.length) + heroes.length) % heroes.length);
  };

  return (
    <div className="ml-page" data-media-page data-media-stack="react">
      <div className="ml-toolbar">
        <div>
          <h2 className="ml-title">媒体库</h2>
          <p className="ml-desc">
            按来源浏览已入库条目；配置 Emby / Jellyfin 并同步后将接入真实索引。
          </p>
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
          <div className="ml-search">
            <Input
              type="search"
              value={query}
              placeholder="搜索番号 / 标题"
              onChange={(e) => setQuery(e.currentTarget.value)}
              aria-label="搜索媒体库"
            />
          </div>
        </div>
      </div>

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
                  artStyle={{ background: coverGradient(item) }}
                  footer={
                    <>
                      <span className="ml-code">{item.code}</span>
                      <div className="ml-card-title">{item.title}</div>
                      {pos === 0 ? (
                        <div className="ml-hero-meta-inline">
                          {sourceLabel(item.source)} · {item.year} · 预览
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
                可先到设置中配置 Emby / Jellyfin 并完成同步；当前筛选下若无结果，可切换来源或清空搜索。
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
              <MediaCard key={item.code} item={item} />
            ))}
          </div>
        )}
      </section>

      <div className="ml-note" role="note">
        界面预览数据仅用于展示浏览结构（新 UI 栈）。完成服务器配置与同步后，将替换为真实入库索引。
      </div>
    </div>
  );
}

/**
 * 片库网格卡片：外壳 button 不承担高度，高度全由 MediaCover 提供
 */
function MediaCard({ item }: { item: MediaBrowseItem }) {
  return (
    <button type="button" className="ml-card" data-code={item.code}>
      <MediaCover
        artStyle={{ background: coverGradient(item) }}
        badges={
          <>
            <Badge tone={item.source === 'emby' ? 'primary' : item.source === 'jellyfin' ? 'info' : 'neutral'}>
              {sourceLabel(item.source)}
            </Badge>
            <Badge tone="success">预览</Badge>
          </>
        }
        footer={
          <>
            <span className="ml-code">{item.code}</span>
            <div className="ml-card-title">{item.title}</div>
          </>
        }
      />
      <div className="ml-meta">
        <span>{sourceLabel(item.source)}</span>
        <span>{item.year}</span>
      </div>
    </button>
  );
}
