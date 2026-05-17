import { showMessage } from '../../../../ui/toast';
import {
  buildTaskDetailsFingerprint,
  getTaskDetailsSourceData,
  getTaskDetailsPageSummarySourceData,
  getPagePath,
  formatTaskDuration,
  formatTaskTimestamp,
  getTaskRegisteredAt,
  getTaskStartedAt,
  getTaskEndedAt,
  getTaskEffectiveEndAt,
  getTaskWaitDurationMs,
  getTaskRunDurationMs,
  getTaskPendingReasonLabel,
  isTerminalTaskStatus,
  getTaskDisplayReason,
  escapeHtml,
  getPageSummaryTasks,
  buildPageSummaryReasonStats,
  buildTaskDetailPageSummaries,
  getTaskDetailsGroupedParents,
} from './taskDetailsData';
import { renderTaskDetailsTable, renderTaskDetailsPageSummaryTable } from './taskDetailsRender';
import { taskDetailsSortHandler, taskDetailsSearchHandler } from './taskDetailsSearch';

type Host = any;

export class TaskDetailsController {
    constructor(public host: Host) {}

    async openTaskDetailsModal(): Promise<void> {
        if (!this.host.taskDetailsModal) return;

        this.host.taskDetailsModal.classList.remove('hidden');
        this.host.taskDetailsModal.classList.add('visible');
        this.host.taskDetailsCurrentPage = 1;
        this.host.taskDetailsSearchQuery = '';
        this.host.taskDetailsFilteredData = [];
        if (this.host.taskDetailsSearch) {
            this.host.taskDetailsSearch.value = '';
        }

        await this.fetchTaskDetails(true);
        this.startTaskDetailsAutoRefresh();
    }

    closeTaskDetailsModal(): void {
        if (!this.host.taskDetailsModal) return;
        this.host.taskDetailsModal.classList.add('hidden');
        this.host.taskDetailsModal.classList.remove('visible');
        this.stopTaskDetailsAutoRefresh();
    }

    startTaskDetailsAutoRefresh(): void {
        this.stopTaskDetailsAutoRefresh();
        this.host.taskDetailsAutoRefreshTimer = window.setInterval(() => {
            if (!this.host.taskDetailsModal || this.host.taskDetailsModal.classList.contains('hidden')) return;
            if (this.host.taskDetailsRefreshing) return;
            void this.refreshTaskDetails(false);
        }, 5000);
    }

    stopTaskDetailsAutoRefresh(): void {
        if (this.host.taskDetailsAutoRefreshTimer) {
            window.clearInterval(this.host.taskDetailsAutoRefreshTimer);
            this.host.taskDetailsAutoRefreshTimer = undefined;
        }
    }

    async refreshTaskDetails(showSpinner: boolean = true): Promise<void> {
        if (!this.host.taskDetailsRefreshBtn) return;
        if (this.host.taskDetailsRefreshing) return;
        this.host.taskDetailsRefreshing = true;

        const icon = this.host.taskDetailsRefreshBtn.querySelector('i');
        if (showSpinner && icon) icon.classList.add('fa-spin');
        if (showSpinner) this.host.taskDetailsRefreshBtn.disabled = true;

        try {
            await this.fetchTaskDetails(showSpinner);
        } finally {
            if (showSpinner && icon) icon.classList.remove('fa-spin');
            if (showSpinner) this.host.taskDetailsRefreshBtn.disabled = false;
            this.host.taskDetailsRefreshing = false;
        }
    }

    async clearTaskDetails(): Promise<void> {
        const confirmed = confirm('确定要清空所有任务执行记录和性能指标吗？此操作不可恢复。');
        if (!confirmed) return;

        try {
            const resp = await new Promise<any>((resolve) => {
                chrome.runtime.sendMessage({ type: 'orchestrator:clearTaskDetails' }, (reply) => {
                    const err = chrome.runtime.lastError;
                    if (err) {
                        console.warn('[Enhancement] Failed to clear task details:', err);
                        resolve({ success: false });
                    } else {
                        resolve(reply);
                    }
                });
            });

            if (resp && resp.success) {
                this.stopTaskDetailsAutoRefresh();
                this.host.unsubscribeOrchestratorEvents();
                this.host.globalOrchestratorState = [];
                this.host.orchestratorTimelineData = [];
                this.host.taskDetailsData = [];
                this.host.taskDetailsFilteredData = [];
                this.host.taskDetailsPageSummaryData = [];
                this.host.taskDetailsPageSummaryFilteredData = [];
                this.host.taskDetailsRenderFingerprint = this.buildTaskDetailsFingerprint([]);
                this.host.taskDetailsCurrentPage = 1;
                this.host.taskDetailsExpandedParents.clear();
                this.host.taskDetailsExpandedPageSummaries.clear();
                this.host.renderTaskDetailsTable();
                this.host.updateTaskDetailsPagination(0, 1);
                this.host.updatePerformanceMetrics({
                    totalTasks: 0, completedTasks: 0, failedTasks: 0, timeoutTasks: 0,
                    avgDuration: 0, maxDuration: 0, minDuration: 0, totalDuration: 0,
                    recordCount: 0, avgTasksPerPage: 0, successRate: 0, maxDurationTask: '', currentQueue: 0, currentRunning: 0,
                });
                if (this.host.taskDetailsSearch) this.host.taskDetailsSearch.value = '';
                if (this.host.taskDetailsSummary) this.host.taskDetailsSummary.textContent = '暂无任务执行记录';
                showMessage('任务明细和性能指标已清空', 'success');
            } else {
                showMessage('清空任务明细失败，请重试', 'error');
            }
        } catch (e) {
            console.error('[Enhancement] Exception when clearing task details:', e);
            showMessage('清空任务明细失败，请重试', 'error');
        }
    }

    async clearGlobalTaskState(): Promise<void> {
        const confirmed = confirm('确定要清空全局任务中心中的任务快照吗？此操作会移除当前缓存的全局任务状态。');
        if (!confirmed) return;

        try {
            const resp = await chrome.runtime.sendMessage({ type: 'task-center:clear' });
            if (!resp?.ok) throw new Error(resp?.error || '清空全局任务失败');
            this.host.globalOrchestratorState = [];
            this.host.orchestratorTimelineData = [];
            if (this.host.orchestratorPhases) this.host.orchestratorPhases.textContent = '';
            if (this.host.orchestratorTimeline) this.host.orchestratorTimeline.textContent = '';
            if (this.host.orchestratorSummary) this.host.orchestratorSummary.textContent = '全局任务快照已清空';
            await this.host.refreshOrchestratorState();
            await this.host.fetchAndUpdateMetrics();
            showMessage('全局任务状态已清空', 'success');
        } catch (error: any) {
            console.error('[Enhancement] Failed to clear global task state:', error);
            showMessage(`清空全局任务失败: ${error?.message || String(error)}`, 'error');
        }
    }

    async stopAllTaskDetails(): Promise<void> {
        const confirmed = confirm('确定要停止所有运行中、等待中、已注册和暂停中的任务吗？这会立即中断当前测试批次。');
        if (!confirmed) return;

        try {
            const resp = await new Promise<any>((resolve) => {
                chrome.runtime.sendMessage({ type: 'orchestrator:stopAllTasks' }, (reply) => {
                    const err = chrome.runtime.lastError;
                    if (err) {
                        console.warn('[Enhancement] Failed to stop all tasks:', err);
                        resolve({ success: false, error: err.message });
                    } else {
                        resolve(reply);
                    }
                });
            });

            if (resp && resp.success) {
                showMessage(`已停止 ${resp.canceled || 0} 个任务，已清理 ${resp.cleared || 0} 条全局记录`, 'success');
                this.host.globalOrchestratorState = [];
                this.host.orchestratorTimelineData = [];
                if (this.host.orchestratorPhases) this.host.orchestratorPhases.textContent = '';
                if (this.host.orchestratorTimeline) this.host.orchestratorTimeline.textContent = '';
                if (this.host.orchestratorSummary) this.host.orchestratorSummary.textContent = `已手动停止 ${resp.canceled || 0} 个任务，已清理 ${resp.cleared || 0} 条全局记录`;
                await this.fetchTaskDetails(false);
                await this.host.refreshOrchestratorState();
                await this.host.fetchAndUpdateMetrics();
            } else {
                showMessage('停止任务失败，请重试', 'error');
            }
        } catch (e) {
            console.error('[Enhancement] Exception when stopping all tasks:', e);
            showMessage('停止任务失败，请重试', 'error');
        }
    }

    buildTaskDetailsFingerprint(rows: any[]): string {
        return buildTaskDetailsFingerprint(rows);
    }

    async fetchTaskDetails(showLoading: boolean = true): Promise<void> {
        try {
            if (showLoading && this.host.taskDetailsTableBody) {
                this.host.taskDetailsTableBody.innerHTML = `
                    <tr><td colspan="10" style="padding:40px; text-align:center; color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> 加载中...</td></tr>
                `;
            }
            const resp = await new Promise<any>((resolve) => {
                try {
                    chrome.runtime.sendMessage({ type: 'orchestrator:getTaskDetails', options: { page: 1, pageSize: 5000 } }, (reply) => {
                        const err = chrome.runtime.lastError;
                        if (err) {
                            console.warn('[Enhancement] Failed to get task details:', err);
                            resolve({ success: false, error: err.message });
                        } else {
                            resolve(reply);
                        }
                    });
                } catch (error: any) {
                    resolve({ success: false, error: error?.message || String(error) });
                }
            });
            if (!resp?.success) throw new Error(resp?.error || '获取任务明细失败');
            const rows = Array.isArray(resp?.details?.details)
                ? resp.details.details
                : Array.isArray(resp?.data?.items)
                    ? resp.data.items
                    : [];
            const fingerprint = this.buildTaskDetailsFingerprint(rows);
            this.host.taskDetailsData = rows;
            this.host.taskDetailsPageSummaryData = this.buildTaskDetailPageSummaries(rows);
            this.host.taskDetailsRenderFingerprint = fingerprint;
            this.host.taskDetailsCurrentPage = 1;
            await this.host.fetchAndUpdateMetrics();
            this.host.renderTaskDetailsTable();
            const total = this.host.getRenderedTaskDetailsCount();
            const totalPages = Math.max(1, Math.ceil(total / this.host.taskDetailsPageSize));
            this.host.updateTaskDetailsPagination(total, totalPages);
        } catch (error: any) {
            console.error('[Enhancement] Failed to fetch task details:', error);
            if (this.host.taskDetailsTableBody) {
                this.host.taskDetailsTableBody.innerHTML = `<tr><td colspan="10" style="padding:40px; text-align:center; color:#ef4444;">加载失败：${this.escapeHtml(error?.message || String(error))}</td></tr>`;
            }
            showMessage(`获取任务明细失败: ${error?.message || String(error)}`, 'error');
        }
    }

    getTaskDetailsSourceData(): any[] { return getTaskDetailsSourceData(this.host); }
    getTaskDetailsPageSummarySourceData(): any[] { return getTaskDetailsPageSummarySourceData(this.host); }
    getPagePath(url?: string): string { return getPagePath(url); }
    formatTaskDuration(ms: number): string { return formatTaskDuration(ms); }
    formatTaskTimestamp(ts: number): string { return formatTaskTimestamp(ts); }
    getTaskRegisteredAt(task: any): number { return getTaskRegisteredAt(task); }
    getTaskStartedAt(task: any): number { return getTaskStartedAt(task); }
    getTaskEndedAt(task: any): number { return getTaskEndedAt(task); }
    getTaskEffectiveEndAt(task: any): number { return getTaskEffectiveEndAt(this, task); }
    getTaskWaitDurationMs(task: any): number { return getTaskWaitDurationMs(task); }
    getTaskRunDurationMs(task: any): number { return getTaskRunDurationMs(this, task); }
    getTaskPendingReasonLabel(waitReason?: string): string { return getTaskPendingReasonLabel(waitReason); }
    isTerminalTaskStatus(status?: string): boolean { return isTerminalTaskStatus(status); }
    getTaskDisplayReason(task: any): string { return getTaskDisplayReason(task); }
    escapeHtml(value: any): string { return escapeHtml(value); }
    getPageSummaryTasks(item: any): any[] { return getPageSummaryTasks(this.host, item); }
    buildPageSummaryReasonStats(tasks: any[]): Array<{ label: string; count: number }> { return buildPageSummaryReasonStats(tasks); }
    buildTaskDetailPageSummaries(tasks: any[]): any[] { return buildTaskDetailPageSummaries(tasks); }
    getTaskDetailsGroupedParents(data: any[]): Array<{ parentKey: string; parent: any; children: any[] }> { return getTaskDetailsGroupedParents(data); }

    getSortedTaskDetailsData(): any[] {
        const dataToRender = this.getTaskDetailsSourceData();
        return [...dataToRender].sort((a, b) => this.compareTaskDetailItems(a, b));
    }

    getTaskDetailSortValue(task: any, sortField: string): string | number {
        if (sortField === 'duration') return task?.durationMs || 0;
        if (sortField === 'createdAt') return this.getTaskRegisteredAt(task);
        if (sortField === 'startedAt') return this.getTaskStartedAt(task);
        if (sortField === 'endedAt') return this.getTaskEffectiveEndAt(task);
        if (sortField === 'waitDurationMs') return this.getTaskWaitDurationMs(task);
        if (sortField === 'runDurationMs') return this.getTaskRunDurationMs(task);
        const rawValue = task?.[sortField];
        return typeof rawValue === 'string' || typeof rawValue === 'number' ? rawValue : 0;
    }

    compareTaskDetailItems(a: any, b: any): number {
        const aVal = this.getTaskDetailSortValue(a, this.host.taskDetailsSortField);
        const bVal = this.getTaskDetailSortValue(b, this.host.taskDetailsSortField);
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return this.host.taskDetailsSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        const aNum = typeof aVal === 'number' ? aVal : 0;
        const bNum = typeof bVal === 'number' ? bVal : 0;
        const isTimeField = ['createdAt', 'startedAt', 'endedAt'].includes(this.host.taskDetailsSortField);
        if (isTimeField) {
            const aMissing = aNum <= 0;
            const bMissing = bNum <= 0;
            if (aMissing !== bMissing) return aMissing ? 1 : -1;
        }
        if (aNum !== bNum) return this.host.taskDetailsSortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        const aRegisteredAt = this.getTaskRegisteredAt(a);
        const bRegisteredAt = this.getTaskRegisteredAt(b);
        if (aRegisteredAt !== bRegisteredAt) return this.host.taskDetailsSortOrder === 'asc' ? aRegisteredAt - bRegisteredAt : bRegisteredAt - aRegisteredAt;
        return String(a?.label || '').localeCompare(String(b?.label || ''));
    }

    getVisibleTaskDetailGroups(includeCollapsedChildren: boolean = false): Array<{ parentKey: string; parent: any; children: any[] }> {
        const groupedParents = this.getTaskDetailsGroupedParents(this.getSortedTaskDetailsData());
        const startIndex = (this.host.taskDetailsCurrentPage - 1) * this.host.taskDetailsPageSize;
        const endIndex = startIndex + this.host.taskDetailsPageSize;
        return groupedParents.slice(startIndex, endIndex).map((group) => ({
            parentKey: group.parentKey,
            parent: group.parent,
            children: (includeCollapsedChildren || this.host.taskDetailsExpandedParents.has(group.parentKey)) ? [...group.children] : [],
        }));
    }

    buildVisibleTaskDetailsTableText(): string {
        if (!this.host.taskDetailsTableBody) {
            return this.host.taskDetailsView === 'pages' ? '(no page summaries)' : '(no task details)';
        }

        const header = this.host.taskDetailsView === 'pages'
            ? '页面实例\t页面类型\t页面ID\t开始时间\t状态\t任务数\t完成数\t失败数\t子任务数\t累计耗时'
            : '任务名称	子任务	阶段	状态	注册时间	开始时间	结束时间	等待执行	执行耗时	页面';

        const lines: string[] = [header];
        if (this.host.taskDetailsView === 'pages') {
            const rows = (this.host.taskDetailsRenderedRows || []).filter((row: any) => row?.__rowType === 'page-summary-parent');
            for (const row of rows) {
                lines.push([
                    getPagePath(row.pageUrl || ''),
                    row.pageType || '-',
                    row.mainId || '-',
                    formatTaskTimestamp(row.startedAt || 0),
                    row.status || 'done',
                    row.parentCount || 0,
                    row.doneCount || 0,
                    row.errorCount || 0,
                    row.childCount || 0,
                    formatTaskDuration(row.totalDurationMs || 0),
                ].join('\t'));

                const tasks = getPageSummaryTasks(this.host, row);
                const groupedParents = getTaskDetailsGroupedParents(tasks);
                for (const group of groupedParents) {
                    const parent = group.parent;
                    const label = parent?.label || group.parentKey;
                    const displayName = this.host.getTaskDisplayNameForExport(label);
                    const phase = parent?.phase || '-';
                    const status = this.host.getStatusLabel(parent?.status || 'unknown');
                    const registeredAt = formatTaskTimestamp(getTaskRegisteredAt(parent) || Date.now());
                    const startedAt = getTaskStartedAt(parent) > 0 ? formatTaskTimestamp(getTaskStartedAt(parent)) : '-';
                    const parentEffectiveEndAt = getTaskEffectiveEndAt(this.host, parent);
                    const endedAt = parentEffectiveEndAt > 0 ? formatTaskTimestamp(parentEffectiveEndAt) : '-';
                    const waitDuration = formatTaskDuration(getTaskWaitDurationMs(parent));
                    const runDuration = formatTaskDuration(getTaskRunDurationMs(this.host, parent));
                    const pagePath = getPagePath(parent?.pageUrl || '');
                    const childCount = group.children.length || 0;
                    const prefix = childCount > 0 ? `▶ ${childCount}` : '';
                    lines.push(`${prefix}${displayName}\t-\t${phase}\t${status}\t${registeredAt}\t${startedAt}\t${endedAt}\t${waitDuration}\t${runDuration}\t${pagePath}`.trim());

                    const detailLine = parent?.detail ? String(parent.detail).replace(/\n/g, ' ') : '';
                    if (detailLine) {
                        lines.push(detailLine);
                    }

                    const children = [...group.children].sort((a, b) => {
                        const ai = typeof a.batchIndex === 'number' ? a.batchIndex : 0;
                        const bi = typeof b.batchIndex === 'number' ? b.batchIndex : 0;
                        return ai - bi;
                    });
                    for (const child of children) {
                        const childLabel = child.label || child.parentLabel || '-';
                        const childMeta = typeof child.batchIndex === 'number'
                            ? `${child.subtaskLabel || '-'} #${child.batchIndex}${typeof child.itemCount === 'number' ? ` · ${child.itemCount}项` : ''}`
                            : (child.subtaskLabel || '-');
                        const childEffectiveEndAt = getTaskEffectiveEndAt(this.host, child);
                        lines.push(`└ ${childLabel}\t${childMeta}\t${child.phase || '-'}\t${this.host.getStatusLabel(child.status || 'unknown')}\t${formatTaskTimestamp(getTaskRegisteredAt(child) || Date.now())}\t${getTaskStartedAt(child) > 0 ? formatTaskTimestamp(getTaskStartedAt(child)) : '-'}\t${childEffectiveEndAt > 0 ? formatTaskTimestamp(childEffectiveEndAt) : '-'}\t${formatTaskDuration(getTaskWaitDurationMs(child))}\t${formatTaskDuration(getTaskRunDurationMs(this.host, child))}\t${getPagePath(child.pageUrl || '')}`);
                        const childDetail = child.detail ? String(child.detail).replace(/\n/g, ' ') : '';
                        if (childDetail) {
                            lines.push(childDetail);
                        }
                    }
                }
            }
            return lines.join('\n');
        }

        const groups = this.host.getVisibleTaskDetailGroups(true);
        for (const group of groups) {
            const parent = group.parent;
            const label = parent?.label || group.parentKey;
            const displayName = this.host.getTaskDisplayNameForExport(label);
            const phase = parent?.phase || '-';
            const status = this.host.getStatusLabel(parent?.status || 'unknown');
            const registeredAt = formatTaskTimestamp(getTaskRegisteredAt(parent) || Date.now());
            const startedAt = getTaskStartedAt(parent) > 0 ? formatTaskTimestamp(getTaskStartedAt(parent)) : '-';
            const parentEffectiveEndAt = getTaskEffectiveEndAt(this.host, parent);
            const endedAt = parentEffectiveEndAt > 0 ? formatTaskTimestamp(parentEffectiveEndAt) : '-';
            const waitDuration = formatTaskDuration(getTaskWaitDurationMs(parent));
            const runDuration = formatTaskDuration(getTaskRunDurationMs(this.host, parent));
            const pagePath = getPagePath(parent?.pageUrl || '');
            const childCount = parent?.__childCount || group.children.length || 0;
            const prefix = childCount > 0
                ? `${this.host.taskDetailsExpandedParents.has(group.parentKey) ? '▼' : '▶'} ${childCount}`
                : '';
            lines.push(`${prefix}${displayName}	-	${phase}	${status}	${registeredAt}	${startedAt}	${endedAt}	${waitDuration}	${runDuration}	${pagePath}`.trim());

            const detailLine = parent?.detail ? String(parent.detail).replace(/\n/g, ' ') : '';
            if (detailLine) {
                lines.push(detailLine);
            }

            const children = [...group.children].sort((a, b) => {
                const ai = typeof a.batchIndex === 'number' ? a.batchIndex : 0;
                const bi = typeof b.batchIndex === 'number' ? b.batchIndex : 0;
                return ai - bi;
            });
            for (const child of children) {
                const childLabel = child.label || child.parentLabel || '-';
                const childMeta = typeof child.batchIndex === 'number'
                    ? `${child.subtaskLabel || '-'} #${child.batchIndex}${typeof child.itemCount === 'number' ? ` · ${child.itemCount}项` : ''}`
                    : (child.subtaskLabel || '-');
                const childEffectiveEndAt = getTaskEffectiveEndAt(this.host, child);
                lines.push(`└ ${childLabel}	${childMeta}	${child.phase || '-'}	${this.host.getStatusLabel(child.status || 'unknown')}	${formatTaskTimestamp(getTaskRegisteredAt(child) || Date.now())}	${getTaskStartedAt(child) > 0 ? formatTaskTimestamp(getTaskStartedAt(child)) : '-'}	${childEffectiveEndAt > 0 ? formatTaskTimestamp(childEffectiveEndAt) : '-'}	${formatTaskDuration(getTaskWaitDurationMs(child))}	${formatTaskDuration(getTaskRunDurationMs(this.host, child))}	${getPagePath(child.pageUrl || '')}`);
                const childDetail = child.detail ? String(child.detail).replace(/\n/g, ' ') : '';
                if (childDetail) {
                    lines.push(childDetail);
                }
            }
        }

        return lines.join('\n');
    }
    renderTaskDetailsTable(): void {
        return renderTaskDetailsTable(this);
    }

    renderTaskDetailsPageSummaryTable(): void {
        return renderTaskDetailsPageSummaryTable(this);
    }

    getRenderedTaskDetailsCount(): number {
        if (this.host.taskDetailsView === 'pages') return this.getTaskDetailsPageSummarySourceData().length;
        return this.getTaskDetailsGroupedParents(this.getTaskDetailsSourceData()).length;
    }

    updateTaskDetailsPagination(total: number, totalPages: number): void {
        if (this.host.taskDetailsCount) {
            this.host.taskDetailsCount.textContent = String(total);
        }

        if (this.host.taskDetailsPagination) {
            this.host.taskDetailsPagination.textContent = `第 ${this.host.taskDetailsCurrentPage} / ${totalPages} 页`;
        }

        // 更新按钮状态
        if (this.host.taskDetailsPrevPage) {
            this.host.taskDetailsPrevPage.disabled = this.host.taskDetailsCurrentPage <= 1;
        }

        if (this.host.taskDetailsNextPage) {
            this.host.taskDetailsNextPage.disabled = this.host.taskDetailsCurrentPage >= totalPages;
        }
    }

    taskDetailsPrevPageHandler(): void {
        if (this.host.taskDetailsCurrentPage > 1) {
            this.host.taskDetailsCurrentPage--;
            this.host.renderTaskDetailsTable();
            const total = this.host.getRenderedTaskDetailsCount();
            const totalPages = Math.max(1, Math.ceil(total / this.host.taskDetailsPageSize));
            this.host.updateTaskDetailsPagination(total, totalPages);
        }
    }

    taskDetailsNextPageHandler(): void {
        const total = this.host.getRenderedTaskDetailsCount();
        const totalPages = Math.max(1, Math.ceil(total / this.host.taskDetailsPageSize));
        if (this.host.taskDetailsCurrentPage < totalPages) {
            this.host.taskDetailsCurrentPage++;
        }
        this.host.renderTaskDetailsTable();
        this.host.updateTaskDetailsPagination(total, totalPages);
    }

    taskDetailsSortHandler(field: string): void {
        return taskDetailsSortHandler(this, field);
    }

    taskDetailsSearchHandler(): void {
        return taskDetailsSearchHandler(this);
    }

}
