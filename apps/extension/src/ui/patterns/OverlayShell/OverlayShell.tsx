/**
 * @file OverlayShell.tsx
 * @description 通用全屏/大尺寸遮罩容器（详情、播放器等复用）
 * @module ui/patterns/OverlayShell
 */
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { cn } from '../../lib/cn';
import './OverlayShell.css';

export type OverlayShellSize = 'lg' | 'xl' | 'full';

export type OverlayShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: OverlayShellSize;
  className?: string;
  /** 是否允许点遮罩关闭（播放器可关） */
  closeOnBackdrop?: boolean;
};

/**
 * 通用弹层壳：Esc 关闭、锁滚动、大尺寸对话框
 */
export function OverlayShell({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'xl',
  className,
  closeOnBackdrop = true,
}: OverlayShellProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-overlay-shell" data-ui-pattern="overlay-shell" role="presentation">
      <button
        type="button"
        className="ui-overlay-shell__backdrop"
        aria-label="关闭遮罩"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'ui-overlay-shell__panel',
          size === 'lg' && 'ui-overlay-shell__panel--lg',
          size === 'xl' && 'ui-overlay-shell__panel--xl',
          size === 'full' && 'ui-overlay-shell__panel--full',
          className,
        )}
      >
        <header className="ui-overlay-shell__header">
          <h2 className="ui-overlay-shell__title">{title}</h2>
          <button type="button" className="ui-overlay-shell__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>
        <div className="ui-overlay-shell__body">{children}</div>
        {footer ? <footer className="ui-overlay-shell__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
