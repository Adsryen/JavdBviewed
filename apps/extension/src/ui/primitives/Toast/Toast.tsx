/**
 * @file Toast.tsx
 * @description 轻量提示条：成功/错误/信息，可关闭
 * @module ui/primitives
 */
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Button } from '../Button/Button';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export type ToastProps = {
  title?: ReactNode;
  children: ReactNode;
  tone?: ToastTone;
  onClose?: () => void;
  className?: string;
};

const toneBorder: Record<ToastTone, string> = {
  info: 'border-[var(--color-info)]',
  success: 'border-[var(--color-success)]',
  warning: 'border-[var(--color-warning)]',
  danger: 'border-[var(--color-danger)]',
};

const toneTitle: Record<ToastTone, string> = {
  info: 'text-[var(--color-info)]',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  danger: 'text-[var(--color-danger)]',
};

/**
 * 自研 Toast 展示单元（无全局队列；队列可在应用层组装）
 */
export function Toast({
  title,
  children,
  tone = 'info',
  onClose,
  className,
}: ToastProps) {
  return (
    <div
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-2)] border border-l-4 bg-[var(--color-surface)] p-3 shadow-[var(--shadow-2)]',
        toneBorder[tone],
        className,
      )}
      role="status"
    >
      <div className="min-w-0 flex-1">
        {title ? (
          <div className={cn('mb-0.5 text-sm font-bold', toneTitle[tone])}>{title}</div>
        ) : null}
        <div className="text-sm text-[var(--color-fg-muted)]">{children}</div>
      </div>
      {onClose ? (
        <Button variant="ghost" size="sm" aria-label="关闭提示" onClick={onClose}>
          ✕
        </Button>
      ) : null}
    </div>
  );
}
