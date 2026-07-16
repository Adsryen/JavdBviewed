import type { DataDiffResult } from '../../features/webdavSync/application/dataDiff';

export function buildStrategyPreviewHtml(strategy: string, diffResult: DataDiffResult): string {
  switch (strategy) {
    case 'smart':
      return buildSmartPreview(diffResult);
    case 'local':
      return buildLocalPreview(diffResult);
    case 'cloud':
      return buildCloudPreview(diffResult);
    case 'manual':
      return buildManualPreview(diffResult);
    default:
      return '';
  }
}

function buildSmartPreview(diffResult: DataDiffResult): string {
  return `
    <div class="preview-section">
        <h6><i class="fas fa-check-circle text-success"></i> 将会保留：</h6>
        <ul>
            <li>本地视频记录：${formatCount(diffResult.videoRecords.summary.totalLocal)} 条</li>
            <li>本地演员收藏：${formatCount(diffResult.actorRecords.summary.totalLocal)} 个</li>
            <li>本地设置配置</li>
        </ul>
    </div>
    <div class="preview-section">
        <h6><i class="fas fa-plus-circle text-info"></i> 将会添加：</h6>
        <ul>
            <li>云端新增视频：${formatCount(diffResult.videoRecords.summary.cloudOnlyCount)} 条</li>
            <li>云端新增演员：${formatCount(diffResult.actorRecords.summary.cloudOnlyCount)} 个</li>
            <li>云端新增新作品订阅：${formatCount(diffResult.newWorks.subscriptions.summary.cloudOnlyCount)} 个</li>
            <li>云端新增新作品记录：${formatCount(diffResult.newWorks.records.summary.cloudOnlyCount)} 条</li>
        </ul>
    </div>
    <div class="preview-section">
        <h6><i class="fas fa-exclamation-triangle text-warning"></i> 需要处理：</h6>
        <ul>
            <li>冲突视频记录：${formatCount(diffResult.videoRecords.summary.conflictCount)} 条 → 自动选择最新</li>
            <li>冲突演员记录：${formatCount(diffResult.actorRecords.summary.conflictCount)} 个 → 自动选择最新</li>
            <li>冲突新作品订阅：${formatCount(diffResult.newWorks.subscriptions.summary.conflictCount)} 个</li>
            <li>冲突新作品记录：${formatCount(diffResult.newWorks.records.summary.conflictCount)} 条</li>
        </ul>
    </div>
  `;
}

function buildLocalPreview(diffResult: DataDiffResult): string {
  return `
    <div class="preview-section">
        <h6><i class="fas fa-shield-alt text-success"></i> 保持现状：</h6>
        <p>完全保留本地数据，不会有任何改变。云端备份将被忽略。</p>
        <ul>
            <li>本地视频记录：${formatCount(diffResult.videoRecords.summary.totalLocal)} 条（保持不变）</li>
            <li>本地演员收藏：${formatCount(diffResult.actorRecords.summary.totalLocal)} 个（保持不变）</li>
        </ul>
    </div>
  `;
}

function buildCloudPreview(diffResult: DataDiffResult): string {
  return `
    <div class="preview-section">
        <h6><i class="fas fa-cloud-download-alt text-info"></i> 完全恢复：</h6>
        <p>使用云端备份完全覆盖本地数据。</p>
        <ul>
            <li>视频记录：恢复到 ${formatCount(diffResult.videoRecords.summary.totalCloud)} 条</li>
            <li>演员收藏：恢复到 ${formatCount(diffResult.actorRecords.summary.totalCloud)} 个</li>
        </ul>
    </div>
    <div class="preview-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>注意：</strong>本地独有的 ${formatCount(diffResult.videoRecords.summary.localOnlyCount)} 条视频记录将会丢失！
    </div>
  `;
}

function buildManualPreview(diffResult: DataDiffResult): string {
  const conflictCount = diffResult.videoRecords.summary.conflictCount + diffResult.actorRecords.summary.conflictCount;

  return `
    <div class="preview-section">
        <h6><i class="fas fa-hand-paper text-primary"></i> 手动控制：</h6>
        <p>您将能够查看每个冲突项的详细信息，并手动选择保留方式。</p>
        <ul>
            <li>需要处理的视频冲突：${formatCount(diffResult.videoRecords.summary.conflictCount)} 个</li>
            <li>需要处理的演员冲突：${formatCount(diffResult.actorRecords.summary.conflictCount)} 个</li>
            <li>预计处理时间：${Math.ceil(conflictCount / 10)} 分钟</li>
        </ul>
    </div>
  `;
}

function formatCount(value: number): string {
  return value.toLocaleString();
}
