import type { MergeOptions } from '../../features/webdavSync/application/dataDiff';

export interface QuickRestoreModalStats {
  localRecordsCount: number;
  localActorsCount: number;
  cloudNewDataCount: number;
  conflictsCount: number;
}

export function buildQuickRestoreModalStats(diffResult: any): QuickRestoreModalStats {
  const videoSummary = diffResult?.videoRecords?.summary || {};
  const actorSummary = diffResult?.actorRecords?.summary || {};

  return {
    localRecordsCount: readNumber(videoSummary.totalLocal),
    localActorsCount: readNumber(actorSummary.totalLocal),
    cloudNewDataCount: readNumber(videoSummary.cloudOnlyCount) + readNumber(actorSummary.cloudOnlyCount),
    conflictsCount: readNumber(videoSummary.conflictCount) + readNumber(actorSummary.conflictCount),
  };
}

export function buildQuickRestoreConfirmHtml(diffResult: any): string {
  const stats = buildQuickRestoreModalStats(diffResult);

  return `
            <div style="line-height: 1.8;">
                <p style="margin: 0 0 16px 0; font-weight: 600;">确认执行一键智能恢复？</p>
                
                <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0 0 12px 0; font-weight: 600; color: var(--text-primary);">📊 操作预览：</p>
                    <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary);">
                        <li>保留本地视频记录：<strong>${formatCount(stats.localRecordsCount)}</strong> 条</li>
                        <li>保留本地演员收藏：<strong>${formatCount(stats.localActorsCount)}</strong> 个</li>
                        <li>添加云端新增数据：<strong>${formatCount(stats.cloudNewDataCount)}</strong> 项</li>
                        <li>自动处理冲突：<strong>${formatCount(stats.conflictsCount)}</strong> 个（保留最新数据）</li>
                    </ul>
                </div>
                
                <div class="alert-warning">
                    <p>⚠️ 注意：此操作将修改您的本地数据，建议在操作前确保已备份重要信息。</p>
                </div>
            </div>
        `;
}

export function buildQuickRestoreMergeOptions(): MergeOptions {
  return {
    strategy: 'smart',
    restoreSettings: false,
    restoreRecords: true,
    restoreUserProfile: true,
    restoreActorRecords: true,
    restoreLogs: false,
    restoreImportStats: true,
    restoreNewWorks: true,
  };
}

function readNumber(value: unknown): number {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatCount(value: number): string {
  return value.toLocaleString();
}
