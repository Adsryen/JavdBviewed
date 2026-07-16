# 数据同步模块架构说明

## 概述

数据同步模块已重构为模块化架构，每个同步功能都有独立的管理器，便于维护和调试。

## 文件结构

```
dataSync/
├── index.ts              # 主入口文件，处理事件和UI协调
├── ui.ts                 # UI管理，负责界面显示和用户交互
├── api.ts                # API客户端，处理与服务器的通信
├── types.ts              # 类型定义
├── syncers/              # 同步管理器目录
│   ├── index.ts          # 同步管理器工厂和统一接口
│   ├── viewedSync.ts     # 已观看同步管理器
│   ├── wantSync.ts       # 想看同步管理器
│   ├── actorSync.ts      # 演员同步管理器
│   └── allSync.ts        # 全部同步管理器（已观看+想看）
└── legacy/               # 旧版本代码（保留用于参考）
    ├── core.ts
    ├── api.ts
    └── utils.ts
```

## 核心组件

### 1. SyncManagerFactory (syncers/index.ts)

同步管理器工厂，提供统一的接口来管理所有同步类型：

```typescript
// 获取特定类型的同步管理器
const manager = SyncManagerFactory.getSyncManager('viewed');

// 执行同步
const result = await SyncManagerFactory.executeSync('viewed', {
    mode: 'incremental',
    onProgress: (progress) => console.log(progress),
    onComplete: (result) => console.log('完成', result),
    onError: (error) => console.error('错误', error)
});

// 检查同步状态
const isSyncing = SyncManagerFactory.isSyncing('viewed');
const isAnySyncing = SyncManagerFactory.isAnySyncing();

// 取消同步
SyncManagerFactory.cancelSync('viewed');
SyncManagerFactory.cancelAllSync();
```

### 2. 各个同步管理器

每个同步管理器都实现了 `ISyncManager` 接口：

```typescript
interface ISyncManager {
    isSyncing(): boolean;
    sync(options?: SyncOptions): Promise<SyncResult>;
    cancel(): void;
}
```

#### ViewedSyncManager (已观看同步)
- 处理已观看视频的同步
- 支持全量和增量同步模式
- 提供详细的进度回调

#### WantSyncManager (想看同步)
- 处理想看视频的同步
- 支持全量和增量同步模式
- 提供详细的进度回调

#### ActorSyncManager (演员同步)
- 处理收藏演员的同步
- 调用现有的 `actorSyncService`
- 映射进度格式到标准接口

#### AllSyncManager (全部同步)
- 组合已观看和想看同步
- 按顺序执行两个同步操作
- 合并进度和结果

### 3. UI管理器 (ui.ts)

负责所有UI相关的操作：
- 按钮状态管理
- 进度条显示
- 错误和成功消息
- 取消同步功能

### 4. API客户端 (api.ts)

处理与服务器的通信：
- 统一的API调用接口
- 错误处理和重试机制
- 进度回调支持
- 取消信号支持

## 使用方式

### 基本用法

```typescript
import { SyncManagerFactory } from './syncers';

// 执行同步
try {
    const result = await SyncManagerFactory.executeSync('viewed', {
        mode: 'incremental',
        onProgress: (progress) => {
            console.log(`进度: ${progress.percentage}% - ${progress.message}`);
        }
    });
    
    if (result.success) {
        console.log(`同步成功: ${result.message}`);
    }
} catch (error) {
    console.error('同步失败:', error.message);
}
```

### 事件驱动

主入口文件 `index.ts` 监听自定义事件：

```typescript
// 触发同步
const event = new CustomEvent('sync-requested', {
    detail: { type: 'viewed', mode: 'incremental' }
});
document.dispatchEvent(event);

// 取消同步
const cancelEvent = new CustomEvent('sync-cancel-requested');
document.dispatchEvent(cancelEvent);
```

## 特性

### 1. 统一的进度显示
所有同步类型都有一致的进度条和取消功能。

### 2. 模块化设计
每个同步功能独立管理，便于维护和扩展。

### 3. 错误处理
统一的错误处理机制，包括网络错误、用户取消等。

### 4. 类型安全
完整的TypeScript类型定义，确保类型安全。

### 5. 可扩展性
新增同步类型只需要：
1. 创建新的同步管理器
2. 在工厂中注册
3. 更新类型定义

## 迁移说明

从旧版本迁移到新架构：

1. **移除旧的直接调用**：
   ```typescript
   // 旧方式
   await actorSyncService.syncActors();
   
   // 新方式
   await SyncManagerFactory.executeSync('actors');
   ```

2. **统一事件处理**：
   所有同步都通过 `sync-requested` 事件触发

3. **统一UI管理**：
   所有同步都使用相同的进度条和取消按钮

## 调试

每个同步管理器都有详细的日志输出：

```typescript
// 启用调试日志
localStorage.setItem('debug', 'sync:*');

// 查看同步状态
console.log(SyncManagerFactory.isAnySyncing());
console.log(getSyncStatus());
```

## 注意事项

1. **向后兼容**：旧的API调用仍然可用，但建议迁移到新架构
2. **性能**：新架构优化了内存使用和错误处理
3. **扩展性**：添加新的同步类型更加简单
4. **维护性**：每个功能独立，便于调试和修复
