import type { ActorSubscription } from '../../types';

type MessageType = 'success' | 'error' | 'info' | 'warn' | 'warning';

export interface ManageSubscriptionsWorkflowDeps {
  getSubscriptions(): Promise<ActorSubscription[]>;
  openSubscriptionManagementModal(subscriptions: ActorSubscription[]): void;
  showMessage(message: string, type: MessageType): void;
  logError(message: string, error: unknown): void;
}

export interface RunManageSubscriptionsWorkflowInput {
  deps: ManageSubscriptionsWorkflowDeps;
}

export async function runManageSubscriptionsWorkflow(input: RunManageSubscriptionsWorkflowInput): Promise<void> {
  const { deps } = input;

  try {
    const subscriptions = await deps.getSubscriptions();

    if (subscriptions.length === 0) {
      deps.showMessage('暂无订阅演员', 'info');
      return;
    }

    deps.openSubscriptionManagementModal(subscriptions);
  } catch (error) {
    deps.logError('显示管理订阅弹窗失败:', error);
    deps.showMessage('加载失败，请重试', 'error');
  }
}
