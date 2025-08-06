// src/background/newWorksScheduler.ts
// 新作品定时采集调度器

import { newWorksManager } from '../services/newWorksManager';
import { newWorksCollector } from '../services/newWorksCollector';

export class NewWorksScheduler {
    private intervalId?: number;
    private isRunning: boolean = false;
    private isInitialized: boolean = false;

    /**
     * 初始化调度器
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // 初始化新作品管理器
            await newWorksManager.initialize();
            
            // 检查是否需要启动定时任务
            const config = await newWorksManager.getGlobalConfig();
            if (config.enabled) {
                await this.start();
            }

            this.isInitialized = true;
            console.log('NewWorksScheduler: 初始化完成');
        } catch (error) {
            console.error('NewWorksScheduler: 初始化失败:', error);
        }
    }

    /**
     * 启动定时任务
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('NewWorksScheduler: 定时任务已在运行');
            return;
        }

        try {
            const config = await newWorksManager.getGlobalConfig();
            
            if (!config.enabled) {
                console.log('NewWorksScheduler: 新作品功能未启用');
                return;
            }

            // 设置定时器
            const intervalMs = config.checkInterval * 60 * 60 * 1000; // 转换为毫秒
            this.intervalId = window.setInterval(() => {
                this.runCollectionTask();
            }, intervalMs);

            this.isRunning = true;
            console.log(`NewWorksScheduler: 定时任务已启动，间隔 ${config.checkInterval} 小时`);

            // 如果从未检查过，立即执行一次
            if (!config.lastGlobalCheck) {
                console.log('NewWorksScheduler: 首次运行，立即执行检查');
                setTimeout(() => this.runCollectionTask(), 5000); // 延迟5秒执行
            }

        } catch (error) {
            console.error('NewWorksScheduler: 启动定时任务失败:', error);
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
        console.log('NewWorksScheduler: 定时任务已停止');
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
            console.log('NewWorksScheduler: 开始执行定时采集任务');

            // 获取配置和订阅
            const config = await newWorksManager.getGlobalConfig();
            const subscriptions = await newWorksManager.getSubscriptions();
            const activeSubscriptions = subscriptions.filter(sub => sub.enabled);

            if (activeSubscriptions.length === 0) {
                console.log('NewWorksScheduler: 没有活跃的订阅演员，跳过检查');
                return;
            }

            // 执行采集
            const result = await newWorksCollector.checkMultipleActors(activeSubscriptions, config);

            // 处理结果
            await this.processResults(result);

            // 更新最后检查时间
            await newWorksManager.updateGlobalConfig({
                lastGlobalCheck: Date.now()
            });

            console.log(`NewWorksScheduler: 定时采集完成，发现 ${result.discovered} 个新作品`);

        } catch (error) {
            console.error('NewWorksScheduler: 定时采集任务失败:', error);
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
                await newWorksManager.addNewWorks(results.newWorks);
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
            // 检查通知权限
            if (!('Notification' in window)) {
                console.log('NewWorksScheduler: 浏览器不支持通知');
                return;
            }

            let permission = Notification.permission;
            
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }

            if (permission === 'granted') {
                const notification = new Notification('Jav 助手 - 新作品提醒', {
                    body: `发现 ${count} 个新作品，点击查看详情`,
                    icon: chrome.runtime.getURL('assets/favicon-48x48.png'),
                    tag: 'new-works-notification',
                    requireInteraction: false
                });

                // 点击通知时打开新作品页面
                notification.onclick = () => {
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('dashboard/dashboard.html#tab-new-works')
                    });
                    notification.close();
                };

                // 自动关闭通知
                setTimeout(() => {
                    notification.close();
                }, 10000);

            } else {
                console.log('NewWorksScheduler: 通知权限被拒绝');
            }

        } catch (error) {
            console.error('NewWorksScheduler: 发送通知失败:', error);
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
            console.log('NewWorksScheduler: 手动触发检查');

            const config = await newWorksManager.getGlobalConfig();
            const subscriptions = await newWorksManager.getSubscriptions();
            const activeSubscriptions = subscriptions.filter(sub => sub.enabled);

            if (activeSubscriptions.length === 0) {
                return { discovered: 0, errors: ['没有活跃的订阅演员'] };
            }

            const result = await newWorksCollector.checkMultipleActors(activeSubscriptions, config);
            await this.processResults(result);

            // 更新最后检查时间
            await newWorksManager.updateGlobalConfig({
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
        console.log('NewWorksScheduler: 资源已清理');
    }
}

// 单例实例
export const newWorksScheduler = new NewWorksScheduler();
