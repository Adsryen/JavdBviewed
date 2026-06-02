export interface CreateRecordsBatchAddTagControllerOptions {
  getSelectedCount: () => number;
  onSubmit: (tags: string[]) => void | Promise<void>;
  showMessage: (message: string, level: 'warning' | 'success' | 'error') => void;
}

export interface RecordsBatchAddTagController {
  openBatchAddTag: () => void;
}

export function createRecordsBatchAddTagController(
  options: CreateRecordsBatchAddTagControllerOptions,
): RecordsBatchAddTagController {
  const openBatchAddTag = () => {
    if (options.getSelectedCount() === 0) return;

    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
      <div class="custom-confirm-overlay"></div>
      <div class="custom-confirm-content">
        <div class="custom-confirm-header">
          <h3>批量添加标签</h3>
        </div>
        <div class="custom-confirm-body">
          <p>将为已选 <strong>${options.getSelectedCount()}</strong> 条视频追加标签（不影响已有标签）。</p>
          <p style="font-size:12px;color:var(--text-secondary);margin-top:6px;">操作完成后，这些视频的标签字段将被锁定，防止同步时被覆盖。</p>
          <input id="batchTagInput" type="text" placeholder="输入标签，多个用逗号分隔"
            style="width:100%;margin-top:12px;padding:8px 12px;border:1px solid var(--border-primary);border-radius:8px;font-size:14px;color:var(--text-primary);background:var(--surface-secondary);box-sizing:border-box;" />
        </div>
        <div class="custom-confirm-footer">
          <button class="custom-confirm-cancel">取消</button>
          <button class="custom-confirm-ok">确认添加</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#batchTagInput') as HTMLInputElement;
    const overlay = modal.querySelector('.custom-confirm-overlay') as HTMLElement;
    const cancelBtn = modal.querySelector('.custom-confirm-cancel') as HTMLButtonElement;
    const okBtn = modal.querySelector('.custom-confirm-ok') as HTMLButtonElement;

    setTimeout(() => input?.focus(), 50);

    const close = () => modal.remove();

    overlay.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    okBtn.addEventListener('click', async () => {
      const raw = (input?.value || '').trim();
      if (!raw) {
        options.showMessage('请输入至少一个标签', 'warning');
        return;
      }
      const newTags = raw.split(/[，,;；]/).map((t) => t.trim()).filter(Boolean);
      if (newTags.length === 0) {
        options.showMessage('请输入有效标签', 'warning');
        return;
      }
      close();
      await options.onSubmit(newTags);
    });

    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') okBtn.click();
      if (e.key === 'Escape') close();
    });

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  };

  return { openBatchAddTag };
}
