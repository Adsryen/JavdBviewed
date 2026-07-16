/**
 * @file SettingField.tsx
 * @description 设置字段模式：标签在上、控件居中、说明在下
 * @module ui/patterns
 */
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type SettingFieldProps = {
  /** 与控件关联的稳定 id（a11y / 设置搜索锚点） */
  id: string;
  /** 字段标签 */
  label: ReactNode;
  /** 可选说明（控件下方） */
  description?: ReactNode;
  /** 控件本体（input / select / 自定义） */
  children: ReactNode;
  className?: string;
};

/**
 * 纵向设置字段：label → control → description
 */
export function SettingField({
  id,
  label,
  description,
  children,
  className,
}: SettingFieldProps) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 px-2 py-2', className)}
      data-ui-pattern="setting-field"
    >
      <label
        htmlFor={id}
        className="m-0 block text-[13.5px] font-semibold text-[var(--color-fg)]"
      >
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      {description ? (
        <p className="m-0 text-[12px] leading-snug text-[var(--color-fg-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
