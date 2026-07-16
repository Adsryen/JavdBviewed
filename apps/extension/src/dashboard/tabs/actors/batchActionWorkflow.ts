import { buildActorBatchResultMessage } from './batchOperationModel';

export interface ActorBatchWorkflowResult {
  successCount: number;
  failCount: number;
}

export interface ActorBatchWorkflowInput<T> {
  actionName: string;
  items: T[];
  runItem(item: T): Promise<void>;
  afterComplete(): Promise<void> | void;
  showMessage(message: string, type: 'success' | 'warning'): void;
  logItemError(item: T, error: unknown): void;
}

export async function runActorBatchWorkflow<T>(
  input: ActorBatchWorkflowInput<T>,
): Promise<ActorBatchWorkflowResult> {
  let successCount = 0;
  let failCount = 0;

  for (const item of input.items) {
    try {
      await input.runItem(item);
      successCount++;
    } catch (error) {
      input.logItemError(item, error);
      failCount++;
    }
  }

  await input.afterComplete();

  input.showMessage(
    buildActorBatchResultMessage(input.actionName, successCount, failCount),
    failCount > 0 ? 'warning' : 'success',
  );

  return { successCount, failCount };
}
