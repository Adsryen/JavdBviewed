/**
 * @file settingsPageFrame.tsx
 * @description 设置子页共用外框：返回栏 + 标题/说明 + 内容区
 * @module apps/dashboard/pages/settings/shared
 */
import type { ReactNode } from 'react';
import { PageHeader } from '../../../../../ui/patterns/PageHeader/PageHeader';
import { cn } from '../../../../../ui/lib/cn';
import '../settingsSubpageShell.css';

export type SettingsPageFrameProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** 根节点额外 data 属性（如 data-display-settings-react） */
  rootDataAttrs?: Record<string, string>;
};

/**
 * 全页 React 设置页外框（复用 .ssp-back 样式）
 */
export function SettingsPageFrame({
  title,
  description,
  children,
  className,
  rootDataAttrs,
}: SettingsPageFrameProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-3xl px-1 pb-8', className)}
      data-settings-stack="react-full"
      {...rootDataAttrs}
    >
      <PageHeader
        className="mb-5"
        align="center"
        eyebrow={
          <button type="button" className="ssp-back" data-action="back-to-settings">
            ← 返回设置
          </button>
        }
        title={title}
        description={description}
      />
      {children}
    </div>
  );
}
