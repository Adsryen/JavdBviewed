/**
 * @file orchestrationDiagnosticsBundle.test.ts
 * @description 诊断包 builder 单测
 */
import { describe, expect, it } from 'vitest';
import {
  buildOrchestrationDiagnosticsBundle,
  enrichTaskDetailRecord,
  stringifyDiagnosticsBundle,
  thinTaskCenterTask,
} from './orchestrationDiagnosticsBundle';

describe('orchestrationDiagnosticsBundle', () => {
  it('enriches bucket and queueAgeMs', () => {
    const enriched = enrichTaskDetailRecord({
      label: 'videoEnhancement:translateCurrentTitle:request',
      registeredAt: 1000,
      startedAt: 1500,
    });
    expect(enriched.bucket).toBe('translate');
    expect(enriched.queueAgeMs).toBe(500);
  });

  it('builds stable schema with truncation flags', () => {
    const details = Array.from({ length: 5 }, (_, i) => ({
      label: `videoStatus:update`,
      timestamp: 1000 - i,
      registeredAt: 100,
      startedAt: 200,
    }));
    const bundle = buildOrchestrationDiagnosticsBundle({
      extensionVersion: '1.21.3',
      exportedAt: 42,
      alarmDiagnostics: { 'newWorks.periodic_check': { lastResult: 'success' } },
      taskCenterTasks: [
        { label: 'drive115:push', status: 'queued', waitReason: 'bucket:drive115-push' },
      ],
      taskDetails: details,
      limits: { taskDetailsMax: 3, taskCenterMax: 10 },
      meta: { note: 'repro' },
    });

    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.exportedAt).toBe(42);
    expect(bundle.extensionVersion).toBe('1.21.3');
    expect(bundle.alarmDiagnostics?.['newWorks.periodic_check']).toBeTruthy();
    expect(bundle.taskDetails?.records).toHaveLength(3);
    expect(bundle.taskDetails?.truncated).toBe(true);
    expect(bundle.taskDetails?.records[0].bucket).toBe('videoStatus');
    expect(bundle.taskCenter?.tasks[0].bucket).toBe('drive115-push');
    expect(bundle.meta?.note).toBe('repro');

    const text = stringifyDiagnosticsBundle(bundle);
    expect(text).toContain('"schemaVersion": 1');
    expect(JSON.parse(text).extensionVersion).toBe('1.21.3');
  });

  it('thins task center rows', () => {
    const thin = thinTaskCenterTask({
      label: 'videoEnhancement:runTitle',
      status: 'running',
      tabId: 3,
    });
    expect(thin.bucket).toBe('video-light');
    expect(thin.tabId).toBe(3);
  });
});
