/**
 * @file Media115CleanupPanel.tsx
 * @description 真实已看 → 115 待清理清单 UI
 * @module apps/dashboard/pages/media
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../../ui/primitives/Button/Button';
import {
  loadCleanupList,
  processPendingCleanup,
  removeCleanupItem,
} from '../../../../features/drive115/v2/drive115CleanupActions';
import {
  listPendingCleanup,
  type Drive115CleanupListState,
  EMPTY_CLEANUP_LIST,
} from '../../../../features/drive115/v2/drive115CleanupModel';

export type Media115CleanupPanelProps = {
  onClose?: () => void;
  /** 外部刷新信号 */
  refreshKey?: number;
};

/**
 * 待清理清单：展示 pending，支持移除 / 尝试批量删除
 */
export function Media115CleanupPanel({ onClose, refreshKey = 0 }: Media115CleanupPanelProps) {
  const [state, setState] = useState<Drive115CleanupListState>(EMPTY_CLEANUP_LIST);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const reload = useCallback(async () => {
    const next = await loadCleanupList();
    setState(next);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  const pending = listPendingCleanup(state);

  const onProcess = async () => {
    if (busy || pending.length === 0) return;
    if (!window.confirm(`尝试处理 ${pending.length} 条待清理项？\n\n注意：当前 115 OpenAPI 可能无法直接删除网盘文件，失败项会保留并显示原因。`)) {
      return;
    }
    setBusy(true);
    setMessage('处理中…');
    try {
      const ret = await processPendingCleanup();
      setState(ret.state);
      setMessage(`已尝试 ${ret.attempted} 条，失败 ${ret.failed} 条（见列表状态）`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ml-cleanup-panel" data-media-115-cleanup="1">
      <div className="ml-cleanup-head">
        <div>
          <strong>115 待清理</strong>
          <span className="ml-cleanup-count">{pending.length} 待处理</span>
        </div>
        <div className="ml-cleanup-actions">
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void reload()}>
            刷新
          </Button>
          <Button size="sm" disabled={busy || pending.length === 0} onClick={() => void onProcess()}>
            {busy ? '处理中…' : '尝试清理'}
          </Button>
          {onClose ? (
            <button type="button" className="ml-115-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
          ) : null}
        </div>
      </div>
      <p className="ml-cleanup-hint">
        从「真实已看」加入清单后，可在此批量处理。删除网盘文件依赖 115 OpenAPI；未接通时请按失败原因到 115 网页处理。
      </p>
      {message ? <p className="ml-cleanup-msg">{message}</p> : null}
      {state.items.length === 0 ? (
        <p className="ml-cleanup-empty">清单为空。在已索引且真实已看的卡片上点「加入 115 清理」。</p>
      ) : (
        <ul className="ml-cleanup-list">
          {state.items.map((item) => (
            <li key={item.id} className={`ml-cleanup-item is-${item.status}`}>
              <div className="ml-cleanup-main">
                <span className="ml-cleanup-code">{item.code}</span>
                <span className="ml-cleanup-title">{item.title}</span>
                <span className="ml-cleanup-status">{item.status}</span>
              </div>
              <div className="ml-cleanup-sub">
                {item.fileName || item.fileId || item.pickCode || '未绑定 115 文件'}
                {item.error ? ` · ${item.error}` : ''}
              </div>
              <div className="ml-cleanup-row-actions">
                <button
                  type="button"
                  className="ml-watch-btn"
                  onClick={() => {
                    void removeCleanupItem(item.id).then(setState);
                  }}
                >
                  移除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
