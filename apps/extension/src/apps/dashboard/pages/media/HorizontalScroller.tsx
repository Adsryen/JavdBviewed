/**
 * @file HorizontalScroller.tsx
 * @description 详情弹窗等横向卡片行：仅在内容溢出时启用横滑/拖拽
 * @module apps/dashboard/pages/media
 */
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../../../ui/lib/cn';
import { useHorizontalScroller } from './useHorizontalScroller';

export type HorizontalScrollerProps = {
  className?: string;
  children: ReactNode;
  /** 无障碍标签 */
  'aria-label'?: string;
};

/**
 * 横向滚动行：
 * - 内容未溢出：普通 flex 行，无抓手、不拦截滚轮
 * - 内容溢出：支持拖拽横滑 / 触控板横滑 / Shift+滚轮；普通上下滚轮不拦截
 */
export function HorizontalScroller({
  className,
  children,
  'aria-label': ariaLabel,
}: HorizontalScrollerProps) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const scrollRef = useHorizontalScroller<HTMLDivElement>({ enabled: overflowing });

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return undefined;

    const check = () => {
      const next = el.scrollWidth > el.clientWidth + 2;
      setOverflowing((prev) => (prev === next ? prev : next));
    };

    check();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => check()) : null;
    ro?.observe(el);
    const t1 = window.setTimeout(check, 300);
    const t2 = window.setTimeout(check, 1200);
    window.addEventListener('resize', check);
    return () => {
      ro?.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', check);
    };
  }, [children]);

  return (
    <div
      ref={(node) => {
        measureRef.current = node;
        (scrollRef as { current: HTMLDivElement | null }).current = node;
      }}
      className={cn(className, overflowing ? 'is-overflowing' : 'is-fit')}
      aria-label={ariaLabel}
      data-hscroll="1"
      data-hscroll-overflow={overflowing ? '1' : '0'}
    >
      {children}
    </div>
  );
}
