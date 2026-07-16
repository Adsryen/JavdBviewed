/**
 * @file MediaCover.tsx
 * @description 16:9 媒体封面原语。高度由内部 frame 的 aspect-ratio 在文档流中撑开。
 * @module ui/primitives
 *
 * 高度合约：
 * 1. 唯一高度来源：.ui-media-cover__frame 的 aspect-ratio: 16/9（文档流）
 * 2. art/shade/badges/footer/play 全部 absolute，挂在 frame 上
 * 3. 悬浮只缩放 art，禁止移动外框
 * 4. 禁止 padding-top% 撑高（flex/button 下易变成 0）
 * 5. 真实封面优先 <img>，避免仅 background 在部分 CSP/协议下失败
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import './MediaCover.css';

export type MediaCoverProps = {
  /** 封面图 URL（优先用 img 加载） */
  imageUrl?: string | null;
  /** 封面背景（渐变或 url(...)）；无 imageUrl 时使用 */
  artStyle?: CSSProperties;
  /** 左上/右上等徽章区 */
  badges?: ReactNode;
  /** 底部文案（番号、标题） */
  footer?: ReactNode;
  /** 是否显示悬浮播放钮 */
  showPlayHint?: boolean;
  className?: string;
  /** 是否启用轻微缩放悬浮（默认 true） */
  hoverZoom?: boolean;
  /** img alt */
  alt?: string;
};

/**
 * 稳定 16:9 封面壳
 */
export function MediaCover({
  imageUrl,
  artStyle,
  badges,
  footer,
  showPlayHint = true,
  className,
  hoverZoom = true,
  alt = '',
}: MediaCoverProps) {
  const src = imageUrl ? String(imageUrl).trim() : '';

  return (
    <div
      className={cn(
        'ui-media-cover',
        hoverZoom && 'ui-media-cover--hover-zoom',
        className,
      )}
    >
      <div className="ui-media-cover__frame">
        {src ? (
          <img
            className="ui-media-cover__art ui-media-cover__art-img"
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="ui-media-cover__art" style={artStyle} />
        )}
        <div className="ui-media-cover__shade" aria-hidden="true" />
        {badges ? <div className="ui-media-cover__badges">{badges}</div> : null}
        {footer ? <div className="ui-media-cover__footer">{footer}</div> : null}
        {showPlayHint ? (
          <div className="ui-media-cover__play" aria-hidden="true">
            <span>▶</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
