/**
 * 事件总线模块 - 实现发布-订阅模式
 */

import { logAsync } from '../logger';

// 事件类型定义
export interface EventMap {
    'user-login-status-changed': { isLoggedIn: boolean; profile?: any };
    'user-profile-updated': { profile: any };
    'user-logout': {};
    'data-sync-refresh-requested': {};
    'data-sync-status-changed': { status: string; type?: string };
    'data-sync-progress': { progress: any };
    'data-sync-completed': { result: any };
    'data-sync-error': { error: any };
}

type EventName = keyof EventMap;
type EventHandler<T extends EventName> = (data: EventMap[T]) => void;

/**
 * 事件总线类 - 单例模式
 */
export class EventBus {
    private static instance: EventBus;
    private listeners: Map<EventName, Set<EventHandler<any>>> = new Map();

    private constructor() {}

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * 订阅事件
     */
    public on<T extends EventName>(
        eventName: T, 
        handler: EventHandler<T>
    ): () => void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        
        const handlers = this.listeners.get(eventName)!;
        handlers.add(handler);
        
        // logAsync('DEBUG', `事件监听器已注册: ${eventName}`, {
        //     totalListeners: handlers.size
        // });

        // 返回取消订阅函数
        return () => {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(eventName);
            }
            // logAsync('DEBUG', `事件监听器已移除: ${eventName}`, {
            //     remainingListeners: handlers.size
            // });
        };
    }

    /**
     * 发布事件
     */
    public emit<T extends EventName>(
        eventName: T, 
        data: EventMap[T]
    ): void {
        const handlers = this.listeners.get(eventName);
        
        if (!handlers || handlers.size === 0) {
            // logAsync('DEBUG', `没有监听器处理事件: ${eventName}`);
            return;
        }

        // logAsync('DEBUG', `发布事件: ${eventName}`, {
        //     listenersCount: handlers.size,
        //     data
        // });

        // 异步执行所有处理器，避免阻塞
        handlers.forEach(handler => {
            try {
                // 使用 setTimeout 确保异步执行
                setTimeout(() => {
                    try {
                        handler(data);
                    } catch (error: any) {
                        logAsync('ERROR', `事件处理器执行失败: ${eventName}`, { 
                            error: error.message 
                        });
                    }
                }, 0);
            } catch (error: any) {
                logAsync('ERROR', `事件处理器调度失败: ${eventName}`, { 
                    error: error.message 
                });
            }
        });
    }

    /**
     * 一次性事件监听
     */
    public once<T extends EventName>(
        eventName: T, 
        handler: EventHandler<T>
    ): () => void {
        const wrappedHandler = (data: EventMap[T]) => {
            handler(data);
            unsubscribe();
        };
        
        const unsubscribe = this.on(eventName, wrappedHandler);
        return unsubscribe;
    }

    /**
     * 移除指定事件的所有监听器
     */
    public off(eventName: EventName): void {
        const handlers = this.listeners.get(eventName);
        if (handlers) {
            const count = handlers.size;
            this.listeners.delete(eventName);
            // logAsync('DEBUG', `已移除事件的所有监听器: ${eventName}`, {
            //     removedCount: count
            // });
        }
    }

    /**
     * 清除所有事件监听器
     */
    public clear(): void {
        const totalEvents = this.listeners.size;
        let totalListeners = 0;
        
        this.listeners.forEach(handlers => {
            totalListeners += handlers.size;
        });
        
        this.listeners.clear();
        
        logAsync('INFO', '事件总线已清理', { 
            clearedEvents: totalEvents,
            clearedListeners: totalListeners 
        });
    }

    /**
     * 获取事件统计信息
     */
    public getStats(): { 
        eventCount: number; 
        totalListeners: number; 
        events: Record<string, number> 
    } {
        let totalListeners = 0;
        const events: Record<string, number> = {};
        
        this.listeners.forEach((handlers, eventName) => {
            const count = handlers.size;
            totalListeners += count;
            events[eventName] = count;
        });
        
        return {
            eventCount: this.listeners.size,
            totalListeners,
            events
        };
    }
}

// 导出单例实例
export const eventBus = EventBus.getInstance();

// 导出便捷函数
export const on = <T extends EventName>(eventName: T, handler: EventHandler<T>) => 
    eventBus.on(eventName, handler);

export const emit = <T extends EventName>(eventName: T, data: EventMap[T]) => 
    eventBus.emit(eventName, data);

export const once = <T extends EventName>(eventName: T, handler: EventHandler<T>) => 
    eventBus.once(eventName, handler);

export const off = (eventName: EventName) => eventBus.off(eventName);

export const clearEventBus = () => eventBus.clear();
