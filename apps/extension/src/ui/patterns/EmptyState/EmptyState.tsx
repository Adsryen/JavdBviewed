/**
 * @file EmptyState.tsx
 * @description 空态模式：标题 + 说明 + 可选操作 / 图标
 * @module ui/patterns
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  /** 主文案 */
  title: ReactNode;
  /** 补充说明 */
  description?: ReactNode;
  /** 主操作（按钮等） */
  action?: ReactNode;
  /** 可选图标 / 装饰 */
  icon?: ReactNode;
};

/**
 * 自研空态块（无结果、未同步等）
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3.5 rounded-xl border border-dashed border-[var(--color-border-strong)]',
        'bg-[var(--color-surface-2)] px-[18px] py-[18px] text-[var(--color-fg)]',
        className,
      )}
      data-ui-pattern="empty-state"
      role="status"
      {...rest}
    >
      {icon ? <div className="shrink-0 text-[var(--color-fg-muted)]">{icon}</div> : null}
      <div className="min-w-0">
        <h3 className="m-0 mb-1 text-sm font-bold text-[var(--color-fg)]">{title}</h3>
        {description ? (
          <p className="m-0 mb-2.5 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
    </div>
  );
}
