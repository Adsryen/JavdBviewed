/**
 * @file Badge.tsx
 * @description 状态/来源标签基础组件
 * @module ui/primitives
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)] border-[var(--color-border)]',
  primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-active)] border-transparent',
  success: 'bg-[var(--color-bg-muted)] text-[var(--color-success)] border-[var(--color-border)]',
  warning: 'bg-[var(--color-bg-muted)] text-[var(--color-warning)] border-[var(--color-border)]',
  danger: 'bg-[var(--color-bg-muted)] text-[var(--color-danger)] border-[var(--color-border)]',
  info: 'bg-[var(--color-bg-muted)] text-[var(--color-info)] border-[var(--color-border)]',
};

/**
 * 自研徽章
 */
export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold',
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
