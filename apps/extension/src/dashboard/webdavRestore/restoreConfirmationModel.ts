export interface RestoreConfirmationDiffSummary {
  videoCount: number;
  actorCount: number;
  subscriptionCount: number;
  recordCount: number;
}

export interface RestoreConfirmationInput {
  strategy: string;
  selectedContent: string[];
  contentLabels: Record<string, string>;
  diffSummary: RestoreConfirmationDiffSummary;
}

const STRATEGY_LABELS: Record<string, string> = {
  smart: '智能合并',
  local: '保留本地',
  cloud: '使用云端',
  manual: '手动处理',
};

export function getRestoreStrategyLabel(strategy: string): string {
  return STRATEGY_LABELS[strategy] || strategy;
}

export function buildRestoreConfirmationHtml(input: RestoreConfirmationInput): string {
  return `
        <div class="summary-section">
            <h5><i class="fas fa-cog"></i> 恢复策略</h5>
            <p>${escapeHtml(getRestoreStrategyLabel(input.strategy))}</p>
        </div>
        <div class="summary-section">
            <h5><i class="fas fa-list"></i> 恢复内容</h5>
            <ul>
                ${input.selectedContent.map(id => `<li>${escapeHtml(input.contentLabels[id] || id)}</li>`).join('')}
            </ul>
        </div>
        <div class="summary-section">
            <h5><i class="fas fa-chart-bar"></i> 预期结果</h5>
            <div class="result-stats">
                <div class="stat">
                    <span class="stat-label">视频记录：</span>
                    <span class="stat-value">${formatCount(input.diffSummary.videoCount)} 条</span>
                </div>
                <div class="stat">
                    <span class="stat-label">演员收藏：</span>
                    <span class="stat-value">${formatCount(input.diffSummary.actorCount)} 个</span>
                </div>
                <div class="stat">
                    <span class="stat-label">新作品订阅：</span>
                    <span class="stat-value">${formatCount(input.diffSummary.subscriptionCount)} 个</span>
                </div>
                <div class="stat">
                    <span class="stat-label">新作品记录：</span>
                    <span class="stat-value">${formatCount(input.diffSummary.recordCount)} 条</span>
                </div>
            </div>
        </div>
    `;
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
