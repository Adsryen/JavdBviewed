import type { ActorRecord, ActorSubscription } from '../../types';

type MessageType = 'success' | 'error' | 'info' | 'warn' | 'warning';

export interface AddSubscriptionWorkflowDeps {
  initialize(): Promise<void>;
  getSubscriptions(): Promise<ActorSubscription[]>;
  showActorSelector(subscribedIds: string[], onSelected: (selectedActors: ActorRecord[]) => Promise<void>): void;
  addSubscription(actorId: string): Promise<void>;
  render(): Promise<void>;
  showMessage(message: string, type: MessageType): void;
  logInfo(message: string, data?: unknown): void;
  logError(message: string, error: unknown): void;
}

export interface RunAddSubscriptionWorkflowInput {
  deps: AddSubscriptionWorkflowDeps;
}

export async function runAddSubscriptionWorkflow(input: RunAddSubscriptionWorkflowInput): Promise<void> {
  const { deps } = input;

  try {
    deps.logInfo('开始显示添加订阅弹窗');
    await deps.initialize();

    const subscriptions = await deps.getSubscriptions();
    const subscribedIds = subscriptions.map(subscription => subscription.actorId);
    deps.logInfo('已订阅演员ID:', subscribedIds);

    deps.showActorSelector(subscribedIds, async selectedActors => {
      try {
        deps.logInfo('选择的演员:', selectedActors);
        for (const actor of selectedActors) {
          await deps.addSubscription(actor.id);
        }

        await deps.render();
        deps.showMessage(`成功添加 ${selectedActors.length} 个演员订阅`, 'success');
      } catch (error) {
        deps.logError('添加订阅失败:', error);
        deps.showMessage(`添加订阅失败，请重试: ${(error as any).message}`, 'error');
      }
    });
  } catch (error) {
    deps.logError('显示添加订阅弹窗失败:', error);
    deps.showMessage(`加载失败，请重试: ${(error as any).message}`, 'error');
  }
}
