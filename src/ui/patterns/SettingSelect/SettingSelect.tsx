/**
 * @file SettingSelect.tsx
 * @description 设置页下拉选择：token 描边/圆角，API 贴近原生 select
 * @module ui/patterns
 */
import type { ChangeEvent, SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type SettingSelectOption = {
  value: string;
  label: string;
};

export type SettingSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'children'
> & {
  value: string;
  onChange: (value: string, event: ChangeEvent<HTMLSelectElement>) => void;
  options: SettingSelectOption[];
};

/**
 * 自研设置下拉（视觉对齐 Input）
 */
export function SettingSelect({
  id,
  value,
  onChange,
  options,
  disabled,
  className,
  ...rest
}: SettingSelectProps) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      className={cn(
        'h-9 w-full min-w-0 rounded-[var(--radius-2)] border bg-[var(--color-surface)] px-3 text-sm',
        'text-[var(--color-fg)] border-[var(--color-border)]',
        'focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] focus-visible:border-[var(--color-primary)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      data-ui-pattern="setting-select"
      onChange={(e) => onChange(e.currentTarget.value, e)}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
