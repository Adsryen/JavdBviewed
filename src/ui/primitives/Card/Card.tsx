/**
 * @file Card.tsx
 * @description 通用表面卡片容器：标题区 + 内容区，走主题 token
 * @module ui/primitives
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** 可选标题 */
  title?: ReactNode;
  /** 标题右侧操作区 */
  actions?: ReactNode;
  children: ReactNode;
  /** 减弱阴影的平面样式 */
  flat?: boolean;
};

/**
 * 自研卡片容器（设置块、说明块等复用）
 */
export function Card({
  title,
  actions,
  children,
  flat,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-3)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)]',
        flat ? 'shadow-none' : 'shadow-[var(--shadow-1)]',
        className,
      )}
      {...rest}
    >
      {title || actions ? (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold tracking-tight">{title}</div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="px-4 py-3 text-sm text-[var(--color-fg-muted)]">{children}</div>
    </div>
  );
}
