// src/services/newWorks/index.ts
// 新作品功能模块统一导出

// 导出类型定义
export * from './types';

// 导入核心类
import { NewWorksManager } from './manager';
import { NewWorksCollector } from './collector';
import { NewWorksScheduler } from './scheduler';

// 创建单例实例
export const newWorksManager = new NewWorksManager();
export const newWorksCollector = new NewWorksCollector();
export const newWorksScheduler = new NewWorksScheduler();

// 设置调度器的依赖关系
newWorksScheduler.setDependencies(newWorksManager, newWorksCollector);

// 导出类定义（用于类型检查和扩展）
export { NewWorksManager, NewWorksCollector, NewWorksScheduler };

// 为了保持向后兼容性，也导出原有的命名
export { newWorksManager as newWorksManagerInstance };
export { newWorksCollector as newWorksCollectorInstance };
export { newWorksScheduler as newWorksSchedulerInstance };
