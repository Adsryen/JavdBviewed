import { STATE } from '../state';
import { showMessage } from '../ui/toast';
import { log } from '../../utils/logController';
import type { LogEntry as CoreLogEntry, LogLevel } from '../../types';
import { dbLogsQuery, dbLogsClear, dbLogsExport, type LogsQueryParams } from '../dbClient';

/**
 * 日志条目接口：在全局 LogEntry 基础上扩展可选来源字段
 */
interface LogEntry extends CoreLogEntry {
    source?: string;
}

/** 控制台日志条目（仅内存，非持久化） */
interface ConsoleLogEntry {
    timestamp: number;
    level: Exclude<LogLevel, 'OFF'> | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    category: string;
    message: string;
}

/**
 * 日志标签页类
 */
export class LogsTab {
    public isInitialized: boolean = false;
    private currentLevelFilter: 'ALL' | LogLevel = 'ALL';
    private currentSourceFilter: string = 'ALL';
    private currentSearchQuery: string = '';
    private currentStartDate?: Date;
    private currentEndDate?: Date;
    private currentHasDataOnly: boolean = false;
    private logs: LogEntry[] = [];
    private totalLogsCount: number = 0; // IDB 端总数（EXT 视图无过滤时使用）

    // 视图模式：扩展日志（EXT）/ 控制台日志（CONSOLE）
    private viewMode: 'EXT' | 'CONSOLE' = 'EXT';
    private consoleLogs: ConsoleLogEntry[] = [];
    private MAX_CONSOLE_LOGS = 500;

    // 分页状态
    private currentPage: number = 1;
    private pageSize: number = 20;
    private logsPaginationEl!: HTMLElement;
    private logsPerPageSelect!: HTMLSelectElement;
    private logsCountInfoEl!: HTMLSpanElement;

    // DOM 元素
    private logLevelFilter!: HTMLSelectElement;
    private logSourceFilter!: HTMLSelectElement;
    private logSearchInput!: HTMLInputElement;
    private logStartDateInput!: HTMLInputElement;
    private logEndDateInput!: HTMLInputElement;
    private logHasDataOnlyCheckbox!: HTMLInputElement;
    private refreshButton!: HTMLButtonElement;
    private clearButton!: HTMLButtonElement;
    private exportButton!: HTMLButtonElement;
    private logBody!: HTMLDivElement;
    private consoleLogBody!: HTMLDivElement;
    private logViewExtBtn!: HTMLButtonElement;
    private logViewConsoleBtn!: HTMLButtonElement;

    // 设置联动过滤（阈值/类别）
    private applySettingsFilterBtn!: HTMLButtonElement;
    private clearSettingsFilterBtn!: HTMLButtonElement;
    private settingsFilterApplied: boolean = false;
    private settingsLevelThreshold: 'OFF' | LogLevel = 'DEBUG';
    private settingsAllowedConsoleCategories: Record<string, boolean> | null = null;
    private settingsAllowedSources: Set<string> | null = null;

    /**
     * 初始化日志标签页
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            log.verbose('开始初始化日志标签页');

            // 初始化DOM元素
            this.initializeElements();

            // 绑定事件监听器
            this.bindEvents();

            // 加载日志数据
            await this.loadLogs();

            // 渲染日志
            this.renderLogs();

            this.isInitialized = true;
            log.verbose('日志标签页初始化完成');
        } catch (error) {
            log.error('初始化日志标签页失败:', error);
            showMessage('初始化日志标签页失败', 'error');
        }
    }

    /**
     * 初始化DOM元素
     */
    private initializeElements(): void {
        this.logLevelFilter = document.getElementById('log-level-filter') as HTMLSelectElement;
        this.logSourceFilter = document.getElementById('log-source-filter') as HTMLSelectElement;
        this.logSearchInput = document.getElementById('log-search-input') as HTMLInputElement;
        this.logStartDateInput = document.getElementById('log-start-date') as HTMLInputElement;
        this.logEndDateInput = document.getElementById('log-end-date') as HTMLInputElement;
        this.logHasDataOnlyCheckbox = document.getElementById('log-has-data-only') as HTMLInputElement;
        this.refreshButton = document.getElementById('refresh-logs-button') as HTMLButtonElement;
        this.clearButton = document.getElementById('clear-logs-button') as HTMLButtonElement;
        // 尝试获取已存在的“导出”按钮；如无则动态创建并插入到“清空”按钮旁
        this.exportButton = document.getElementById('export-logs-button') as HTMLButtonElement;
        if (!this.exportButton) {
            try {
                const btn = document.createElement('button');
                btn.id = 'export-logs-button';
                btn.className = 'button is-light';
                btn.textContent = '导出';
                if (this.clearButton && this.clearButton.parentElement) {
                    this.clearButton.parentElement.insertBefore(btn, this.clearButton.nextSibling);
                } else if (this.refreshButton && this.refreshButton.parentElement) {
                    this.refreshButton.parentElement.appendChild(btn);
                } else if (this.logsPaginationEl) {
                    this.logsPaginationEl.appendChild(btn);
                }
                this.exportButton = btn as HTMLButtonElement;
            } catch {}
        }
        this.logBody = document.getElementById('log-body') as HTMLDivElement;
        this.consoleLogBody = document.getElementById('console-log-body') as HTMLDivElement;
        this.logsPaginationEl = document.getElementById('logsPagination') as HTMLElement;
        this.logsPerPageSelect = document.getElementById('logsPerPageSelect') as HTMLSelectElement;
        this.logsCountInfoEl = document.getElementById('logsCountInfo') as HTMLSpanElement;
        this.logViewExtBtn = document.getElementById('log-view-ext') as HTMLButtonElement;
        this.logViewConsoleBtn = document.getElementById('log-view-console') as HTMLButtonElement;
        this.applySettingsFilterBtn = document.getElementById('apply-settings-filter') as HTMLButtonElement;
        this.clearSettingsFilterBtn = document.getElementById('clear-settings-filter') as HTMLButtonElement;

        // 验证元素是否存在
        if (!this.logLevelFilter) {
            console.error('[LogsTab] 找不到log-level-filter元素');
            return;
        }
        if (!this.logSourceFilter) {
            console.error('[LogsTab] 找不到log-source-filter元素');
            return;
        }
        if (!this.logSearchInput) {
            console.error('[LogsTab] 找不到log-search-input元素');
            return;
        }
        if (!this.logStartDateInput) {
            console.error('[LogsTab] 找不到log-start-date元素');
            return;
        }
        if (!this.logEndDateInput) {
            console.error('[LogsTab] 找不到log-end-date元素');
            return;
        }
        if (!this.logHasDataOnlyCheckbox) {
            console.error('[LogsTab] 找不到log-has-data-only元素');
            return;
        }
        if (!this.refreshButton) {
            console.error('[LogsTab] 找不到refresh-logs-button元素');
            return;
        }
        if (!this.clearButton) {
            log.error('[LogsTab] 找不到clear-logs-button元素');
            return;
        }
        if (!this.logBody) {
            log.error('[LogsTab] 找不到log-body元素');
            return;
        }
        if (!this.logsPaginationEl) {
            console.error('[LogsTab] 找不到logsPagination元素');
            return;
        }
        if (!this.logsPerPageSelect) {
            console.error('[LogsTab] 找不到logsPerPageSelect元素');
            return;
        }

        log.verbose('[LogsTab] DOM元素初始化完成');
    }

    /**
     * 绑定事件监听器
     */
    private bindEvents(): void {
        // 视图切换
        this.logViewExtBtn?.addEventListener('click', () => {
            if (this.viewMode !== 'EXT') {
                this.viewMode = 'EXT';
                this.updateViewVisibility();
                this.currentPage = 1;
                this.renderLogs();
                this.updateSwitchBtnActive();
            }
        });
        this.logViewConsoleBtn?.addEventListener('click', () => {
            if (this.viewMode !== 'CONSOLE') {
                this.viewMode = 'CONSOLE';
                this.updateViewVisibility();
                this.renderLogs();
                this.updateSwitchBtnActive();
            }
        });

        // 过滤器事件
        this.logLevelFilter?.addEventListener('change', () => {
            const raw = (this.logLevelFilter.value || 'ALL').toUpperCase();
            this.currentLevelFilter = (raw === 'ALL' ? 'ALL' : (raw as LogLevel));
            this.currentPage = 1;
            this.renderLogs();
        });

        this.logSourceFilter?.addEventListener('change', () => {
            this.currentSourceFilter = this.logSourceFilter.value;
            this.currentPage = 1;
            this.renderLogs();
        });

        // 搜索框（带防抖）
        const debouncedSearch = this.debounce(() => {
            this.currentSearchQuery = (this.logSearchInput.value || '').trim();
            this.currentPage = 1;
            this.renderLogs();
        }, 250);
        this.logSearchInput?.addEventListener('input', debouncedSearch);

        // 日期范围
        this.logStartDateInput?.addEventListener('change', () => {
            const v = this.logStartDateInput.value;
            this.currentStartDate = v ? new Date(v) : undefined;
            this.currentPage = 1;
            this.renderLogs();
        });
        this.logEndDateInput?.addEventListener('change', () => {
            const v = this.logEndDateInput.value;
            this.currentEndDate = v ? new Date(v) : undefined;
            // 若仅输入结束日期，将其时间设置为当天 23:59:59.999
            if (this.currentEndDate) {
                this.currentEndDate.setHours(23, 59, 59, 999);
            }
            this.currentPage = 1;
            this.renderLogs();
        });

        // 仅含详细数据
        this.logHasDataOnlyCheckbox?.addEventListener('change', () => {
            this.currentHasDataOnly = !!this.logHasDataOnlyCheckbox.checked;
            this.currentPage = 1;
            this.renderLogs();
        });

        // 每页数量选择
        if (this.logsPerPageSelect) {
            const val = parseInt(this.logsPerPageSelect.value || '20', 10);
            this.pageSize = Number.isFinite(val) && val > 0 ? val : 20;
            this.logsPerPageSelect.addEventListener('change', () => {
                const v = parseInt(this.logsPerPageSelect.value || '20', 10);
                this.pageSize = Number.isFinite(v) && v > 0 ? v : 20;
                this.currentPage = 1;
                this.renderLogs();
            });
        }

        // 按钮事件
        this.refreshButton?.addEventListener('click', () => {
            this.refreshLogs();
        });

        this.clearButton?.addEventListener('click', () => {
            this.clearLogs();
        });

        // 导出日志
        this.exportButton?.addEventListener('click', async () => {
            try {
                this.exportButton.disabled = true;
                this.exportButton.textContent = '导出中...';
                const json = await dbLogsExport();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `javdb-logs-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showMessage('日志已导出', 'success');
            } catch (e) {
                console.error('[LogsTab] 导出日志失败', e);
                showMessage('导出日志失败', 'error');
            } finally {
                this.exportButton.disabled = false;
                this.exportButton.textContent = '导出';
            }
        });

        // 设置联动过滤按钮
        this.applySettingsFilterBtn?.addEventListener('click', () => {
            this.applySettingsFilterFromState();
            this.currentPage = 1;
            this.renderLogs();
            showMessage('已按“日志设置”应用过滤（阈值/类别）', 'success');
        });
        this.clearSettingsFilterBtn?.addEventListener('click', () => {
            this.clearSettingsFilter();
            this.currentPage = 1;
            this.renderLogs();
            showMessage('已清除“日志设置”过滤', 'info');
        });

        // 监听控制台输出事件（来自 consoleProxy）
        try {
            window.addEventListener('jdb:console-output' as any, (ev: Event) => {
                const e = ev as CustomEvent;
                const d = e.detail || {};
                const entry: ConsoleLogEntry = {
                    timestamp: typeof d.timestamp === 'number' ? d.timestamp : Date.now(),
                    level: (String(d.level || 'INFO').toUpperCase()) as any,
                    category: String(d.category || 'general'),
                    message: String(d.message || ''),
                };
                this.consoleLogs.push(entry);
                if (this.consoleLogs.length > this.MAX_CONSOLE_LOGS) {
                    this.consoleLogs.splice(0, this.consoleLogs.length - this.MAX_CONSOLE_LOGS);
                }
                if (this.viewMode === 'CONSOLE') {
                    this.renderLogs();
                }
            });
        } catch {}
    }

    /**
     * 加载日志数据
     */
    private async loadLogs(): Promise<void> {
        // 纯 IndexedDB 模式：不做预加载，延迟到 renderLogs 中查询
        this.logs = [];
        this.totalLogsCount = 0;
    }

    /**
     * 刷新日志
     */
    private async refreshLogs(): Promise<void> {
        try {
            this.refreshButton.disabled = true;
            this.refreshButton.textContent = '刷新中...';

            if (this.viewMode === 'EXT') {
                // 重新加载日志数据
                await this.loadLogs();
                // 重新渲染
                this.renderLogs();
                showMessage(`已刷新，共 ${this.logs.length} 条日志`, 'success');
            } else {
                // 控制台视图：仅重新渲染
                this.renderLogs();
                showMessage(`控制台日志（内存） 共 ${this.consoleLogs.length} 条`, 'info');
            }
        } catch (error) {
            console.error('刷新日志失败:', error);
            showMessage('刷新日志失败', 'error');
        } finally {
            this.refreshButton.disabled = false;
            this.refreshButton.textContent = '刷新';
        }
    }

    /**
     * 清空日志
     */
    private async clearLogs(): Promise<void> {
        try {
            if (this.viewMode === 'CONSOLE') {
                if (!confirm('确定要清空控制台日志（仅内存）吗？')) return;
                this.consoleLogs = [];
                this.renderLogs();
                showMessage('控制台日志已清空', 'success');
            } else {
                if (!confirm('确定要清空所有日志吗？此操作不可撤销。')) return;
                await dbLogsClear();
                this.logs = [];
                this.totalLogsCount = 0;
                this.currentPage = 1;
                this.renderLogs();
                showMessage('日志已清空', 'success');
            }
        } catch (error) {
            console.error('清空日志失败:', error);
            showMessage('清空日志失败', 'error');
        }
    }

    /**
     * 渲染日志
     */
    private renderLogs(): void {
        if (!this.logBody) return;

        // 视图切换下的可见性
        this.updateViewVisibility();

        if (this.viewMode === 'CONSOLE') {
            this.renderConsoleLogs();
            return;
        }

        // 扩展日志视图：若无任何过滤条件，改为通过 IDB 分页读取，避免加载全量日志
        if (this.isNoFilterActive()) {
            // 异步渲染：先显示加载中占位
            this.logBody.innerHTML = '<div class="loading">加载中...</div>';
            // 发起查询
            const offset = (this.currentPage - 1) * this.pageSize;
            const limit = this.pageSize;
            dbLogsQuery({ offset, limit, order: 'desc' } as LogsQueryParams)
              .then(({ items, total }) => {
                this.logs = Array.isArray(items) ? items : [];
                this.totalLogsCount = Number.isFinite(total) ? total : 0;
                const totalPages = Math.max(1, Math.ceil(this.totalLogsCount / this.pageSize));
                if (this.currentPage > totalPages) this.currentPage = totalPages;
                const pageItems = this.logs; // 直接使用分页结果
                const logHtml = pageItems.map(l => this.createLogEntryHtml(l)).join('');
                this.logBody.innerHTML = logHtml || '<div class="no-logs">暂无日志记录</div>';
                this.renderPagination(this.currentPage, totalPages);
                this.updateCountText(`扩展日志：已筛选 ${this.totalLogsCount} 条（第 ${this.currentPage}/${totalPages} 页）`);
              })
              .catch((e) => {
                console.error('[LogsTab] 读取 IDB 日志失败', e);
                this.logBody.innerHTML = '<div class="no-logs">日志加载失败，请稍后重试</div>';
              });
            return;
        }

        // 若仅启用“日期/等级”过滤（无搜索/来源/hasData/设置联动），使用 IDB 查询
        if (this.isOnlyDateAndLevelFilterActive()) {
            this.logBody.innerHTML = '<div class="loading">加载中...</div>';
            const offset = (this.currentPage - 1) * this.pageSize;
            const limit = this.pageSize;
            const params: LogsQueryParams = { offset, limit, order: 'desc' } as any;
            if (this.currentLevelFilter !== 'ALL') params.level = this.currentLevelFilter as any;
            if (this.currentStartDate) params.fromMs = this.currentStartDate.getTime();
            if (this.currentEndDate) params.toMs = this.currentEndDate.getTime();
            dbLogsQuery(params).then(({ items, total }) => {
                this.logs = Array.isArray(items) ? items : [];
                this.totalLogsCount = Number.isFinite(total) ? total : 0;
                const totalPages = Math.max(1, Math.ceil(this.totalLogsCount / this.pageSize));
                if (this.currentPage > totalPages) this.currentPage = totalPages;
                const logHtml = this.logs.map(l => this.createLogEntryHtml(l)).join('');
                this.logBody.innerHTML = logHtml || '<div class="no-logs">暂无日志记录</div>';
                this.renderPagination(this.currentPage, totalPages);
                this.updateCountText(`扩展日志：已筛选 ${this.totalLogsCount} 条（第 ${this.currentPage}/${totalPages} 页）`);
            }).catch((e) => {
                console.warn('[LogsTab] IDB 按日期/等级查询失败', e);
                this.logBody.innerHTML = '<div class="no-logs">日志加载失败，请稍后重试</div>';
            });
            return;
        }

        // 带条件查询：统一走 IDB 查询
        this.logBody.innerHTML = '<div class="loading">加载中...</div>';
        const offset = (this.currentPage - 1) * this.pageSize;
        const limit = this.pageSize;
        const params: LogsQueryParams = { offset, limit, order: 'desc' } as any;
        // 搜索关键字
        if ((this.currentSearchQuery || '').trim()) params.query = this.currentSearchQuery.trim();
        // 日期范围
        if (this.currentStartDate) params.fromMs = this.currentStartDate.getTime();
        if (this.currentEndDate) params.toMs = this.currentEndDate.getTime();
        // 是否仅含详细数据
        if (this.currentHasDataOnly) params.hasDataOnly = true;
        // 等级过滤：设置联动 -> minLevel；否则精确等级
        if (this.settingsFilterApplied) {
            params.minLevel = this.settingsLevelThreshold as any;
        } else if (this.currentLevelFilter !== 'ALL') {
            params.level = this.currentLevelFilter as any;
        }
        // 来源过滤
        let src: 'ALL' | 'GENERAL' | 'DRIVE115' = 'ALL';
        if (this.settingsFilterApplied && this.settingsAllowedSources) {
            const has115 = this.settingsAllowedSources.has('DRIVE115');
            const hasGen = this.settingsAllowedSources.has('GENERAL');
            src = has115 && hasGen ? 'ALL' : (has115 ? 'DRIVE115' : (hasGen ? 'GENERAL' : 'ALL'));
        } else {
            const cur = String(this.currentSourceFilter || 'ALL').toUpperCase();
            if (cur === 'DRIVE115' || cur === 'GENERAL') src = cur as any;
        }
        params.source = src;

        dbLogsQuery(params).then(({ items, total }) => {
            this.logs = Array.isArray(items) ? items : [];
            this.totalLogsCount = Number.isFinite(total) ? total : 0;
            const totalPages = Math.max(1, Math.ceil(this.totalLogsCount / this.pageSize));
            if (this.currentPage > totalPages) this.currentPage = totalPages;
            const logHtml = this.logs.map(l => this.createLogEntryHtml(l)).join('');
            this.logBody.innerHTML = logHtml || '<div class="no-logs">暂无日志记录</div>';
            this.renderPagination(this.currentPage, totalPages);
            this.updateCountText(`扩展日志：已筛选 ${this.totalLogsCount} 条（第 ${this.currentPage}/${totalPages} 页）`);
        }).catch((e) => {
            console.error('[LogsTab] IDB 查询失败', e);
            this.logBody.innerHTML = '<div class="no-logs">日志加载失败，请稍后重试</div>';
        });
    }

    /**
     * 渲染控制台日志
     */
    private renderConsoleLogs(): void {
        if (!this.consoleLogBody) return;

        const q = (this.currentSearchQuery || '').trim().toLowerCase();
        const levelFilter = this.currentLevelFilter;
        const start = this.currentStartDate ? this.currentStartDate.getTime() : undefined;
        const end = this.currentEndDate ? this.currentEndDate.getTime() : undefined;

        const list = [...this.consoleLogs]
            .filter(e => {
                // 当未启用设置过滤时，使用原有“精确等级”过滤；
                // 启用设置过滤时，使用“阈值等级”过滤
                if (this.settingsFilterApplied) {
                    if (!this.levelPass(String(e.level).toUpperCase() as LogLevel, this.settingsLevelThreshold)) return false;
                    if (this.settingsAllowedConsoleCategories) {
                        const key = String(e.category || '').toLowerCase();
                        const allowed = !!this.settingsAllowedConsoleCategories[key];
                        if (!allowed) return false;
                    }
                } else {
                    if (levelFilter !== 'ALL' && String(e.level).toUpperCase() !== String(levelFilter).toUpperCase()) return false;
                }
                if (start && e.timestamp < start) return false;
                if (end && e.timestamp > end) return false;
                if (q) {
                    const msg = e.message.toLowerCase();
                    if (!msg.includes(q)) return false;
                }
                return true;
            })
            .slice(-this.MAX_CONSOLE_LOGS)
            .reverse(); // 最新在前

        if (list.length === 0) {
            this.consoleLogBody.innerHTML = '<div class="no-logs">暂无控制台输出</div>';
            if (this.logsPaginationEl) this.logsPaginationEl.innerHTML = '';
            this.updateCountText(`控制台日志：已筛选 0 条（内存 ${this.consoleLogs.length} 条，上限 ${this.MAX_CONSOLE_LOGS}）`);
            return;
        }

        const html = list.map(e => this.createConsoleLogHtml(e)).join('');
        this.consoleLogBody.innerHTML = html;
        // 控制台视图不使用分页
        if (this.logsPaginationEl) this.logsPaginationEl.innerHTML = '';

        // 更新计数显示（控制台视图）
        this.updateCountText(`控制台日志：已筛选 ${list.length} 条（内存 ${this.consoleLogs.length} 条，上限 ${this.MAX_CONSOLE_LOGS}）`);
    }

    /**
     * 渲染分页控件
     */
    private renderPagination(currentPage: number, totalPages: number): void {
        if (!this.logsPaginationEl) return;
        if (totalPages <= 1) {
            this.logsPaginationEl.innerHTML = '';
            return;
        }

        const createBtn = (label: string, page: number, options: { disabled?: boolean; active?: boolean; ellipsis?: boolean } = {}) => {
            if (options.ellipsis) {
                return `<button class="page-button ellipsis" disabled>…</button>`;
            }
            const disabled = options.disabled ? 'disabled' : '';
            const active = options.active ? 'active' : '';
            return `<button class="page-button ${active}" data-page="${page}" ${disabled}>${label}</button>`;
        };

        const buttons: string[] = [];
        // Prev
        buttons.push(createBtn('«', Math.max(1, currentPage - 1), { disabled: currentPage === 1 }));

        const windowSize = 2;
        const pages: number[] = [];
        pages.push(1);
        for (let p = currentPage - windowSize; p <= currentPage + windowSize; p++) {
            if (p > 1 && p < totalPages) pages.push(p);
        }
        if (totalPages > 1) pages.push(totalPages);
        const uniqPages = Array.from(new Set(pages)).sort((a, b) => a - b);

        let last = 0;
        for (const p of uniqPages) {
            if (last && p - last > 1) {
                buttons.push(createBtn('…', last + 1, { ellipsis: true }));
            }
            buttons.push(createBtn(String(p), p, { active: p === currentPage }));
            last = p;
        }

        // Next
        buttons.push(createBtn('»', Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages }));

        this.logsPaginationEl.innerHTML = buttons.join('');

        // 绑定点击事件
        this.logsPaginationEl.querySelectorAll<HTMLButtonElement>('.page-button').forEach(btn => {
            const p = btn.dataset.page ? parseInt(btn.dataset.page, 10) : NaN;
            if (!Number.isFinite(p) || btn.classList.contains('ellipsis') || btn.disabled) return;
            btn.addEventListener('click', () => {
                if (p < 1) return;
                this.currentPage = p;
                this.renderLogs();
            });
        });
    }

    /**
     * 等级阈值判断：threshold为最小显示等级，显示 >= threshold 的日志
     */
    private levelPass(level: LogLevel, threshold: 'OFF' | LogLevel): boolean {
        if (threshold === 'OFF') return false;
        const rank = (lv: LogLevel) => {
            switch (lv) {
                case 'DEBUG': return 0;
                case 'INFO': return 1;
                case 'WARN': return 2;
                case 'ERROR': return 3;
            }
        };
        return rank(level) >= rank(threshold as LogLevel);
    }

    /**
     * 从全局设置应用过滤：consoleLevel + consoleCategories
     */
    private applySettingsFilterFromState(): void {
        const logging = STATE.settings?.logging || {} as any;
        const level = (logging.consoleLevel || 'DEBUG') as 'OFF' | LogLevel;
        const cats: Record<string, boolean> = (logging.consoleCategories || {}) as any;

        this.settingsLevelThreshold = level;
        this.settingsAllowedConsoleCategories = cats && Object.keys(cats).length ? cats : null;

        // 将 consoleCategories 映射为扩展日志来源集合（仅已知来源）
        const allowedSources = new Set<string>();
        if (!cats || Object.keys(cats).length === 0) {
            // 未配置类别时，不限制来源
            this.settingsAllowedSources = null;
        } else {
            if (cats.drive115) allowedSources.add('DRIVE115');
            // 其余类别均归入 GENERAL（目前扩展日志来源仅 GENERAL/DRIVE115）
            const otherKeys = ['core','orchestrator','privacy','magnet','actor','storage','general'];
            if (otherKeys.some(k => !!cats[k])) allowedSources.add('GENERAL');
            this.settingsAllowedSources = allowedSources;
        }

        this.settingsFilterApplied = true;
    }

    /**
     * 清除设置联动过滤
     */
    private clearSettingsFilter(): void {
        this.settingsFilterApplied = false;
        this.settingsLevelThreshold = 'DEBUG';
        this.settingsAllowedConsoleCategories = null;
        this.settingsAllowedSources = null;
    }

    /**
     * 创建日志条目HTML
     */
    private createLogEntryHtml(log: LogEntry): string {
        // 使用与控制台一致的可选毫秒显示
        const fmt = this.getConsoleFormat();
        const timestamp = this.formatConsoleTimestamp(new Date(log.timestamp).getTime(), { showMilliseconds: fmt.showMilliseconds, timeZone: fmt.timeZone });
        const level = log.level.toUpperCase();
        const levelClass = this.getLevelClass(level);

        // 高亮命中
        const highlight = (text: string) => {
            const q = (this.currentSearchQuery || '').trim();
            if (!q) return this.escapeHtml(text);
            try {
                const escaped = this.escapeHtml(text);
                const re = new RegExp(this.escapeRegExp(q), 'ig');
                return escaped.replace(re, (m) => `<mark class="log-highlight">${this.escapeHtml(m)}</mark>`);
            } catch {
                return this.escapeHtml(text);
            }
        };

        // 创建详细数据部分
        const dataHtml = log.data ? `
            <details class="log-data-details">
                <summary>详细数据</summary>
                <pre>${highlight(JSON.stringify(log.data, null, 2))}</pre>
            </details>
        ` : '';

        return `
            <div class="log-entry log-level-${levelClass}">
                <div class="log-header">
                    <span class="log-level-badge">${level}</span>
                    <span class="log-message">${highlight(log.message)}</span>
                    <span class="log-timestamp">${timestamp}</span>
                </div>
                ${dataHtml}
            </div>
        `;
    }

    /**
     * 获取日志等级对应的CSS类
     */
    private getLevelClass(level: string): string {
        switch (level.toLowerCase()) {
            case 'error': return 'error';
            case 'warn': case 'warning': return 'warn';
            case 'info': return 'info';
            case 'debug': return 'debug';
            default: return 'info';
        }
    }

    /**
     * 获取控制台格式设置
     */
    private getConsoleFormat(): { showTimestamp: boolean; showSource: boolean; showMilliseconds: boolean; timeZone?: string } {
        const fmt = (STATE.settings?.logging as any)?.consoleFormat || {};
        return {
            showTimestamp: fmt.showTimestamp !== false,
            showSource: fmt.showSource !== false,
            showMilliseconds: !!fmt.showMilliseconds,
            timeZone: fmt.timeZone || undefined,
        };
    }

    /**
     * 格式化控制台时间戳，支持时区与毫秒
     */
    private formatConsoleTimestamp(ts: number, fmt: { showMilliseconds: boolean; timeZone?: string }): string {
        try {
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false,
            };
            const dtf = new Intl.DateTimeFormat(undefined, { ...options, timeZone: fmt.timeZone });
            const parts = dtf.formatToParts(new Date(ts));
            const map: Record<string, string> = {};
            for (const p of parts) { if (p.type !== 'literal') map[p.type] = p.value; }
            let base = `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
            if (fmt.showMilliseconds) {
                const ms = new Date(ts).getMilliseconds().toString().padStart(3, '0');
                base += `.${ms}`;
            }
            return base;
        } catch {
            const d = new Date(ts);
            let base = d.toLocaleString();
            if (fmt.showMilliseconds) base += `.${d.getMilliseconds().toString().padStart(3, '0')}`;
            return base;
        }
    }

    /**
     * 控制台日志项 HTML
     */
    private createConsoleLogHtml(e: ConsoleLogEntry): string {
        const fmt = this.getConsoleFormat();
        const tsStr = this.formatConsoleTimestamp(e.timestamp, fmt);
        const levelClass = this.getLevelClass(String(e.level));
        const highlight = (text: string) => {
            const q = (this.currentSearchQuery || '').trim();
            if (!q) return this.escapeHtml(text);
            try {
                const escaped = this.escapeHtml(text);
                const re = new RegExp(this.escapeRegExp(q), 'ig');
                return escaped.replace(re, (m) => `<mark class="log-highlight">${this.escapeHtml(m)}</mark>`);
            } catch {
                return this.escapeHtml(text);
            }
        };

        const headerParts: string[] = [];
        headerParts.push(`<span class="console-level-badge">${this.escapeHtml(String(e.level).toUpperCase())}</span>`);
        if (fmt.showSource !== false) {
            headerParts.push(`<span class="console-category">${this.escapeHtml(String(e.category || '').toUpperCase())}</span>`);
        }
        if (fmt.showTimestamp !== false) {
            headerParts.push(`<span class="console-timestamp">${this.escapeHtml(tsStr)}</span>`);
        }

        return `
            <div class="console-log-entry console-level-${levelClass}">
                <div class="console-log-header">${headerParts.join('')}</div>
                <div class="console-log-message">${highlight(e.message)}</div>
            </div>
        `;
    }

    /**
     * HTML转义
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 转义正则关键字
     */
    private escapeRegExp(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 刷新标签页
     */
    async refresh(): Promise<void> {
        await this.refreshLogs();
    }

    /**
     * 简易防抖
     */
    private debounce<T extends (...args: any[]) => void>(fn: T, delay = 200): T {
        let timer: number | undefined;
        // @ts-ignore
        return ((...args: any[]) => {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(() => fn(...args), delay);
        }) as T;
    }

    /**
     * 根据视图切换显示容器
     */
    private updateViewVisibility(): void {
        if (!this.logBody || !this.consoleLogBody) return;
        if (this.viewMode === 'EXT') {
            this.logBody.style.display = '';
            this.consoleLogBody.style.display = 'none';
        } else {
            this.logBody.style.display = 'none';
            this.consoleLogBody.style.display = '';
        }
    }

    private updateSwitchBtnActive(): void {
        if (this.logViewExtBtn && this.logViewConsoleBtn) {
            if (this.viewMode === 'EXT') {
                this.logViewExtBtn.classList.add('active');
                this.logViewConsoleBtn.classList.remove('active');
            } else {
                this.logViewConsoleBtn.classList.add('active');
                this.logViewExtBtn.classList.remove('active');
            }
        }
    }

    /**
     * 更新日志条数显示
     */
    private updateCountText(text: string): void {
        if (!this.logsCountInfoEl) return;
        this.logsCountInfoEl.textContent = text;
    }

    /**
     * 判断是否为“无过滤条件”状态（可走快速分页路径）
     */
    private isNoFilterActive(): boolean {
        const noLevel = this.currentLevelFilter === 'ALL' && !this.settingsFilterApplied;
        const noSource = this.currentSourceFilter === 'ALL' && (!this.settingsFilterApplied || !this.settingsAllowedSources);
        const noSearch = !this.currentSearchQuery;
        const noDate = !this.currentStartDate && !this.currentEndDate;
        const noHasDataOnly = !this.currentHasDataOnly;
        return noLevel && noSource && noSearch && noDate && noHasDataOnly;
    }

    /**
     * 仅启用“日期/等级”过滤（且未启用设置阈值/来源类别映射），其他过滤条件均未生效
     * 用于走 IDB 分页查询路径
     */
    private isOnlyDateAndLevelFilterActive(): boolean {
        // 首先必须不是“完全无过滤”状态，否则已由 isNoFilterActive 分支处理
        if (this.isNoFilterActive()) return false;
        const noSearch = !this.currentSearchQuery;
        const noSource = this.currentSourceFilter === 'ALL';
        const noHasDataOnly = !this.currentHasDataOnly;
        const noSettingsLink = !this.settingsFilterApplied;
        // 允许：等级（可为 ALL 或具体级别）+ 日期（可无或有）
        return noSearch && noSource && noHasDataOnly && noSettingsLink;
    }
}

// 导出单例实例
export const logsTab = new LogsTab();
