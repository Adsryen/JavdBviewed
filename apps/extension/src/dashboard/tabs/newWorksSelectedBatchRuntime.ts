import type { ResolvedSelectedWork } from './newWorksSelectedBatchWorkflow';

export interface SetBatchOpenSelectedButtonLoadingInput {
  loading: boolean;
  selectedCount: number;
  doc?: Document;
}

export function setBatchOpenSelectedButtonLoading(input: SetBatchOpenSelectedButtonLoadingInput): void {
  const { loading, selectedCount, doc = document } = input;
  const btn = doc.getElementById('batchOpenSelectedBtn') as HTMLButtonElement | null;
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在打开...';
    return;
  }

  btn.disabled = selectedCount === 0;
  btn.innerHTML = '<i class="fas fa-external-link-alt"></i> 批量打开（已选）';
}

export function getSelectedBatchCurrentPageWork(
  id: string,
  doc: Document = document,
): ResolvedSelectedWork | undefined {
  const item = doc.querySelector(`.new-work-item[data-work-id="${id}"]`) as HTMLElement | null;
  const url = item?.getAttribute('data-javdb-url') || '';
  if (!item || !url) {
    return undefined;
  }

  return {
    id,
    url,
    isRead: item.classList.contains('read'),
  };
}
