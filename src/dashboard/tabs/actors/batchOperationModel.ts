export interface BatchSelectionUiState {
  count: number;
  selectedCountText: string;
  showBatchOperations: boolean;
  selectAllChecked: boolean;
  selectAllIndeterminate: boolean;
}

export interface BatchBlacklistMessageInput {
  selectedCount: number;
  blacklistedCount: number;
  notBlacklistedCount: number;
}

export interface BatchSubscribeMessageInput {
  selectedCount: number;
  subscribedCount: number;
  notSubscribedCount: number;
}

export function applyActorPageSelection(
  selectedIds: Set<string>,
  currentPageIds: string[],
  isChecked: boolean,
): Set<string> {
  const nextSelectedIds = new Set(selectedIds);

  for (const actorId of currentPageIds) {
    if (isChecked) {
      nextSelectedIds.add(actorId);
    } else {
      nextSelectedIds.delete(actorId);
    }
  }

  return nextSelectedIds;
}

export function buildBatchSelectionUiState(
  selectedIds: Set<string>,
  currentPageIds: string[],
): BatchSelectionUiState {
  const count = selectedIds.size;
  const currentSelectedCount = currentPageIds.filter(actorId => selectedIds.has(actorId)).length;

  return {
    count,
    selectedCountText: `已选择 ${count} 项`,
    showBatchOperations: count > 0,
    selectAllChecked: currentSelectedCount > 0 && currentSelectedCount === currentPageIds.length,
    selectAllIndeterminate: currentSelectedCount > 0 && currentSelectedCount < currentPageIds.length,
  };
}

export function buildBatchBlacklistConfirmationMessage(input: BatchBlacklistMessageInput): string {
  if (input.blacklistedCount === 0) {
    return `确定要拉黑选中的 ${input.selectedCount} 个演员吗？`;
  }

  if (input.notBlacklistedCount === 0) {
    return `确定要取消拉黑选中的 ${input.selectedCount} 个演员吗？`;
  }

  return `选中的演员中有 ${input.blacklistedCount} 个已拉黑，${input.notBlacklistedCount} 个未拉黑。\n\n点击确认将：\n- 拉黑未拉黑的演员\n- 取消拉黑已拉黑的演员`;
}

export function buildBatchSubscribeConfirmationMessage(input: BatchSubscribeMessageInput): string {
  if (input.subscribedCount === 0) {
    return `确定要订阅选中的 ${input.selectedCount} 个演员吗？`;
  }

  if (input.notSubscribedCount === 0) {
    return `确定要取消订阅选中的 ${input.selectedCount} 个演员吗？`;
  }

  return `选中的演员中有 ${input.subscribedCount} 个已订阅，${input.notSubscribedCount} 个未订阅。\n\n点击确认将：\n- 订阅未订阅的演员\n- 取消订阅已订阅的演员`;
}

export function buildActorBatchResultMessage(actionName: string, successCount: number, failCount: number): string {
  return `${actionName}完成！成功: ${successCount}，失败: ${failCount}`;
}
