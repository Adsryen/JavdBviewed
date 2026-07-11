/**
 * @file scheduler.ts
 * @description 新作品定时采集调度器（chrome.alarms，跨 SW / event page 休眠可恢复）
 * @module features/newWorks
 */

import type { NewWorksManager } from './manager';
import type { NewWorksCollector } from './collector';
import { log } from '../../utils/logController';
import { ensureChromeNamespace, getExtensionApi } from '../../platform/browser/extensionApi';

/** 周期检查 alarm 名称（浏览器持久化，不依赖内存 setInterval） */
export const NEW_WORKS_CHECK_ALARM = 'newWorks.periodic_check';

/** 将配置中的检查间隔（小时）转为 chrome.alarms 的 periodInMinutes（下限 1） */
export function checkIntervalHoursToPeriodMinutes(checkIntervalHours: number): number {
    const hours = Number(checkIntervalHours);
    if (!Number.isFinite(hours) || hours <= 0) {
        return 60; // 非法值回退 1 小时
    }
    return Math.max(1, Math.round(hours * 60));
}

export class NewWorksScheduler {
    private isRunning: boolean = false;
    private isInitialized: boolean = false;
    private manager?: NewWorksManager;
    private collector?: NewWorksCollector;
    private firstRunTimeoutId?: ReturnType<typeof setTimeout>;

    /**
     * 设置依赖
     */
    setDependencies(manager: NewWorksManager, collector: NewWorksCollector): void {
        this.manager = manager;
        this.collector = collector;
    }

    private requireManager(): NewWorksManager {
        if (!this.manager) {
            throw new Error('NewWorksScheduler: 必须先调用 setDependencies 设置依赖');
        }
        return this.manager;
    }

    private requireCollector(): NewWorksCollector {
        if (!this.collector) {
            throw new Error('NewWorksScheduler: 必须先调用 setDependencies 设置依赖');
        }
        return this.collector;
    }

    private requireDependencies(): { manager: NewWorksManager; collector: NewWorksCollector } {
        return {
            manager: this.requireManager(),
            collector: this.requireCollector(),
        };
    }

    /**
     * 初始化调度器
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        const manager = this.requireManager();
        this.requireCollector();

        try {
            // 初始化新作品管理器
            await manager.initialize();

            // 检查是否需要启动定时任务（仅在自动检查开启时）
            // alarms 会跨 SW/event page 休眠保留：关闭自动检查时必须主动 clear，
            // 否则冷启动只读配置为 false 时会留下陈旧周期任务。
            const config = await manager.getGlobalConfig();
            if (config.autoCheckEnabled) {
                await this.start();
            } else {
                this.clearFirstRunTimeout();
                this.clearAlarm();
                this.isRunning = false;
            }

            this.isInitialized = true;
            log.verbose('NewWorksScheduler: 初始化完成');
        } catch (error) {
            log.error('NewWorksScheduler: 初始化失败:', error);
        }
    }

    /**
     * 启动定时任务（chrome.alarms 周期触发，可跨后台休眠）
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            log.verbose('NewWorksScheduler: 定时任务已在运行');
            return;
        }

        try {
            const config = await this.requireManager().getGlobalConfig();

            if (!config.autoCheckEnabled) {
                log.verbose('NewWorksScheduler: 自动检查未开启');
                this.clearAlarm();
                return;
            }

            const periodInMinutes = checkIntervalHoursToPeriodMinutes(config.checkInterval);
            this.ensureAlarm(periodInMinutes);

            this.isRunning = true;
            log.info(`NewWorksScheduler: 定时任务已启动，间隔 ${config.checkInterval} 小时（alarm ${periodInMinutes} 分钟）`);

            // 如果从未检查过，延迟执行一次（不依赖 setInterval 周期路径）
            if (!config.lastGlobalCheck) {
                log.verbose('NewWorksScheduler: 首次运行，立即执行检查');
                this.clearFirstRunTimeout();
                this.firstRunTimeoutId = setTimeout(() => {
                    this.firstRunTimeoutId = undefined;
                    void this.runCollectionTask();
                }, 5000);
            }
        } catch (error) {
            log.error('NewWorksScheduler: 启动定时任务失败:', error);
        }
    }

    /**
     * 停止定时任务
     */
    stop(): void {
        this.clearFirstRunTimeout();
        this.clearAlarm();
        this.isRunning = false;
        log.verbose('NewWorksScheduler: 定时任务已停止');
    }

    /**
     * 重启定时任务
     */
    async restart(): Promise<void> {
        this.stop();
        await this.start();
    }

    /**
     * alarmRouter 入口：匹配本调度器 alarm 时执行采集。
     * @returns 是否已处理（供路由 early-return）
     */
    handleAlarm(alarmName: string): boolean {
        if (alarmName !== NEW_WORKS_CHECK_ALARM) {
            return false;
        }
        void this.runCollectionTask();
        return true;
    }

    /**
     * 执行采集任务
     */
    private async runCollectionTask(): Promise<void> {
        try {
            log.verbose('NewWorksScheduler: 开始执行定时采集任务');

            const { manager, collector } = this.requireDependencies();
            const config = await manager.getGlobalConfig();
            // 防御：配置已关闭自动检查但浏览器仍残留 alarm（如 WebDAV 恢复配置未 restart）
            if (!config.autoCheckEnabled) {
                log.verbose('NewWorksScheduler: 自动检查已关闭，清除残留 alarm 并跳过');
                this.clearFirstRunTimeout();
                this.clearAlarm();
                this.isRunning = false;
                return;
            }

            const subscriptions = await manager.getSubscriptions();
            const activeSubscriptions = subscriptions.filter(sub => sub.enabled);

            if (activeSubscriptions.length === 0) {
                log.verbose('NewWorksScheduler: 没有活跃的订阅演员，跳过检查');
                return;
            }

            // 执行采集
            const result = await collector.checkMultipleActors(activeSubscriptions, config);

            // 处理结果
            await this.processResults(result);

            // 更新最后检查时间
            await manager.updateGlobalConfig({
                lastGlobalCheck: Date.now()
            });

            log.info(`NewWorksScheduler: 定时采集完成，发现 ${result.discovered} 个新作品`);
        } catch (error) {
            log.error('NewWorksScheduler: 定时采集任务失败:', error);
        }
    }

    /**
     * 处理采集结果
     */
    private async processResults(results: {
        discovered: number;
        errors: string[];
        newWorks: any[];
    }): Promise<void> {
        try {
            // 保存新作品
            if (results.newWorks.length > 0) {
                await this.requireManager().addNewWorks(results.newWorks);
            }

            // 发送通知
            if (results.discovered > 0) {
                await this.sendNotification(results.discovered);
            }

            // 记录错误
            if (results.errors.length > 0) {
                console.warn('NewWorksScheduler: 采集过程中遇到错误:', results.errors);
            }
        } catch (error) {
            console.error('NewWorksScheduler: 处理采集结果失败:', error);
        }
    }

    /**
     * 发送通知
     */
    private async sendNotification(count: number): Promise<void> {
        try {
            ensureChromeNamespace();
            const api = getExtensionApi();
            if (!api?.notifications?.create) {
                return;
            }

            // 使用扩展通知 API
            const notificationId = `new-works-${Date.now()}`;
            const iconUrl = api.runtime?.getURL
                ? api.runtime.getURL('assets/favicons/light/favicon-48x48.png')
                : 'assets/favicons/light/favicon-48x48.png';

            await new Promise<void>((resolve) => {
                try {
                    api.notifications.create(
                        notificationId,
                        {
                            type: 'basic',
                            iconUrl,
                            title: 'Jav 助手 - 新作品提醒',
                            message: `发现 ${count} 个新作品，点击查看详情`,
                            priority: 1,
                            requireInteraction: false,
                        },
                        () => resolve(),
                    );
                } catch {
                    resolve();
                }
            });

            // 监听通知点击事件
            const onClicked = (clickedNotificationId: string) => {
                if (clickedNotificationId === notificationId) {
                    // 打开新作品页面
                    try {
                        api.tabs?.create?.({
                            url: api.runtime?.getURL
                                ? api.runtime.getURL('dashboard/dashboard.html#tab-new-works')
                                : 'dashboard/dashboard.html#tab-new-works',
                        });
                    } catch {
                        // ignore
                    }

                    try {
                        api.notifications.clear(notificationId);
                    } catch {
                        // ignore
                    }

                    try {
                        api.notifications.onClicked.removeListener(onClicked);
                    } catch {
                        // ignore
                    }
                }
            };

            try {
                api.notifications.onClicked.addListener(onClicked);
            } catch {
                // ignore
            }

            // 自动清除通知
            setTimeout(() => {
                try {
                    api.notifications.clear(notificationId);
                    api.notifications.onClicked.removeListener(onClicked);
                } catch {
                    // ignore
                }
            }, 10000);

            log.verbose(`NewWorksScheduler: 通知已发送，发现 ${count} 个新作品`);
        } catch (error) {
            log.error('NewWorksScheduler: 发送通知失败:', error);
        }
    }

    /**
     * 手动触发检查
     */
    async triggerManualCheck(): Promise<{
        discovered: number;
        errors: string[];
    }> {
        try {
            log.verbose('NewWorksScheduler: 手动触发检查');

            const { manager, collector } = this.requireDependencies();
            const config = await manager.getGlobalConfig();
            const subscriptions = await manager.getSubscriptions();
            log.verbose('NewWorksScheduler: 获取到订阅数据:', subscriptions.length, '个订阅');
            log.verbose('NewWorksScheduler: 订阅详情:', subscriptions.map(sub => ({
                id: sub.actorId,
                name: sub.actorName,
                enabled: sub.enabled
            })));

            const activeSubscriptions = subscriptions.filter(sub => sub.enabled);
            log.verbose('NewWorksScheduler: 活跃订阅数量:', activeSubscriptions.length);

            if (activeSubscriptions.length === 0) {
                const errorMsg = subscriptions.length === 0
                    ? '没有订阅任何演员，请先添加订阅'
                    : `共有 ${subscriptions.length} 个订阅，但都已禁用，请在管理订阅中启用`;
                log.verbose('NewWorksScheduler: ' + errorMsg);
                return { discovered: 0, errors: [errorMsg] };
            }

            const result = await collector.checkMultipleActors(activeSubscriptions, config);
            await this.processResults(result);

            // 更新最后检查时间
            await manager.updateGlobalConfig({
                lastGlobalCheck: Date.now()
            });

            return {
                discovered: result.discovered,
                errors: result.errors
            };
        } catch (error) {
            console.error('NewWorksScheduler: 手动检查失败:', error);
            return {
                discovered: 0,
                errors: [error instanceof Error ? error.message : '未知错误']
            };
        }
    }

    /**
     * 获取调度器状态
     * intervalId 已弃用（改用 alarms），保留可选字段兼容旧消费者
     */
    getStatus(): {
        isRunning: boolean;
        isInitialized: boolean;
        intervalId?: number;
    } {
        return {
            isRunning: this.isRunning,
            isInitialized: this.isInitialized,
        };
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        this.stop();
        this.isInitialized = false;
        log.verbose('NewWorksScheduler: 资源已清理');
    }

    private ensureAlarm(periodInMinutes: number): void {
        ensureChromeNamespace();
        const api = getExtensionApi();
        const alarms = api?.alarms;
        if (!alarms?.create) {
            log.warn('NewWorksScheduler: chrome.alarms 不可用，无法注册周期检查');
            return;
        }

        try {
            // 先清再建，保证 period 与配置一致（restart / 冷启动幂等）
            if (typeof alarms.clear === 'function') {
                try {
                    alarms.clear(NEW_WORKS_CHECK_ALARM);
                } catch {
                    // ignore
                }
            }
            alarms.create(NEW_WORKS_CHECK_ALARM, {
                delayInMinutes: periodInMinutes,
                periodInMinutes,
            });
        } catch (error) {
            log.error('NewWorksScheduler: 注册 alarm 失败:', error);
        }
    }

    private clearAlarm(): void {
        try {
            ensureChromeNamespace();
            const api = getExtensionApi();
            api?.alarms?.clear?.(NEW_WORKS_CHECK_ALARM);
        } catch {
            // ignore
        }
    }

    private clearFirstRunTimeout(): void {
        if (this.firstRunTimeoutId !== undefined) {
            clearTimeout(this.firstRunTimeoutId);
            this.firstRunTimeoutId = undefined;
        }
    }
}

// 模块级实例（测试可 new；生产路径请使用 features/newWorks/index 已接线依赖的单例）
export const newWorksScheduler = new NewWorksScheduler();
