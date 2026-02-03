// src/services/newWorks/scheduler.ts
// 新作品定时采集调度器

import type { NewWorksManager } from './manager';
import type { NewWorksCollector } from './collector';
import { log } from '../../utils/logController';

export class NewWorksScheduler {
    private intervalId?: number;
    private isRunning: boolean = false;
    private isInitialized: boolean = false;
    private manager?: NewWorksManager;
    private collector?: NewWorksCollector;

    /**
     * 设置依赖
     */
    setDependencies(manager: NewWorksManager, collector: NewWorksCollector): void {
        this.manager = manager;
        this.collector = collector;
    }

    /**
     * 初始化调度器
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        if (!this.manager || !this.collector) {
            throw new Error('NewWorksScheduler: 必须先调用 setDependencies 设置依赖');
        }

        try {
            // 初始化新作品管理器
            await this.manager.initialize();

            // 检查是否需要启动定时任务（仅在自动检查开启时）
            const config = await this.manager.getGlobalConfig();
            if (config.autoCheckEnabled) {
                await this.start();
            }

            this.isInitialized = true;
            log.verbose('NewWorksScheduler: 初始化完成');
        } catch (error) {
            log.error('NewWorksScheduler: 初始化失败:', error);
        }
    }

    /**
     * 启动定时任务
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            log.verbose('NewWorksScheduler: 定时任务已在运行');
            return;
        }

        try {
            const config = await this.manager!.getGlobalConfig();

            if (!config.autoCheckEnabled) {
                log.verbose('NewWorksScheduler: 自动检查未开启');
                return;
            }

            // 设置定时器
            const intervalMs = config.checkInterval * 60 * 60 * 1000; // 转换为毫秒
            this.intervalId = setInterval(() => {
                this.runCollectionTask();
            }, intervalMs) as unknown as number;

            this.isRunning = true;
            log.info(`NewWorksScheduler: 定时任务已启动，间隔 ${config.checkInterval} 小时`);

            // 如果从未检查过，立即执行一次
            if (!config.lastGlobalCheck) {
                log.verbose('NewWorksScheduler: 首次运行，立即执行检查');
                setTimeout(() => this.runCollectionTask(), 5000); // 延迟5秒执行
            }

        } catch (error) {
            log.error('NewWorksScheduler: 启动定时任务失败:', error);
        }
    }

    /**
     * 停止定时任务
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        
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
     * 执行采集任务
     */
    private async runCollectionTask(): Promise<void> {
        try {
            log.verbose('NewWorksScheduler: 开始执行定时采集任务');

            // 获取配置和订阅
            const config = await this.manager!.getGlobalConfig();
            const subscriptions = await this.manager!.getSubscriptions();
            const activeSubscriptions = subscriptions.filter(sub => sub.enabled);

            if (activeSubscriptions.length === 0) {
                log.verbose('NewWorksScheduler: 没有活跃的订阅演员，跳过检查');
                return;
            }

            // 执行采集
            const result = await this.collector!.checkMultipleActors(activeSubscriptions, config);

            // 处理结果
            await this.processResults(result);

            // 更新最后检查时间
            await this.manager!.updateGlobalConfig({
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
                await this.manager!.addNewWorks(results.newWorks);
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
            // 使用 Chrome 扩展通知 API
            const notificationId = `new-works-${Date.now()}`;

            await chrome.notifications.create(notificationId, {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('assets/favicon-48x48.png'),
                title: 'Jav 助手 - 新作品提醒',
                message: `发现 ${count} 个新作品，点击查看详情`,
                priority: 1,
                requireInteraction: false
            });

            // 监听通知点击事件
            const onClicked = (clickedNotificationId: string) => {
                if (clickedNotificationId === notificationId) {
                    // 打开新作品页面
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('dashboard/dashboard.html#tab-new-works')
                    });

                    // 清除通知
                    chrome.notifications.clear(notificationId);

                    // 移除监听器
                    chrome.notifications.onClicked.removeListener(onClicked);
                }
            };

            chrome.notifications.onClicked.addListener(onClicked);

            // 自动清除通知
            setTimeout(() => {
                chrome.notifications.clear(notificationId);
                chrome.notifications.onClicked.removeListener(onClicked);
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

            const config = await this.manager!.getGlobalConfig();
            const subscriptions = await this.manager!.getSubscriptions();
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

            const result = await this.collector!.checkMultipleActors(activeSubscriptions, config);
            await this.processResults(result);

            // 更新最后检查时间
            await this.manager!.updateGlobalConfig({
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
     */
    getStatus(): {
        isRunning: boolean;
        isInitialized: boolean;
        intervalId?: number;
    } {
        return {
            isRunning: this.isRunning,
            isInitialized: this.isInitialized,
            intervalId: this.intervalId
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
}

// 单例实例
export const newWorksScheduler = new NewWorksScheduler();
