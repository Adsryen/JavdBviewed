import type { ActorRecord } from '../../../types';

type MessageType = 'success' | 'error' | 'info' | 'warning';
type ConfirmType = 'danger' | 'warning' | 'info';

export interface ActorConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: ConfirmType;
}

export interface OpenActorWorksWorkflowDeps {
  getActorById(actorId: string): Promise<ActorRecord | undefined | null>;
  buildActorUrl(path: string): Promise<string>;
  openUrl(url: string): void;
  showMessage(message: string, type: MessageType): void;
  log(level: 'INFO', message: string, data?: unknown): void | Promise<void>;
  logError(context: string, error: unknown): void;
}

export interface EditActorSourceDataWorkflowDeps {
  getActorById(actorId: string): Promise<ActorRecord | undefined | null>;
  showActorEditModal(actor: ActorRecord): void;
  showMessage(message: string, type: MessageType): void;
  logError(context: string, error: unknown): void;
}

export interface DeleteActorWorkflowDeps {
  confirm(options: ActorConfirmOptions): Promise<boolean>;
  deleteActor(actorId: string): Promise<boolean>;
  reloadActors(): Promise<void>;
  refreshStats(): Promise<void>;
  showMessage(message: string, type: MessageType): void;
  logError(context: string, error: unknown): void;
}

export async function openActorWorksWorkflow(actorId: string, deps: OpenActorWorksWorkflowDeps): Promise<void> {
  try {
    const actor = await deps.getActorById(actorId);
    if (!actor) {
      deps.showMessage('演员信息不存在', 'error');
      return;
    }

    const actorWorksUrl = await deps.buildActorUrl(`/actors/${actorId}`);
    deps.openUrl(actorWorksUrl);

    void deps.log('INFO', '打开演员作品列表', {
      actorId,
      actorName: actor.name,
      url: actorWorksUrl,
    });
  } catch (error) {
    deps.logError('[Actor] Failed to open actor works:', error);
    deps.showMessage('打开演员作品列表失败', 'error');
  }
}

export async function editActorSourceDataWorkflow(
  actorId: string,
  deps: EditActorSourceDataWorkflowDeps,
): Promise<void> {
  try {
    const actor = await deps.getActorById(actorId);
    if (!actor) {
      deps.showMessage('演员信息不存在', 'error');
      return;
    }

    deps.showActorEditModal(actor);
  } catch (error) {
    deps.logError('[Actor] Failed to edit actor source data:', error);
    deps.showMessage('打开编辑界面失败', 'error');
  }
}

export async function deleteActorWorkflow(actorId: string, deps: DeleteActorWorkflowDeps): Promise<void> {
  const confirmed = await deps.confirm({
    title: '删除演员',
    message: '确定要删除这个演员吗？\n\n此操作不可撤销！',
    confirmText: '确认删除',
    cancelText: '取消',
    type: 'danger',
  });

  if (!confirmed) {
    return;
  }

  try {
    const success = await deps.deleteActor(actorId);
    if (success) {
      deps.showMessage('演员已删除', 'success');
      await deps.reloadActors();
      await deps.refreshStats();
      return;
    }

    deps.showMessage('删除失败', 'error');
  } catch (error) {
    deps.logError('[Actor] Failed to delete actor:', error);
    deps.showMessage('删除失败', 'error');
  }
}
