/**
 * @file OverlayShell.tsx
 * @description 通用全屏/大尺寸遮罩容器（详情、播放器等复用）
 * @module ui/patterns/OverlayShell
 */
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';
import './OverlayShell.css';

export type OverlayShellSize = 'lg' | 'xl' | 'full';
export type OverlayWindowState = 'normal' | 'maximized' | 'minimized';

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
  /** 隐藏顶部标题栏（播放器自带片内 chrome 时使用） */
  hideHeader?: boolean;
  /**
   * 显示窗口控件：最小化 / 最大化(网页内全屏铺满) / 关闭
   * 详情弹窗建议开启
   */
  windowControls?: boolean;
  /** 受控窗口态；不传则组件内自管 */
  windowState?: OverlayWindowState;
  onWindowStateChange?: (state: OverlayWindowState) => void;
};

/**
 * 通用弹层壳：Esc 关闭、锁滚动、窗口最小化/最大化
 * 最小化时仍挂载 children，避免详情重新拉取。
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
  hideHeader = false,
  windowControls = false,
  windowState: windowStateProp,
  onWindowStateChange,
}: OverlayShellProps) {
  const [internalState, setInternalState] = useState<OverlayWindowState>('normal');
  const windowState = windowStateProp ?? internalState;

  const setWindowState = (next: OverlayWindowState) => {
    if (windowStateProp == null) setInternalState(next);
    onWindowStateChange?.(next);
  };

  useEffect(() => {
    if (!open) {
      if (windowStateProp == null) setInternalState('normal');
      return undefined;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (windowState === 'maximized') {
        setWindowState('normal');
        return;
      }
      if (windowState === 'minimized') {
        setWindowState('normal');
        return;
      }
      onClose();
    };
    const prev = document.body.style.overflow;
    if (windowState !== 'minimized') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setWindowState 闭包读最新 windowState
  }, [open, onClose, windowState, windowStateProp]);

  if (!open) return null;

  const isMinimized = windowState === 'minimized';
  const isMaximized = windowState === 'maximized';

  return (
    <div
      className={cn(
        'ui-overlay-shell',
        isMaximized && 'ui-overlay-shell--maximized',
        isMinimized && 'ui-overlay-shell--minimized',
      )}
      data-ui-pattern="overlay-shell"
      data-window-state={windowState}
      role="presentation"
    >
      {isMinimized ? null : (
        <button
          type="button"
          className="ui-overlay-shell__backdrop"
          aria-label="关闭遮罩"
          onClick={() => {
            if (closeOnBackdrop) onClose();
          }}
        />
      )}

      {isMinimized ? (
        <button
          type="button"
          className="ui-overlay-shell__mini-bar"
          onClick={() => setWindowState('normal')}
          title="点击还原窗口"
        >
          <span className="ui-overlay-shell__mini-title">{title}</span>
          <span className="ui-overlay-shell__window-btns" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ui-overlay-shell__win-btn"
              aria-label="还原"
              title="还原"
              onClick={() => setWindowState('normal')}
            >
              ▢
            </button>
            <button
              type="button"
              className="ui-overlay-shell__win-btn ui-overlay-shell__win-btn--close"
              aria-label="关闭"
              title="关闭"
              onClick={onClose}
            >
              ✕
            </button>
          </span>
        </button>
      ) : null}

      {/* 最小化时隐藏但保持挂载，避免详情/播放状态丢失 */}
      <div
        role="dialog"
        aria-modal={!isMinimized}
        aria-label={title}
        aria-hidden={isMinimized}
        hidden={isMinimized}
        className={cn(
          'ui-overlay-shell__panel',
          size === 'lg' && 'ui-overlay-shell__panel--lg',
          size === 'xl' && 'ui-overlay-shell__panel--xl',
          size === 'full' && 'ui-overlay-shell__panel--full',
          isMaximized && 'ui-overlay-shell__panel--maximized',
          hideHeader && 'ui-overlay-shell__panel--no-header',
          isMinimized && 'ui-overlay-shell__panel--parked',
          className,
        )}
      >
        {hideHeader ? null : (
          <header className="ui-overlay-shell__header">
            <h2 className="ui-overlay-shell__title">{title}</h2>
            <div className="ui-overlay-shell__window-btns">
              {windowControls ? (
                <>
                  <button
                    type="button"
                    className="ui-overlay-shell__win-btn"
                    aria-label="最小化"
                    title="最小化"
                    onClick={() => setWindowState('minimized')}
                  >
                    —
                  </button>
                  <button
                    type="button"
                    className="ui-overlay-shell__win-btn"
                    aria-label={isMaximized ? '还原' : '最大化'}
                    title={isMaximized ? '还原' : '最大化（铺满页面）'}
                    onClick={() => setWindowState(isMaximized ? 'normal' : 'maximized')}
                  >
                    {isMaximized ? '❐' : '▢'}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="ui-overlay-shell__win-btn ui-overlay-shell__win-btn--close"
                onClick={onClose}
                aria-label="关闭"
                title="关闭"
              >
                ✕
              </button>
            </div>
          </header>
        )}
        <div className="ui-overlay-shell__body">{children}</div>
        {footer ? <footer className="ui-overlay-shell__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
