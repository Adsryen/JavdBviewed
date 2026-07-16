/**
 * @file telemetryStartup.ts
 * @description 后台 telemetry 启动前的设备身份初始化编排
 * @module apps/background
 */

export type BackgroundTelemetryStartupDependencies = {
  ensureClientIdentity: () => Promise<unknown>;
  initializeTelemetry: () => Promise<void>;
  logWarning?: (message: string, context: { error: string }) => void;
};

export async function initializeTelemetryAfterClientIdentity(
  dependencies: BackgroundTelemetryStartupDependencies,
): Promise<void> {
  try {
    await dependencies.ensureClientIdentity();
  } catch (error) {
    dependencies.logWarning?.(
      '[Background] Failed to ensure WebDAV client identity before telemetry',
      { error: error instanceof Error ? error.message : String(error) },
    );
  }

  await dependencies.initializeTelemetry();
}
