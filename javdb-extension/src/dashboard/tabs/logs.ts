import { STATE } from '../state';
import { showMessage } from '../ui/toast';
import { getValue, setValue } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/config';
import { log } from '../../utils/logController';

/**
 * 日志条目接口
 */
interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    data?: any;
    source?: string;
}

/**
 * 日志标签页类
 */
export class LogsTab {
    public isInitialized: boolean = false;
    private currentLevelFilter: string = 'ALL';
    private currentSourceFilter: string = 'ALL';
    private logs: LogEntry[] = [];

    // DOM 元素
    private logLevelFilter!: HTMLSelectElement;
    private logSourceFilter!: HTMLSelectElement;
    private refreshButton!: HTMLButtonElement;
    private clearButton!: HTMLButtonElement;
    private logBody!: HTMLDivElement;

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
        this.refreshButton = document.getElementById('refresh-logs-button') as HTMLButtonElement;
        this.clearButton = document.getElementById('clear-logs-button') as HTMLButtonElement;
        this.logBody = document.getElementById('log-body') as HTMLDivElement;

        // 验证元素是否存在
        if (!this.logLevelFilter) {
            console.error('[LogsTab] 找不到log-level-filter元素');
            return;
        }
        if (!this.logSourceFilter) {
            console.error('[LogsTab] 找不到log-source-filter元素');
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

        log.verbose('[LogsTab] DOM元素初始化完成');
    }

    /**
     * 绑定事件监听器
     */
    private bindEvents(): void {
        // 过滤器事件
        this.logLevelFilter?.addEventListener('change', () => {
            this.currentLevelFilter = this.logLevelFilter.value;
            this.renderLogs();
        });

        this.logSourceFilter?.addEventListener('change', () => {
            this.currentSourceFilter = this.logSourceFilter.value;
            this.renderLogs();
        });

        // 按钮事件
        this.refreshButton?.addEventListener('click', () => {
            this.refreshLogs();
        });

        this.clearButton?.addEventListener('click', () => {
            this.clearLogs();
        });
    }

    /**
     * 加载日志数据
     */
    private async loadLogs(): Promise<void> {
        try {
            // 从STATE获取日志数据
            this.logs = STATE.logs || [];

            // 如果STATE中没有数据，尝试从存储中加载
            if (this.logs.length === 0) {
                const storedLogs = await getValue<LogEntry[]>(STORAGE_KEYS.LOGS, []);
                this.logs = Array.isArray(storedLogs) ? storedLogs : [];

                // 如果还是没有数据，创建一些示例日志
                if (this.logs.length === 0) {
                    this.logs = this.createSampleLogs();
                    // 保存示例日志到存储
                    await setValue(STORAGE_KEYS.LOGS, this.logs);
                }

                // 更新STATE
                STATE.logs = this.logs;
            }

            console.log(`[LogsTab] 加载了 ${this.logs.length} 条日志`);
        } catch (error) {
            console.error('加载日志数据失败:', error);
            this.logs = [];
        }
    }

    /**
     * 创建示例日志数据
     */
    private createSampleLogs(): LogEntry[] {
        const now = new Date();
        return [
            {
                timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
                level: 'info',
                message: '扩展初始化完成',
                source: 'GENERAL'
            },
            {
                timestamp: new Date(now.getTime() - 9 * 60 * 1000).toISOString(),
                level: 'debug',
                message: '开始加载用户设置',
                data: {
                    settingsVersion: '1.13.356',
                    loadTime: '45ms',
                    cacheHit: true
                },
                source: 'GENERAL'
            },
            {
                timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
                level: 'info',
                message: '[115] 网盘服务连接成功',
                data: {
                    endpoint: 'https://115.com/api',
                    responseTime: '120ms',
                    userAgent: 'JavHelper/1.13.356'
                },
                source: 'DRIVE115'
            },
            {
                timestamp: new Date(now.getTime() - 7 * 60 * 1000).toISOString(),
                level: 'warn',
                message: '检测到重复的视频记录，已自动合并',
                data: {
                    duplicateCount: 3,
                    mergedRecords: ['ABC-123', 'DEF-456', 'GHI-789'],
                    action: 'auto_merge'
                },
                source: 'GENERAL'
            },
            {
                timestamp: new Date(now.getTime() - 6 * 60 * 1000).toISOString(),
                level: 'error',
                message: '网络请求失败，正在重试',
                data: {
                    url: 'https://api.example.com/data',
                    error: 'timeout',
                    retryCount: 2,
                    maxRetries: 3,
                    nextRetryIn: '5s'
                },
                source: 'GENERAL'
            },
            {
                timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
                level: 'debug',
                message: '[115] 开始同步文件列表',
                data: {
                    totalFiles: 1250,
                    syncedFiles: 0,
                    estimatedTime: '2m 30s'
                },
                source: 'DRIVE115'
            },
            {
                timestamp: new Date(now.getTime() - 4 * 60 * 1000).toISOString(),
                level: 'info',
                message: '用户配置已更新',
                data: {
                    changedSettings: ['autoSync', 'displayMode'],
                    previousValues: { autoSync: false, displayMode: 'list' },
                    newValues: { autoSync: true, displayMode: 'grid' }
                },
                source: 'GENERAL'
            },
            {
                timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
                level: 'warn',
                message: '[115] 部分文件同步失败',
                data: {
                    failedFiles: ['movie1.mp4', 'movie2.mkv'],
                    reason: 'insufficient_permissions',
                    suggestion: 'check_115_login_status'
                },
                source: 'DRIVE115'
            },
            {
                timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
                level: 'info',
                message: '数据库优化完成',
                data: {
                    recordsProcessed: 5420,
                    duplicatesRemoved: 12,
                    optimizationTime: '1.2s',
                    spaceSaved: '2.3MB'
                },
                source: 'GENERAL'
            },
            {
                timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
                level: 'error',
                message: '[115] 认证令牌已过期',
                data: {
                    tokenType: 'access_token',
                    expiredAt: new Date(now.getTime() - 30 * 1000).toISOString(),
                    autoRefresh: true,
                    refreshStatus: 'in_progress'
                },
                source: 'DRIVE115'
            },
            {
                timestamp: now.toISOString(),
                level: 'info',
                message: '日志系统初始化完成',
                source: 'GENERAL'
            }
        ];
    }

    /**
     * 刷新日志
     */
    private async refreshLogs(): Promise<void> {
        try {
            this.refreshButton.disabled = true;
            this.refreshButton.textContent = '刷新中...';

            // 重新加载日志数据
            await this.loadLogs();

            // 重新渲染
            this.renderLogs();

            showMessage(`已刷新，共 ${this.logs.length} 条日志`, 'success');
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
            if (!confirm('确定要清空所有日志吗？此操作不可撤销。')) {
                return;
            }

            // 清空存储中的日志
            await setValue(STORAGE_KEYS.LOGS, []);
            
            // 清空内存中的日志
            this.logs = [];
            STATE.logs = [];

            // 重新渲染
            this.renderLogs();

            showMessage('日志已清空', 'success');
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

        // 过滤日志
        const filteredLogs = this.filterLogs();

        if (filteredLogs.length === 0) {
            this.logBody.innerHTML = '<div class="no-logs">暂无日志记录</div>';
            return;
        }

        // 生成日志HTML
        const logHtml = filteredLogs.map(log => this.createLogEntryHtml(log)).join('');
        this.logBody.innerHTML = logHtml;
    }

    /**
     * 过滤日志
     */
    private filterLogs(): LogEntry[] {
        return this.logs.filter(log => {
            // 等级过滤
            if (this.currentLevelFilter !== 'ALL' && log.level !== this.currentLevelFilter) {
                return false;
            }

            // 来源过滤
            if (this.currentSourceFilter !== 'ALL') {
                const logSource = this.getLogSource(log);
                if (logSource !== this.currentSourceFilter) {
                    return false;
                }
            }

            return true;
        }).reverse(); // 最新的日志在前面
    }

    /**
     * 获取日志来源
     */
    private getLogSource(log: LogEntry): string {
        // 根据日志内容判断来源
        if (log.source) {
            return log.source;
        }
        
        if (log.message.includes('115') || log.message.includes('Drive115')) {
            return 'DRIVE115';
        }
        
        return 'GENERAL';
    }

    /**
     * 创建日志条目HTML
     */
    private createLogEntryHtml(log: LogEntry): string {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const level = log.level.toUpperCase();
        const levelClass = this.getLevelClass(level);

        // 创建详细数据部分
        const dataHtml = log.data ? `
            <details class="log-data-details">
                <summary>详细数据</summary>
                <pre>${this.escapeHtml(JSON.stringify(log.data, null, 2))}</pre>
            </details>
        ` : '';

        return `
            <div class="log-entry log-level-${levelClass}">
                <div class="log-header">
                    <span class="log-level-badge">${level}</span>
                    <span class="log-message">${this.escapeHtml(log.message)}</span>
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
     * HTML转义
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 刷新标签页
     */
    async refresh(): Promise<void> {
        await this.refreshLogs();
    }
}

// 导出单例实例
export const logsTab = new LogsTab();
