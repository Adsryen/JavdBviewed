/**
 * @file PageHeader.tsx
 * @description 页面顶栏模式：眉题/返回 + 标题 + 描述 + 操作区
 * @module ui/patterns
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type PageHeaderAlign = 'start' | 'center';

export type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  /** 主标题 */
  title: ReactNode;
  /** 可选说明 */
  description?: ReactNode;
  /** 右侧操作区（按钮等） */
  actions?: ReactNode;
  /** 眉题/返回区（标题上方） */
  eyebrow?: ReactNode;
  /** 标题区对齐 */
  align?: PageHeaderAlign;
};

/**
 * 自研页面头（介于 primitive 与业务页之间的组合模式）
 */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  align = 'start',
  className,
  ...rest
}: PageHeaderProps) {
  const centered = align === 'center';

  return (
    <header
      className={cn(
        'mb-5 flex flex-wrap items-start gap-3',
        actions ? 'justify-between' : undefined,
        className,
      )}
      data-ui-pattern="page-header"
      {...rest}
    >
      <div className={cn('min-w-0 flex-1', centered ? 'text-center' : undefined)}>
        {eyebrow ? (
          <div className={cn('mb-3', centered ? 'text-left' : undefined)}>{eyebrow}</div>
        ) : null}
        <h2
          className={cn(
            'm-0 text-[22px] font-bold tracking-tight text-[var(--color-fg)]',
            centered ? 'text-center' : undefined,
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              'mt-1.5 mb-0 text-[13.5px] leading-relaxed text-[var(--color-fg-muted)]',
              centered ? 'mx-auto max-w-xl text-center' : undefined,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
