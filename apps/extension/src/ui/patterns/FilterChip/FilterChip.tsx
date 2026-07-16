/**
 * @file FilterChip.tsx
 * @description 筛选芯片模式：对齐媒体库 .ml-chip 视觉（active primary / inactive muted）
 * @module ui/patterns
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 是否为当前选中项 */
  active?: boolean;
  children: ReactNode;
};

/**
 * 自研筛选芯片（不复用 Button，避免与主/次按钮视觉混用）
 */
export function FilterChip({
  active = false,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: FilterChipProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-pressed={active}
      data-ui-pattern="filter-chip"
      data-active={active ? 'true' : 'false'}
      className={cn(
        'inline-flex min-h-[34px] items-center justify-center border px-3 text-[12.5px] font-bold',
        'rounded-[var(--radius-pill)] transition-colors',
        'focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-transparent bg-[var(--color-primary-soft)] text-[var(--color-primary-active)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
