/**
 * @file Toggle.tsx
 * @description 开关组件，视觉对齐现有 .ui-toggle
 * @module ui/primitives
 */
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  size?: 'sm' | 'md' | 'lg';
  /** 开关旁说明文案 */
  label?: string;
};

const sizeWrap = {
  sm: 'w-9 h-5',
  md: 'w-11 h-6',
  lg: 'w-14 h-[30px]',
} as const;

const sizeThumb = {
  sm: 'h-3.5 w-3.5 peer-checked:translate-x-4',
  md: 'h-[18px] w-[18px] peer-checked:translate-x-5',
  lg: 'h-[22px] w-[22px] top-1 left-1 peer-checked:translate-x-[26px]',
} as const;

/**
 * 自研开关（checkbox 实现，role=switch）
 */
export function Toggle({
  className,
  size = 'md',
  label,
  id,
  disabled,
  ...rest
}: ToggleProps) {
  const inputId = id || rest.name || undefined;
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span className={cn('relative inline-block shrink-0', sizeWrap[size])}>
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          disabled={disabled}
          className="peer absolute h-0 w-0 opacity-0"
          {...rest}
        />
        <span
          className={cn(
            'absolute inset-0 rounded-full bg-[var(--color-bg-muted)] transition-colors',
            'peer-checked:bg-[var(--color-primary)]',
            'peer-focus-visible:shadow-[var(--ring-focus)]',
          )}
          aria-hidden
        />
        <span
          className={cn(
            'pointer-events-none absolute left-[3px] top-[3px] rounded-full bg-[var(--color-surface)] shadow transition-transform',
            sizeThumb[size],
          )}
          aria-hidden
        />
      </span>
      {label ? (
        <span className="text-sm text-[var(--color-fg)]">{label}</span>
      ) : null}
    </label>
  );
}
