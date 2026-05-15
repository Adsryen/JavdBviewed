# 任务编排中心

本页聚焦任务编排中心本身，分别从总览、代码架构、任务生命周期三个角度描述真实实现。

当前实现主要分布在这些文件中：

- `src/background/globalTaskCenter.ts`
- `src/background/taskStateStore.ts`
- `src/background/taskPolicy.ts`
- `src/background/taskCenterPolicyRuntime.ts`
- `src/shared/taskCenterProtocol.ts`
- `src/shared/taskCenterTypes.ts`
- `src/content/initOrchestrator.ts`
- `src/content/taskRuntime.ts`
- `src/dashboard/tabs/settings/enhancement/EnhancementSettings.ts`

## 任务编排中心总览

![任务编排中心总览](/developer/task-orchestration-overview.svg)

这张图表达 6 个核心域：

- 任务来源：页面内容脚本、页面运行时、用户操作
- 注册与协议：统一消息协议、任务描述、运行时状态
- 全局编排中心：注册、排队、租约、心跳、完成、失败、取消
- 策略与配额：阶段优先级、bucket 限流、可见性、去重、重试
- 状态存储：内存态、快照持久化、已完成依赖标签
- 观测与控制：Dashboard 里的任务编排面板

总览图建议包含这些真实节点：

- `content/initOrchestrator.ts`
- `content/taskRuntime.ts`
- `shared/taskCenterProtocol.ts`
- `shared/taskCenterTypes.ts`
- `background/globalTaskCenter.ts`
- `background/taskStateStore.ts`
- `background/taskPolicy.ts`
- `background/taskCenterPolicyRuntime.ts`
- `chrome.storage.local`
- `Dashboard / EnhancementSettings`

总览图建议包含这些真实连线：

- `content -> protocol/types -> GlobalTaskCenter`
- `GlobalTaskCenter -> TaskStateStore`
- `GlobalTaskCenter -> chrome.storage.local`
- `GlobalTaskCenter -> taskPolicy / taskCenterPolicyRuntime`
- `Dashboard -> QUERY -> GlobalTaskCenter`
- `content -> mark-completed/check-completed -> GlobalTaskCenter`

## 代码架构

![任务编排中心代码架构](/developer/task-orchestration-code-architecture.svg)

这张图重点体现模块边界和调用关系：

- `content` 侧负责注册任务、申请 lease、上报进度和结束状态
- `shared` 侧定义消息协议和全局任务类型
- `background` 侧负责全局任务中心、状态存储、策略计算和持久化
- `dashboard` 侧负责查询全局状态，并提供设计视图、实时视图、全局视图

代码架构图建议把消息动作画全：

- `REGISTER`
- `REQUEST_LEASE`
- `HEARTBEAT`
- `PROGRESS`
- `PAUSE`
- `RESUME`
- `COMPLETE`
- `FAIL`
- `CANCEL`
- `VISIBILITY`
- `QUERY`
- `CLEAR`
- `task-center:mark-completed`
- `task-center:check-completed`

代码架构图建议额外体现这些内部职责：

- `TaskStateStore` 维护任务表和 tab 可见性表
- `taskPolicy` 负责 label 到 bucket 的映射和基础并发限制
- `taskCenterPolicyRuntime` 负责前台优先与后台可见性的有效并发计算
- `GlobalTaskCenter` 负责去重索引、队列评分、状态流转、快照恢复、快照持久化
- `taskRuntime` 负责本地重试预算、lease 轮询、执行包裹与完成回报

## 任务生命周期

![任务编排中心生命周期](/developer/task-orchestration-lifecycle.svg)

这张图对应真实状态与事件：

- 状态集合：`registered`、`queued`、`leased`、`running`、`paused`、`canceled`、`done`、`error`
- 关键事件：`REGISTER`、`REQUEST_LEASE`、`HEARTBEAT`、`PROGRESS`、`PAUSE`、`RESUME`、`COMPLETE`、`FAIL`、`CANCEL`
- 决策维度：优先级、phase、bucket 并发上限、tab 可见性、dedupe、重试计数

生命周期图建议按这条真实主路径绘制：

1. `createManagedTaskDescriptor`
2. `registerManagedTask`
3. `GlobalTaskCenter.REGISTER`
4. `queued`
5. `waitForTaskLease`
6. `REQUEST_LEASE`
7. `leased`
8. `running`
9. `HEARTBEAT / PROGRESS`
10. `COMPLETE` 或 `FAIL`
11. `done` 或 `error`

生命周期图建议额外画出这些分支：

- `REQUEST_LEASE -> waitReason=tab-hidden`
- `REQUEST_LEASE -> waitReason=higher-priority-wait`
- `REQUEST_LEASE -> waitReason=bucket:*`
- `running -> PAUSE -> paused -> RESUME -> queued`
- `running -> CANCEL -> canceled`
- `leased/running -> stale`，依据 `heartbeatTs` 与 `timeoutMs`

## 真实性备注

当前实现有一处值得在图注中标明：

- `descriptor.retryLimit` 已定义在 `GlobalTaskDescriptor`
- 实际重试预算当前由 `src/content/taskRuntime.ts` 里的 `MAX_GLOBAL_RETRIES = 3` 控制
- 这代表“描述字段”和“运行时实际约束”目前分属两处

如果图里要体现重试，建议标注为：

- 描述层：`retryLimit`
- 执行层：`taskRetryBudget / MAX_GLOBAL_RETRIES`

## 图文件维护约定

- 源文件：`vitepress/developer/assets/task-orchestration.drawio`
- 导出图：`vitepress/public/developer/task-orchestration-overview.svg`
- 导出图：`vitepress/public/developer/task-orchestration-code-architecture.svg`
- 导出图：`vitepress/public/developer/task-orchestration-lifecycle.svg`

维护方式建议：

1. 在 `draw.io` 中使用同一个 `.drawio` 文件维护 3 个 page
2. 每个 page 导出 1 张 `svg`
3. 页面节点名称优先使用源码里的真实命名
4. 结构变化时同步更新本页的文件清单与图例说明


## 导出建议

- 在 `draw.io` 中打开 `vitepress/developer/assets/task-orchestration.drawio`
- 分别导出 3 个 page 为 `svg`
- 导出时优先勾选透明背景、嵌入文本、保持页面尺寸
- 覆盖 `vitepress/public/developer/` 下对应文件后，VitePress 页面会自动显示正式图


## 页面级任务执行与调度

- 页面级源文件：`vitepress/developer/assets/page-task-orchestration.drawio`
- 页面级导出图：`vitepress/public/developer/task-orchestration-actor-page.svg`
- 页面级导出图：`vitepress/public/developer/task-orchestration-list-page.svg`
- 页面级导出图：`vitepress/public/developer/task-orchestration-video-page.svg`

当前页面级图按“主链 + 子任务组 + 并行旁路任务组”维护，节点名称优先使用源码里的真实任务 label。

### 演员页任务执行与调度

演员页当前重点看三条真实编排主线：`actorEnhancement:init`、`actorEnhancement:actionButtons`、`actorRemarks:actorPage`。

![演员页任务执行与调度](/developer/task-orchestration-actor-page.svg)

### 列表页任务执行与调度

列表页当前重点看三条真实链路：列表观察器首轮处理、`listEnhancement:init` 初始化、`contentFilter:initialize` 与 `drive115:init:list` 的并行旁路任务。

![列表页任务执行与调度](/developer/task-orchestration-list-page.svg)

### 影片页任务执行与调度

影片页当前按“两层真实模型”维护：初始化主链与事件触发链。

![影片页任务执行与调度](/developer/task-orchestration-video-page.svg)
