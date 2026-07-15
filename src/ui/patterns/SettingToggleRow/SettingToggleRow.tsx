/**
 * @file SettingToggleRow.tsx
 * @description 设置开关行：左侧标签/说明，右侧 Toggle
 * @module ui/patterns
 */
import type { ReactNode } from 'react';
import { Toggle } from '../../primitives/Toggle/Toggle';
import { cn } from '../../lib/cn';

export type SettingToggleRowProps = {
  /** 稳定 checkbox id（a11y / 设置搜索锚点） */
  id: string;
  /** 主标签 */
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 可选副说明 */
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/**
 * 设置密度下的开关行（label 左 / toggle 右）
 */
export function SettingToggleRow({
  id,
  label,
  checked,
  onChange,
  description,
  disabled,
  className,
}: SettingToggleRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-[var(--radius-2)] px-2 py-2.5',
        disabled ? 'opacity-50' : 'hover:bg-[var(--color-surface-2)]',
        className,
      )}
      data-ui-pattern="setting-toggle-row"
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className={cn(
            'm-0 block text-[13.5px] font-semibold text-[var(--color-fg)]',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 mb-0 text-[12px] leading-snug text-[var(--color-fg-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <Toggle
        id={id}
        size="sm"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.checked)}
        aria-label={typeof label === 'string' ? label : undefined}
      />
    </div>
  );
}
