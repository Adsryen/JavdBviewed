/**
 * @file Input.tsx
 * @description 文本/搜索输入框基础组件，颜色走主题 token
 * @module ui/primitives
 */
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** 校验失败态，用于描边提示 */
  invalid?: boolean;
};

/**
 * 自研输入框
 */
export function Input({ className, invalid, type = 'text', ...rest }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'h-9 w-full min-w-0 rounded-[var(--radius-2)] border bg-[var(--color-surface)] px-3 text-sm',
        'text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]',
        'border-[var(--color-border)]',
        'focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] focus-visible:border-[var(--color-primary)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid && 'border-[var(--color-danger)]',
        className,
      )}
      {...rest}
    />
  );
}
