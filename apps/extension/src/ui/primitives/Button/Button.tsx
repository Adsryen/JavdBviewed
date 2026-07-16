/**
 * @file Button.tsx
 * @description 基础按钮组件，对齐现有 Dashboard 主/次按钮视觉
 * @module ui/primitives
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-fg-inverse)] border-transparent hover:bg-[var(--color-primary-hover)]',
  secondary:
    'bg-[var(--color-surface-2)] text-[var(--color-fg)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
  ghost:
    'bg-transparent text-[var(--color-fg-muted)] border-transparent hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg)]',
  danger:
    'bg-[var(--color-danger)] text-white border-transparent hover:opacity-90',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-[var(--radius-2)]',
  md: 'h-9 px-4 text-sm rounded-[var(--radius-pill)]',
  lg: 'h-11 px-5 text-base rounded-[var(--radius-pill)]',
};

/**
 * 自研基础按钮（不依赖第三方组件库皮肤）
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
