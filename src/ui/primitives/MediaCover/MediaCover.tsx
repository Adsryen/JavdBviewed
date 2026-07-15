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
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import './MediaCover.css';

export type MediaCoverProps = {
  /** 封面背景（渐变或 url(...)） */
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
};

/**
 * 稳定 16:9 封面壳
 */
export function MediaCover({
  artStyle,
  badges,
  footer,
  showPlayHint = true,
  className,
  hoverZoom = true,
}: MediaCoverProps) {
  return (
    <div
      className={cn(
        'ui-media-cover',
        hoverZoom && 'ui-media-cover--hover-zoom',
        className,
      )}
    >
      {/*
        frame 在文档流中用 aspect-ratio 占位；
        装饰层 absolute 相对 frame，不会让父级高度塌缩。
      */}
      <div className="ui-media-cover__frame">
        <div className="ui-media-cover__art" style={artStyle} />
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
