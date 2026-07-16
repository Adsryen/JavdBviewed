export interface UpdateBatchOpenUnreadButtonStateInput {
  loading?: boolean;
  cooldownSeconds: number;
  maxOpenCount: number;
  doc?: Document;
}

export function updateBatchOpenUnreadButtonState(input: UpdateBatchOpenUnreadButtonStateInput): void {
  const { loading, cooldownSeconds, maxOpenCount, doc = document } = input;
  const btn = doc.getElementById('batchOpenUnreadBtn') as HTMLButtonElement | null;
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在打开...';
    return;
  }

  if (cooldownSeconds > 0) {
    btn.disabled = true;
    btn.title = `打开当前页所有未读新作品（最多 ${maxOpenCount} 个，冷却剩余 ${cooldownSeconds} 秒）`;
    btn.innerHTML = `<i class="fas fa-hourglass-half"></i> 冷却中（${cooldownSeconds}s）`;
    return;
  }

  btn.disabled = false;
  btn.title = `打开当前页所有未读新作品（最多 ${maxOpenCount} 个，15 秒冷却）`;
  btn.innerHTML = '<i class="fas fa-external-link-alt"></i> 批量打开未读（当页）';
}

export function setSyncStatusButtonLoading(loading: boolean, doc: Document = document): void {
  const syncBtn = doc.getElementById('syncStatusBtn') as HTMLButtonElement | null;
  const btnContent = syncBtn?.querySelector('.btn-content');
  if (!syncBtn) return;

  syncBtn.disabled = loading;
  const html = loading
    ? '<i class="fas fa-spinner fa-spin"></i> 同步中...'
    : '<i class="fas fa-sync-alt"></i> 同步状态';
  if (btnContent) {
    btnContent.innerHTML = html;
  } else {
    syncBtn.innerHTML = html;
  }
}

export function setCheckNowButtonLoading(loading: boolean, doc: Document = document): void {
  const checkBtn = doc.getElementById('checkNowBtn') as HTMLButtonElement | null;
  if (!checkBtn) return;

  checkBtn.disabled = loading;
  checkBtn.innerHTML = loading
    ? '<i class="fas fa-spinner fa-spin"></i> 检查中...'
    : '<i class="fas fa-sync-alt"></i> 立即检查';
}

export interface SetBatchDeleteSelectedButtonLoadingInput {
  loading: boolean;
  selectedCount: number;
  doc?: Document;
}

export function setBatchDeleteSelectedButtonLoading(input: SetBatchDeleteSelectedButtonLoadingInput): void {
  const { loading, selectedCount, doc = document } = input;
  const btn = doc.getElementById('batchDeleteSelectedBtn') as HTMLButtonElement | null;
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 删除中...';
    return;
  }

  btn.disabled = selectedCount === 0;
  btn.innerHTML = '<i class="fas fa-trash-alt"></i> 删除已选';
}
