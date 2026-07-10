import type { TaskDetailsController } from './taskDetailsController';

export function renderTaskDetailsTable(controller: TaskDetailsController): void {
        if (!controller.host.taskDetailsTableBody) return;

        if (controller.host.taskDetailsTable) {
            const mainHead = controller.host.taskDetailsTable.querySelector('thead');
            if (mainHead) {
                mainHead.classList.toggle('hidden', controller.host.taskDetailsView === 'pages');
            }
        }
        if (controller.host.taskDetailsPageSummaryHead) {
            controller.host.taskDetailsPageSummaryHead.classList.toggle('hidden', controller.host.taskDetailsView !== 'pages');
        }

        if (controller.host.taskDetailsView === 'pages') {
            controller.renderTaskDetailsPageSummaryTable();
            return;
        }

        const dataToRender = controller.getTaskDetailsSourceData();

        if (dataToRender.length === 0) {
            const emptyMessage = controller.host.taskDetailsSearchQuery
                ? `<i class="fas fa-search"></i> 未找到匹配"${controller.host.taskDetailsSearchQuery}"的任务记录`
                : '<i class="fas fa-inbox"></i> 暂无任务记录';
            controller.host.taskDetailsTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="padding:40px; text-align:center; color:#94a3b8;">
                        ${emptyMessage}
                    </td>
                </tr>
            `;
            return;
        }

        const groupedParents = controller.getTaskDetailsGroupedParents(controller.getSortedTaskDetailsData());
        const totalParents = groupedParents.length;
        const totalPages = Math.max(1, Math.ceil(totalParents / controller.host.taskDetailsPageSize));
        controller.host.taskDetailsCurrentPage = Math.min(Math.max(1, controller.host.taskDetailsCurrentPage), totalPages);

        const startIndex = (controller.host.taskDetailsCurrentPage - 1) * controller.host.taskDetailsPageSize;
        const endIndex = startIndex + controller.host.taskDetailsPageSize;
        const pagedGroups = groupedParents.slice(startIndex, endIndex);

        const paginatedData: any[] = [];
        for (const group of pagedGroups) {
            paginatedData.push({
                ...group.parent,
                __rowType: 'parent',
                __parentKey: group.parentKey,
                __childCount: group.children.length,
            });

            if (controller.host.taskDetailsExpandedParents.has(group.parentKey)) {
                if (group.children.length > 0) {
                    paginatedData.push({
                        __rowType: 'child-header',
                        __parentKey: group.parentKey,
                    });
                }
                group.children.forEach((child) => {
                    paginatedData.push({
                        ...child,
                        __rowType: 'child',
                        __parentKey: group.parentKey,
                    });
                });
            }
        }

        const formatDuration = (ms: number): string => {
            if (ms < 1000) {
                return `${Math.round(ms)}ms`;
            } else if (ms < 60000) {
                return `${(ms / 1000).toFixed(2)}s`;
            } else {
                const minutes = Math.floor(ms / 60000);
                const seconds = ((ms % 60000) / 1000).toFixed(0);
                return `${minutes}m ${seconds}s`;
            }
        };

        const getDurationColor = (ms: number): string => {
            if (ms < 100) {
                return '#059669';
            } else if (ms < 500) {
                return '#0891b2';
            } else if (ms < 1000) {
                return '#7c3aed';
            } else if (ms < 3000) {
                return '#d97706';
            } else {
                return '#dc2626';
            }
        };

        const formatTimestamp = (ts: number): string => {
            const date = new Date(ts);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        };

        const getStatusBadge = (status: string): string => {
            const statusMap: Record<string, { text: string; color: string; bg: string }> = {
                done: { text: '完成', color: '#059669', bg: '#ecfdf5' },
                running: { text: '运行中', color: '#2563eb', bg: '#eff6ff' },
                pending: { text: '等待中', color: '#d97706', bg: '#fffbeb' },
                error: { text: '错误', color: '#dc2626', bg: '#fef2f2' },
                paused: { text: '已暂停', color: '#7c3aed', bg: '#f5f3ff' },
                timeout: { text: '超时', color: '#ea580c', bg: '#fff7ed' },
                registered: { text: '已注册', color: '#475569', bg: '#f8fafc' },
                'subtask-only': { text: '仅子任务', color: '#64748b', bg: '#f8fafc' },
                unknown: { text: '未知', color: '#64748b', bg: '#f8fafc' },
            };
            const badge = statusMap[status] || statusMap.unknown;
            return `<span style="display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; color:${badge.color}; background:${badge.bg};">${badge.text}</span>`;
        };

        const getPhaseBadge = (phase: string): string => {
            const phaseMap: Record<string, { text: string; color: string; bg: string }> = {
                critical: { text: 'critical', color: '#dc2626', bg: '#fef2f2' },
                high: { text: 'high', color: '#ea580c', bg: '#fff7ed' },
                deferred: { text: 'deferred', color: '#2563eb', bg: '#eff6ff' },
                idle: { text: 'idle', color: '#64748b', bg: '#f8fafc' },
                unknown: { text: 'unknown', color: '#64748b', bg: '#f8fafc' },
            };
            const badge = phaseMap[phase] || phaseMap.unknown;
            return `<span style="display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; color:${badge.color}; background:${badge.bg};">${badge.text}</span>`;
        };

        const getPageLink = (url: string): string => {
            if (!url) return '-';
            try {
                const parsed = new URL(url);
                return parsed.pathname || '/';
            } catch {
                return url;
            }
        };

        const getTaskDisplayName = (label: string): string => {
            const taskNameMap: Record<string, string> = {
                'drive115:init:video': '115功能初始化-视频页 (drive115:init:video)',
                'drive115:init:list': '115功能初始化-列表页 (drive115:init:list)',
                'drive115:push': '115推送任务 (drive115:push)',
                'insights:collector': '观影标签采集器 (insights:collector)',
                'actorRemarks:actorPage': '演员备注-演员页 (actorRemarks:actorPage)',
                'actorRemarks:run': '演员备注-运行 (actorRemarks:run)',
                'actorMarks:page': '演员标识-页面标记 (actorMarks:page)',
                'videoStatus:initialSync': '番号库状态同步与页面标记 (videoStatus:initialSync)',
                'videoStatus:finalizeStatus': '番号库状态发布与图标更新 (videoStatus:finalizeStatus)',
                'videoStatus:fullRefresh': '番号库详情全量刷新 (videoStatus:fullRefresh)',
                'videoStatus:update': '页面影片状态更新 (videoStatus:update)',
                'videoStatus:observer': '页面影片状态监听 (videoStatus:observer)',
                'ux:shortcuts:init': '快捷键初始化 (ux:shortcuts:init)',
                'ux:magnet:autoSearch': '磁力搜索自动检索 (ux:magnet:autoSearch)',
                // privacy:init 主 content 未接线，不展示为正常可执行任务
                'ui:remove-unwanted': '移除不需要的按钮 (ui:remove-unwanted)',
                'superRankingNav:init': '超级排行榜导航初始化 (superRankingNav:init)',
                'magnetSearch:init': '磁力搜索初始化 (magnetSearch:init)',
                'anchorOptimization:init': '锚点优化初始化 (anchorOptimization:init)',
                'listEnhancement:init': '列表增强初始化 (listEnhancement:init)',
                'listEnhancement:reprocess': '列表增强-二次处理 (listEnhancement:reprocess)',
                'list:reprocess:after-listEnhancement': '列表增强-二次处理 (list:reprocess:after-listEnhancement)',
                'list:observe:init': '列表页观察器初始化 (list:observe:init)',
                'actorEnhancement:init': '演员增强初始化 (actorEnhancement:init)',
                'actorEnhancement:actionButtons': '演员增强-操作按钮 (actorEnhancement:actionButtons)',
                'emby:init': 'Emby/Jellyfin 增强初始化 (emby:init)',
                'emby:badge': 'Emby/Jellyfin 徽标增强 (emby:badge)',
                'passwordHelper:init': '密码助手初始化 (passwordHelper:init)',
                'enhancementUI:showLoadingIndicator': '增强加载提示显示 (enhancementUI:showLoadingIndicator)',
                'defaultHide:init': '默认隐藏初始化 (defaultHide:init)',
                'contentFilter:init': '内容过滤初始化 (contentFilter:init)',
                'contentFilter:initialize': '内容过滤初始化 (contentFilter:initialize)',
                'videoEnhancement:clickEnhancement': '视频增强-点击增强 (videoEnhancement:clickEnhancement)',
                'videoEnhancement:initCore': '视频增强-核心初始化 (videoEnhancement:initCore)',
                'videoEnhancement:loadData': '视频增强-加载聚合数据 (videoEnhancement:loadData)',
                'videoEnhancement:translateCurrentTitle': '视频增强-标题定点翻译 (videoEnhancement:translateCurrentTitle)',
                'videoEnhancement:runCover': '视频增强-封面处理 (videoEnhancement:runCover)',
                'videoEnhancement:runTitle': '视频增强-标题处理 (videoEnhancement:runTitle)',
                'videoEnhancement:runReviewBreaker': '视频增强-评论破解 (videoEnhancement:runReviewBreaker)',
                'videoEnhancement:runRelatedLists': '视频增强-相关清单解锁 (videoEnhancement:runRelatedLists)',
                'videoEnhancement:runFC2Breaker': '视频增强-FC2破解 (videoEnhancement:runFC2Breaker)',
                'videoEnhancement:finish': '视频增强-完成 (videoEnhancement:finish)',
                'videoFavoriteRating:init': '视频收藏评分初始化 (videoFavoriteRating:init)',
                'onlineAvailability:check': '在线可看性检测 (onlineAvailability:check)',
                'actorQuickActions:init': '演员快捷操作初始化 (actorQuickActions:init)',
            };
            return taskNameMap[label] || `${label}`;
        };

        controller.host.taskDetailsRenderedRows = paginatedData;
        const rows = paginatedData.map((task) => {
            const registeredAtMs = controller.getTaskRegisteredAt(task);
            const startedAtMs = controller.getTaskStartedAt(task);
            const endedAtMs = controller.getTaskEffectiveEndAt(task);
            const waitDurationMs = controller.getTaskWaitDurationMs(task);
            const runDurationMs = controller.getTaskRunDurationMs(task);
            const registeredAt = formatTimestamp(registeredAtMs || Date.now());
            const startedAt = startedAtMs > 0 ? formatTimestamp(startedAtMs) : '-';
            const endedAt = endedAtMs > 0 ? formatTimestamp(endedAtMs) : '-';
            const waitDuration = formatDuration(waitDurationMs);
            const runDuration = formatDuration(runDurationMs);
            const runDurationColor = getDurationColor(runDurationMs);
            const status = getStatusBadge(task.status || 'unknown');
            const phase = getPhaseBadge(task.phase || 'unknown');
            const pageLink = getPageLink(task.pageUrl || '');
            const label = task.label || 'unknown';
            const displayName = getTaskDisplayName(label);
            const subtask = task.subtaskLabel || '-';
            const subtaskMeta = typeof task.batchIndex === 'number'
                ? `${subtask} #${task.batchIndex}${typeof task.itemCount === 'number' ? ` · ${task.itemCount}项` : ''}`
                : subtask;
            const detailLine = task.detail ? `<div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">${task.detail}</div>` : '';

            const isParent = task.__rowType === 'parent';
            const isChildHeader = task.__rowType === 'child-header';
            const paddingLeft = isParent ? '10px' : '28px';
            const toggle = isParent && task.__childCount > 0
                ? `<button data-task-parent-toggle="${task.__parentKey}" style="border:none; background:transparent; color:#3b82f6; cursor:pointer; margin-right:6px; font-size:12px;">${controller.host.taskDetailsExpandedParents.has(task.__parentKey) ? '▼' : '▶'} ${task.__childCount}</button>`
                : (isParent ? '' : '<span style="color:#94a3b8;">└</span> ');

            if (isChildHeader) {
                return `
                    <tr style="background:var(--bg-secondary); border-bottom:1px solid var(--border-color);">
                        <td style="padding:8px 12px 8px 28px; color:var(--text-secondary); font-size:11px; font-weight:700;">子任务</td>
                        <td style="padding:8px 12px; color:var(--text-secondary); font-size:11px; font-weight:700;">子任务信息</td>
                        <td style="padding:8px 12px; color:var(--text-secondary); font-size:11px; font-weight:700;">阶段</td>
                        <td style="padding:8px 12px; color:var(--text-secondary); font-size:11px; font-weight:700;">状态</td>
                        <td style="padding:8px 12px; color:var(--text-secondary); font-size:11px; font-weight:700;">注册</td>
                        <td style="padding:8px 12px; color:var(--text-secondary); font-size:11px; font-weight:700;">开始</td>
                        <td style="padding:8px 12px; color:var(--text-secondary); font-size:11px; font-weight:700;">结束</td>
                        <td style="padding:8px 12px; text-align:right; color:var(--text-secondary); font-size:11px; font-weight:700;">等待</td>
                        <td style="padding:8px 12px; text-align:right; color:var(--text-secondary); font-size:11px; font-weight:700;">耗时</td>
                        <td style="padding:8px 12px; color:var(--text-secondary); font-size:11px; font-weight:700;">页面</td>
                    </tr>
                `;
            }

            return `
                <tr style="background:${isParent ? 'var(--bg-primary)' : 'var(--bg-secondary)'}; border-bottom:1px solid var(--border-color);">
                    <td style="padding:10px 12px 10px ${paddingLeft}; color:var(--text-primary); font-weight:${isParent ? '500' : '400'};" title="${label}">${toggle}${displayName}${detailLine}</td>
                    <td style="padding:10px 12px; color:var(--text-secondary); font-size:12px;">${subtaskMeta}</td>
                    <td style="padding:10px 12px;">${phase}</td>
                    <td style="padding:10px 12px;">${status}</td>
                    <td style="padding:10px 12px; color:var(--text-secondary); font-size:12px;">${registeredAt}</td>
                    <td style="padding:10px 12px; color:var(--text-secondary); font-size:12px;">${startedAt}</td>
                    <td style="padding:10px 12px; color:var(--text-secondary); font-size:12px;">${endedAt}</td>
                    <td style="padding:10px 12px; text-align:right; color:var(--text-primary); font-weight:600;">${waitDuration}</td>
                    <td style="padding:10px 12px; text-align:right; color:${runDurationColor}; font-weight:600;">${runDuration}</td>
                    <td style="padding:10px 12px; color:var(--text-secondary); font-size:12px;">${pageLink}</td>
                </tr>
            `;
        }).join('');

        controller.host.taskDetailsTableBody.innerHTML = rows;
    }

export function renderTaskDetailsPageSummaryTable(controller: TaskDetailsController): void {
        if (!controller.host.taskDetailsTableBody) return;

        const dataToRender = controller.getTaskDetailsPageSummarySourceData();
        if (dataToRender.length === 0) {
            const emptyMessage = controller.host.taskDetailsSearchQuery
                ? `<i class="fas fa-search"></i> 未找到匹配"${controller.host.taskDetailsSearchQuery}"的页面实例`
                : '<i class="fas fa-inbox"></i> 暂无页面实例记录';
            controller.host.taskDetailsTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="padding:40px; text-align:center; color:#94a3b8;">
                        ${emptyMessage}
                    </td>
                </tr>
            `;
            return;
        }

        const sortedData = [...dataToRender].sort((a, b) => {
            let aVal = a[controller.host.taskDetailsSortField as keyof typeof a];
            let bVal = b[controller.host.taskDetailsSortField as keyof typeof b];
            if (controller.host.taskDetailsSortField === 'duration' || controller.host.taskDetailsSortField === 'totalDurationMs') {
                aVal = a.totalDurationMs || 0;
                bVal = b.totalDurationMs || 0;
            }
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return controller.host.taskDetailsSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            const aNum = typeof aVal === 'number' ? aVal : 0;
            const bNum = typeof bVal === 'number' ? bVal : 0;
            return controller.host.taskDetailsSortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        });

        const total = sortedData.length;
        const totalPages = Math.max(1, Math.ceil(total / controller.host.taskDetailsPageSize));
        controller.host.taskDetailsCurrentPage = Math.min(Math.max(1, controller.host.taskDetailsCurrentPage), totalPages);
        const startIndex = (controller.host.taskDetailsCurrentPage - 1) * controller.host.taskDetailsPageSize;
        const endIndex = startIndex + controller.host.taskDetailsPageSize;
        const paginatedData = sortedData.slice(startIndex, endIndex);

        const renderedRows: any[] = [];
        const getPageStatusBadge = (s: string): string => {
            const map: Record<string, { text: string; color: string; bg: string }> = {
                done:    { text: '已完成', color: '#059669', bg: '#ecfdf5' },
                running: { text: '运行中', color: '#2563eb', bg: '#eff6ff' },
                queued:  { text: '等待中', color: '#d97706', bg: '#fffbeb' },
                error:   { text: '有失败', color: '#dc2626', bg: '#fef2f2' },
            };
            const badge = map[s] || map.done;
            return `<span style="display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; color:${badge.color}; background:${badge.bg};">${badge.text}</span>`;
        };
        const rows = paginatedData.map((item) => {
            const path = controller.getPagePath(item.pageUrl || '');
            const title = `${path}
${item.detail || ''}`;
            const groupKey = item.groupKey || `${item.tabId || -1}|${item.pageInstanceId || ''}`;
            const expanded = controller.host.taskDetailsExpandedPageSummaries.has(groupKey);
            const tasks = controller.getPageSummaryTasks(item);
            const groupedParents = controller.getTaskDetailsGroupedParents(tasks);
            const reasonStats = controller.buildPageSummaryReasonStats(tasks);
            const topReasonSummary = Array.isArray(item.topWaitReasons) && item.topWaitReasons.length > 0
                ? item.topWaitReasons.map((entry: any) => `${entry.reason}×${entry.count}`).join(' · ')
                : '全部任务已结束';
            renderedRows.push({ ...item, __rowType: 'page-summary-parent', topReasonSummary });
            const summaryRow = `
                <tr style="border-bottom:1px solid var(--border-color); background:var(--bg-primary);">
                    <td style="padding:10px 12px; color:var(--text-primary);" title="${title}">
                        <div style="display:flex; align-items:flex-start; gap:8px;">
                            <button data-page-summary-toggle="${groupKey}" style="border:none; background:transparent; color:#3b82f6; cursor:pointer; font-size:12px; padding:0; margin-top:1px;">${expanded ? '▼' : '▶'}</button>
                            <div>
                                <div style="font-weight:600;">${path}</div>
                                <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">实例ID=${item.pageInstanceId || '-'} · tab=${item.tabId ?? '-'} · ${topReasonSummary}</div>
                            </div>
                        </div>
                    </td>
                    <td style="padding:10px 12px; color:var(--text-secondary); font-size:12px;">${item.pageType || '-'}</td>
                    <td style="padding:10px 12px; color:var(--text-secondary); font-size:12px;">${item.mainId || '-'}</td>
                    <td style="padding:10px 12px; text-align:left; color:var(--text-secondary); font-size:12px;">${controller.formatTaskTimestamp(item.startedAt || 0)}</td>
                    <td style="padding:10px 12px; white-space:nowrap;">${getPageStatusBadge(item.status || 'done')}</td>
                    <td style="padding:10px 12px; text-align:left; color:var(--text-primary); font-weight:600;">${item.parentCount || 0}</td>
                    <td style="padding:10px 12px; text-align:left; color:#059669; font-weight:600;">${item.doneCount || 0}</td>
                    <td style="padding:10px 12px; text-align:left; color:${(item.errorCount || 0) > 0 ? '#dc2626' : 'var(--text-primary)'}; font-weight:600;">${item.errorCount || 0}</td>
                    <td style="padding:10px 12px; text-align:left; color:var(--text-primary); font-weight:600;">${item.childCount || 0}</td>
                    <td style="padding:10px 12px; text-align:left; color:var(--text-primary); font-weight:600;">${controller.formatTaskDuration(item.totalDurationMs || 0)}</td>
                </tr>
            `;
            if (!expanded) return summaryRow;

            const reasonRows = reasonStats.map((entry) => {
                renderedRows.push({ __rowType: 'page-summary-reason', reason: entry.label, count: entry.count });
                return `
                    <tr style="background:var(--bg-secondary); border-bottom:1px solid var(--border-color);">
                        <td colspan="10" style="padding:8px 12px 8px 34px; color:var(--text-secondary); font-size:12px;">
                            <span style="display:inline-flex; align-items:center; gap:8px; margin-right:18px;"><span style="font-weight:600; color:var(--text-primary);">未完成原因</span>${controller.escapeHtml(entry.label)}</span>
                            <span style="display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; background:#eff6ff; color:#2563eb; font-weight:600;">${entry.count}</span>
                        </td>
                    </tr>
                `;
            }).join('');

            const subHeaderRow = groupedParents.length > 0
                ? `
                    <tr style="background:var(--bg-secondary); border-bottom:1px solid var(--border-color);">
                        <td colspan="10" style="padding:8px 12px 8px 34px;">
                            <div style="display:grid; grid-template-columns:minmax(260px, 2.6fr) 0.7fr 0.8fr 0.5fr 1.2fr 1.2fr 0.8fr 1.4fr; gap:10px; align-items:center; font-size:11px; color:var(--text-secondary); font-weight:700;">
                                <div>父任务</div>
                                <div>阶段</div>
                                <div>状态</div>
                                <div>子任务</div>
                                <div>注册</div>
                                <div>开始</div>
                                <div style="text-align:right;">耗时</div>
                                <div>说明</div>
                            </div>
                        </td>
                    </tr>
                `
                : '';

            const taskRows = groupedParents.map((group) => {
                const task = group.parent || {};
                const taskName = controller.host.getTaskDisplayNameForExport(task?.label || group.parentKey || 'unknown');
                const startedAtMs = controller.getTaskStartedAt(task);
                renderedRows.push({
                    __rowType: 'page-summary-child',
                    taskName,
                    phase: task?.phase || '-',
                    status: task?.status || 'unknown',
                    registeredAt: controller.formatTaskTimestamp(controller.getTaskRegisteredAt(task) || 0),
                    startedAt: startedAtMs > 0 ? controller.formatTaskTimestamp(startedAtMs) : '-',
                    runDuration: controller.formatTaskDuration(controller.getTaskRunDurationMs(task)),
                    reason: controller.getTaskDisplayReason(task),
                });
                return `
                    <tr style="background:var(--bg-secondary); border-bottom:1px solid var(--border-color);">
                        <td colspan="10" style="padding:8px 12px 8px 34px;">
                            <div style="display:grid; grid-template-columns:minmax(260px, 2.6fr) 0.7fr 0.8fr 0.5fr 1.2fr 1.2fr 0.8fr 1.4fr; gap:10px; align-items:center; font-size:12px;">
                                <div style="font-weight:600; color:var(--text-primary);">${controller.escapeHtml(taskName)}</div>
                                <div style="color:var(--text-secondary);">${controller.escapeHtml(task?.phase || '-')}</div>
                                <div style="color:var(--text-secondary);">${controller.escapeHtml(controller.host.getStatusLabel(task?.status || 'unknown'))}</div>
                                <div style="color:var(--text-secondary);">${group.children.length > 0 ? group.children.length : '-'}</div>
                                <div style="color:var(--text-secondary);">${controller.escapeHtml(controller.formatTaskTimestamp(controller.getTaskRegisteredAt(task) || 0) || '-')}</div>
                                <div style="color:var(--text-secondary);">${controller.escapeHtml(startedAtMs > 0 ? controller.formatTaskTimestamp(startedAtMs) : '-')}</div>
                                <div style="text-align:right; font-weight:600; color:var(--text-primary);">${controller.escapeHtml(controller.formatTaskDuration(controller.getTaskRunDurationMs(task)))}</div>
                                <div style="color:var(--text-secondary);">${controller.escapeHtml(controller.getTaskDisplayReason(task))}</div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            return summaryRow + reasonRows + subHeaderRow + taskRows;
        }).join('');

        controller.host.taskDetailsRenderedRows = renderedRows;
        controller.host.taskDetailsTableBody.innerHTML = rows;
    }
