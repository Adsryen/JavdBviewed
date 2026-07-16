export interface MarkWorksAsReadWorkflowDeps {
  markAsRead(workIds: string[]): Promise<void>;
  render(): Promise<void>;
  logError(message: string, error: unknown): void;
}

export interface RunMarkWorksAsReadWorkflowInput {
  workIds: string[];
  deps: MarkWorksAsReadWorkflowDeps;
}

export async function runMarkWorksAsReadWorkflow(input: RunMarkWorksAsReadWorkflowInput): Promise<void> {
  const { workIds, deps } = input;

  try {
    await deps.markAsRead(workIds);
    await deps.render();
  } catch (error) {
    deps.logError('标记已读失败:', error);
  }
}

export interface VisitWorkQueryResult {
  works: Array<{
    id: string;
    javdbUrl: string;
  }>;
}

export interface VisitWorkWorkflowDeps {
  getNewWorks(query: { search: string }): Promise<VisitWorkQueryResult>;
  openUrl(url: string): void;
  markWorksAsRead(workIds: string[]): Promise<void>;
  logError(message: string, error: unknown): void;
}

export interface RunVisitWorkWorkflowInput {
  workId: string;
  deps: VisitWorkWorkflowDeps;
}

export async function runVisitWorkWorkflow(input: RunVisitWorkWorkflowInput): Promise<void> {
  const { workId, deps } = input;

  try {
    const result = await deps.getNewWorks({ search: workId });
    const work = result.works.find(candidate => candidate.id === workId);
    if (!work) return;

    deps.openUrl(work.javdbUrl);
    await deps.markWorksAsRead([workId]);
  } catch (error) {
    deps.logError('访问作品失败:', error);
  }
}

export interface DeleteWorksWorkflowDeps {
  confirm(message: string): boolean;
  deleteWorks(workIds: string[]): Promise<void>;
  clearSelection(): void;
  render(): Promise<void>;
  logError(message: string, error: unknown): void;
}

export interface RunDeleteWorksWorkflowInput {
  workIds: string[];
  deps: DeleteWorksWorkflowDeps;
}

export async function runDeleteWorksWorkflow(input: RunDeleteWorksWorkflowInput): Promise<void> {
  const { workIds, deps } = input;

  if (!deps.confirm(`确定要删除 ${workIds.length} 个作品吗？`)) {
    return;
  }

  try {
    await deps.deleteWorks(workIds);
    deps.clearSelection();
    await deps.render();
  } catch (error) {
    deps.logError('删除作品失败:', error);
  }
}
