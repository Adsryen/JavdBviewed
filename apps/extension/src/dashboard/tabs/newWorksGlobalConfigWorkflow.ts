type MessageType = 'success' | 'error' | 'info' | 'warn' | 'warning';

export interface NewWorksGlobalConfigWorkflowDeps<TConfig = unknown> {
  initialize(): Promise<void>;
  getGlobalConfig(): Promise<TConfig>;
  showConfigModal(config: TConfig): Promise<TConfig | null | undefined>;
  updateGlobalConfig(config: TConfig): Promise<void>;
  restartScheduler(): Promise<void>;
  render(): Promise<void>;
  showMessage(message: string, type: MessageType): void;
  logInfo(message: string, data?: unknown): void;
  logWarn(message: string, error: unknown): void;
  logError(message: string, error: unknown): void;
}

export interface RunNewWorksGlobalConfigWorkflowInput<TConfig = unknown> {
  deps: NewWorksGlobalConfigWorkflowDeps<TConfig>;
}

export async function runNewWorksGlobalConfigWorkflow<TConfig>(
  input: RunNewWorksGlobalConfigWorkflowInput<TConfig>,
): Promise<void> {
  const { deps } = input;

  try {
    deps.logInfo('开始显示设置弹窗');
    await deps.initialize();

    const currentConfig = await deps.getGlobalConfig();
    deps.logInfo('当前配置:', currentConfig);

    const newConfig = await deps.showConfigModal(currentConfig);
    if (newConfig) {
      await deps.updateGlobalConfig(newConfig);
      try {
        await deps.restartScheduler();
      } catch (error) {
        deps.logWarn('重启自动检查失败:', error);
      }
      await deps.render();
      deps.showMessage('设置已保存', 'success');
    } else {
      deps.logInfo('用户取消了设置');
    }
  } catch (error) {
    deps.logError('打开或保存设置失败:', error);
    deps.showMessage(`设置失败，请重试: ${(error as any).message}`, 'error');
  }
}
