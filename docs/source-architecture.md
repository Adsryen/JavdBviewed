# Source Architecture Plan

日期：2026-05-26

本文定义 `src` 的长期目录结构和迁移规则。目标是让功能增长后仍然能快速定位代码、控制依赖方向，并让新功能自然落到稳定边界内。

## 目标

- 新功能优先按业务能力组织，避免继续堆在 `src/content`、`src/background`、`src/utils` 根目录。
- 页面入口、后台入口、Dashboard 入口只负责装配和运行环境适配。
- 外部站点、API、UI、业务规则在功能域内部收拢。
- 基础设施沉到 `platform`，跨功能纯类型和协议沉到 `shared`。
- 迁移采用增量方式，新功能先走新结构，旧模块按功能域逐批迁移。

## 目标目录

```text
src/
  apps/
    content/
    background/
    dashboard/
    popup/

  features/
    actorRemarks/
    contentFilter/
    drive115/
    externalSearch/
    fc2Breaker/
    insights/
    listEnhancement/
    magnets/
    newWorks/
    onlineAvailability/
    previews/
    privacy/
    records/
    relatedLists/
    reviewUnlock/
    routeManagement/
    settingsSearch/
    subtitles/
    videoStatus/
    webdavSync/

  platform/
    browser/
    logging/
    network/
    storage/
    tasks/

  shared/
    constants/
    protocols/
    types/
    utils/
```

## 分层职责

### `apps`

`apps` 是运行入口层。它知道当前运行环境，也负责把页面、后台、Dashboard、Popup 的生命周期接起来。

职责：

- 读取当前页面或路由上下文。
- 初始化对应 feature。
- 连接 Chrome runtime、DOM、Dashboard partial、popup HTML。
- 做最薄的一层 orchestration。

限制：

- 不放业务算法。
- 不放外站解析规则。
- 不直接操作复杂存储模型。
- 不承载可复用 UI 逻辑。

示例：

```text
apps/content/bootstrap.ts
apps/content/pageRouter.ts
apps/content/detailPage.ts
apps/background/messageRouter.ts
apps/dashboard/routes.ts
```

当前 `apps/background` 已按职责拆出：

```text
apps/background/dynamicContentScripts.ts
apps/background/dnrRules.ts
apps/background/dbMessageRouter.ts
apps/background/routeAutoUpdate.ts
apps/background/drive115UserRefresh.ts
apps/background/alarmRouter.ts
apps/background/errorHandlers.ts
apps/background/embyDynamicContentScripts.ts
apps/background/orchestratorMetrics.ts
apps/background/tabMessageHandlers.ts
apps/background/networkMessageHandlers.ts
apps/background/userProfileMessageHandler.ts
apps/background/utilityMessageHandlers.ts
apps/background/dbTagsMessageHandlers.ts
apps/background/dbMagnetPushLogMessageHandlers.ts
apps/background/dbInsightsMessageHandlers.ts
apps/background/dbLogMessageHandlers.ts
apps/background/scheduler.ts
apps/background/miscMessageRouter.ts
```

115 v2 后台代理已归位到 `features/drive115/v2/backgroundProxy.ts`，`apps/background/bootstrap.ts` 直接装配 feature 入口，旧 `src/background/drive115Proxy.ts` 仅保留兼容导出。

WebDAV 后台 controller 已归位到 `features/webdavSync/background/controller.ts`，`apps/background/bootstrap.ts` 和自动同步 scheduler 直接装配 feature 入口，旧 `src/background/webdav.ts` 仅保留兼容导出。

WebDAV restore 链路继续按职责拆分：`restorePreview.ts` 负责预览与下载解析，`restoreStorage.ts` 负责恢复时的集合归一化、store 清空和批量写入，`restoreService.ts` 保留恢复流程编排。

WebDAV 恢复预览和智能合并的差异分析已归位到 `features/webdavSync/application`：`dataDiff.ts`、`dataMerge.ts`、`mergeKeyedMap.ts` 由 Dashboard 恢复页直接调用，旧 `src/utils/*` 路径仅保留兼容导出。

WebDAV 恢复页拆分按“业务规则进入 feature、Dashboard 展示模型留在 dashboard 子目录”推进：旧备份格式识别与迁移进入 `features/webdavSync/application/backupMigration.ts`，恢复文件列表的大小、相对时间、日期范围、上传者展示模型、行状态和行 HTML 进入 `dashboard/webdavRestore/fileListModel.ts`，恢复内容选项的可用性、勾选状态和统计文案进入 `dashboard/webdavRestore/restoreOptionsModel.ts`，冲突弹窗运行时状态、导航事件、批量选择和 DOM 应用进入 `dashboard/webdavRestore/conflictController.ts`，冲突当前项标题、类型、时间和默认选择进入 `dashboard/webdavRestore/conflictDisplayModel.ts`，冲突详情字段、状态文案、字段 HTML、版本内容 HTML 和解决方案文案进入 `dashboard/webdavRestore/conflictDetailModel.ts`，冲突进度、导航状态和批量方案合并进入 `dashboard/webdavRestore/conflictNavigationModel.ts`，恢复结果弹窗显隐、摘要渲染、关闭刷新和恢复前备份下载进入 `dashboard/webdavRestore/restoreResultController.ts`，恢复进度页、计时器、恢复完成内嵌结果页和结果按钮 DOM 事件进入 `dashboard/webdavRestore/restoreProgressResultsController.ts`，恢复模式切换、快捷恢复确认、向导步骤、向导确认摘要和恢复参数构造进入 `dashboard/webdavRestore/restoreWizardController.ts`，智能合并写入、恢复前备份、恢复数据校验、回滚和旧备份清理进入 `dashboard/webdavRestore/restoreApplyController.ts`，恢复文件列表、下载按钮、云端预览、旧备份格式迁移和预览统计 DOM 进入 `dashboard/webdavRestore/restoreFilePreviewController.ts`，差异分析、本地数据读取和分析预览进入状态进入 `dashboard/webdavRestore/restoreAnalysisController.ts`，恢复选项 DOM 渲染进入 `dashboard/webdavRestore/restoreOptionsController.ts`，覆盖式恢复执行入口、密码验证、二次确认和统一恢复消息发送进入 `dashboard/webdavRestore/restoreUnifiedExecutorController.ts`，恢复弹窗查找、打开关闭、页脚按钮修复、重置状态、事件绑定、错误态和返回列表进入 `dashboard/webdavRestore/restoreModalShellController.ts`，恢复结果类别、状态、详情文案、结果页 HTML、结果页容器规格、结果页回退/完成按钮 UI 状态进入 `dashboard/webdavRestore/restoreResultsModel.ts`，恢复前备份 key、payload 构造、备份选择和下载文件名进入 `dashboard/webdavRestore/restoreBackupModel.ts`，恢复与回滚写入计划、演员记录清洗进入 `dashboard/webdavRestore/restoreApplyPlanModel.ts`，恢复弹窗重置、分析加载、分析完成预览、云端预览加载、预览进入、提交按钮、文件列表、返回列表和错误展示 UI 状态进入 `dashboard/webdavRestore/restoreModalStateModel.ts`，弹窗底部按钮规格进入 `dashboard/webdavRestore/restoreFooterModel.ts`，向导策略预览文案进入 `dashboard/webdavRestore/strategyPreviewModel.ts`，向导确认摘要 HTML 进入 `dashboard/webdavRestore/restoreConfirmationModel.ts`，向导步骤与导航状态进入 `dashboard/webdavRestore/restoreWizardStateModel.ts`，恢复模式统计目标和值进入 `dashboard/webdavRestore/restoreModeStatsModel.ts`，恢复模式切换状态和旧专家预览清理规则进入 `dashboard/webdavRestore/restoreModeUiModel.ts`，恢复类别选择和覆盖式恢复二次确认 HTML 进入 `dashboard/webdavRestore/restoreExecuteConfirmModel.ts`，恢复数据结构校验进入 `dashboard/webdavRestore/restoreValidationModel.ts`，快捷恢复确认统计、降级确认 HTML 和默认合并选项进入 `dashboard/webdavRestore/quickRestoreModel.ts`，智能合并结果摘要项、摘要 HTML 和结果弹窗显隐状态进入 `dashboard/webdavRestore/operationSummaryModel.ts`，云端备份预览计数和统计项 HTML 进入 `dashboard/webdavRestore/previewStatsModel.ts`，设置差异弹窗 HTML、外层样式和开关动画状态进入 `dashboard/webdavRestore/settingsDifferenceModel.ts`，恢复进度容器规格、进入/离开状态和计时文案进入 `dashboard/webdavRestore/restoreProgressModel.ts`，`dashboard/webdavRestore.ts` 保留弹窗流程和跨模块编排。

Background misc message router 已归位到 `apps/background/miscMessageRouter.ts`，标签页打开、网络代理、用户资料和通用设置类 handler 已拆到独立模块，`apps/background/bootstrap.ts` 直接装配本地 app 入口，旧 `src/background/miscHandlers.ts` 仅保留兼容导出。

Background DB router 已归位到 `apps/background/dbMessageRouter.ts`，标签 Top 50 读取、旧 storage 分片兼容逻辑、持久日志、115 磁力推送日志 handler 和 insights/trends handler 已拆到独立模块，旧 `src/background/dbRouter.ts` 仅保留兼容导出。

Storage migrations 已归位到 `platform/storage/migrations.ts`，`apps/background/bootstrap.ts` 直接装配 storage platform 入口，旧 `src/background/migrations.ts` 仅保留兼容导出。

### `features`

`features` 是业务能力层。一个功能域应尽量拥有自己的 domain、application、adapters、ui 和 tests。

职责：

- 实现业务规则。
- 管理功能域内部状态。
- 适配外部 API 或站点 HTML。
- 提供 UI 组件或 DOM 渲染逻辑。
- 暴露少量稳定入口给 `apps` 调用。

限制：

- 不直接依赖另一个 feature 的内部文件。
- 跨 feature 复用能力通过 `index.ts` 暴露。
- Chrome API、IndexedDB、HTTP 细节优先通过 `platform` 注入或封装。

功能域模板：

```text
features/<featureName>/
  domain/
    types.ts
    normalize.ts
  application/
    service.ts
  adapters/
    apiClient.ts
    domParser.ts
  ui/
    panel.ts
    modal.ts
    styles.css
  tests/
    service.test.ts
    ui.test.ts
  index.ts
```

小功能可以先保持精简结构：

```text
features/settingsSearch/
  index.ts
  searchIndex.ts
  navigation.ts
  highlight.ts
  settingsSearch.test.ts
```

### `platform`

`platform` 是基础设施层。它承载浏览器扩展 API、网络请求、日志、存储和任务调度。

职责：

- Chrome runtime/tabs/storage 包装。
- HTTP client、代理、重试、错误分类。
- IndexedDB、Chrome Storage 的基础封装。
- 全局任务中心、scheduler、visibility。
- 日志和 console proxy。

限制：

- 不包含 JavDB、磁力、字幕、115 等业务规则。
- 不 import `features`。

示例：

```text
platform/browser/messaging.ts
platform/browser/tabs.ts
platform/network/httpClient.ts
platform/network/proxy.ts
platform/storage/indexedDb.ts
platform/storage/indexedDbConnection.ts
platform/storage/indexedDbSchema.ts
platform/storage/indexedDbLogFields.ts
platform/storage/indexedDbViewedIndexes.ts
platform/tasks/taskCenter.ts
platform/logging/logger.ts
```

当前 `platform/storage/indexedDb.ts` 已收缩为稳定 API facade。IndexedDB schema、连接升级、日志索引字段、viewed 二级索引维护逻辑分别进入独立模块，`src/background/db.ts` 仅保留兼容导出。Background 目录不再承载测试文件，相关回归测试进入 `tests/regression`。

Content 任务运行时已归位到 `platform/tasks` 与 `platform/browser`：页面上下文进入 `platform/browser/pageContext.ts`，任务 descriptor、心跳、可见性上报、任务明细上报和内容侧性能优化器进入 `platform/tasks/*`。列表页处理器已归位到 `features/listEnhancement/content/itemProcessor.ts`。旧 `src/content/pageContext.ts`、`taskRuntime.ts`、`taskHeartbeat.ts`、`taskVisibilityReporter.ts`、`taskDetailReporter.ts`、`taskChunking.ts`、`performanceOptimizer.ts`、`itemProcessor.ts` 仅保留兼容导出，apps/features/content 内部调用优先走 platform 稳定入口。

内容脚本共享状态已归位到 `features/contentState`。旧 `src/content/state.ts` 仅保留兼容导出，apps/content 和各内容侧 feature 统一使用 feature 入口。

JAVBUS tab ajax fallback 已按前后台职责拆分：后台真实 tab 打开和页面注入执行器位于 `platform/browser/javbusTabFetch.ts`，内容脚本侧 runtime 请求客户端位于 `platform/browser/javbusRuntimeClient.ts`。旧 `src/background/javbusTabFetch.ts` 与 `src/content/javbusTabFetch.ts` 仅保留兼容导出。

Content 初始化编排器已归位到 `apps/content/orchestrator`。旧 `src/content/initOrchestrator.ts` 仅保留兼容导出，`apps/content/bootstrap.ts` 直接装配本地 app orchestrator。orchestrator 类型、硬件并发决策、metrics 状态、纯调度规则、重试定时器、高优先级阶段调度、页面生命周期绑定和 Dashboard metrics 消息监听已拆到独立模块。后续详情页、115 content 入口、快捷键等内容脚本能力继续按 feature/app 边界迁移。

115 详情页/磁力推送内容脚本能力已归位到 `features/drive115/content`。旧 `src/content/drive115.ts` 仅保留兼容导出，`apps/content/bootstrap.ts` 和磁力 UI 直接使用 feature 子入口；`features/drive115/index.ts` 继续暴露 app/router/v2，避免 background/dashboard 通过顶层入口拉入 DOM 内容脚本模块。

键盘快捷键能力已归位到 `features/keyboardShortcuts`。旧 `src/content/keyboardShortcuts.ts` 仅保留兼容导出，`apps/content/bootstrap.ts` 和生命周期清理模块直接使用 feature 入口。

内容侧隐私保护能力已归位到 `features/privacy/content`。旧 `src/content/privacy/*` 仅保留兼容导出，内容导出功能直接使用 `features/privacy` 服务入口。

页面数据导出能力已归位到 `features/pageExport/content`。旧 `src/content/export.ts` 仅保留兼容导出，主内容脚本直接装配 page export feature。

内容侧通用 UI/DOM 工具已归位到 platform 与详情页 feature：toast 进入 `platform/browser/toast.ts`，DOM/主题/favicon 工具进入 `platform/browser/domUtils.ts`，增强加载提示进入 `platform/browser/enhancementLoadingIndicator.ts`，任务超时守卫进入 `platform/tasks/taskTimeoutGuard.ts`，影片收藏评分进入 `features/videoDetail/favoriteRating.ts`。旧 `src/content/toast.ts`、`utils.ts`、`enhancementLoadingIndicator.ts`、`videoFavoriteRating.ts` 仅保留兼容导出。

页面视频 ID 提取已归位到 `platform/browser/videoId.ts`，纯解析算法位于 `shared/utils/videoId.ts`。旧 `src/content/videoId.ts` 仅保留兼容导出，详情页、磁力、115、在线可看、状态同步和 insights 调用方直接使用 platform 入口。

密码显示助手内容脚本实现已归位到 `features/passwordHelper/content`。旧 `src/content/passwordHelper.ts` 仅保留兼容导出，`passwordHelper-standalone.ts` 作为 manifest 独立入口继续保持当前路径。

锚点优化内容脚本实现已归位到 `features/anchorOptimization/content`。旧 `src/content/anchorOptimization.ts` 仅保留兼容导出，主内容脚本和 DOM 测试直接使用 feature 入口。

封面增强内容脚本实现已归位到 `features/coverEnhancement/content`。旧 `src/content/coverEnhancement.ts` 仅保留兼容导出。

Emby/Jellyfin 页面增强内容脚本实现已归位到 `features/embyEnhancement/content`。旧 `src/content/embyEnhancement.ts` 仅保留兼容导出，主内容脚本、消息路由和生命周期清理直接使用 feature 入口。

详情页主处理已归位到 `features/videoDetail`：`pageHandler.ts` 承载详情页状态同步、任务蓝图、演员备注触发和页面处理入口，`enhancer.ts` 承载详情页增强器、翻译、封面、评论、FC2、相关清单和预览增强，`favoriteRating.ts` 承载收藏评分 UI。旧 `src/content/videoDetail.ts` 与 `src/content/enhancedVideoDetail.ts` 仅保留兼容导出，`apps/content`、Dashboard orchestrator 设计页和 DOM 测试直接使用 feature 入口。

详情页外部搜索 UI 已归位到 `features/externalSearch`。旧 `src/content/detailSearchLinks.ts` 仅保留兼容导出，详情页处理和 DOM 测试直接使用 external search feature 入口。

首页报告入口骨架已归位到 `features/insights/ui/homeInsightsWidget.ts`。旧 `src/content/homeInsightsWidget.ts` 仅保留兼容导出。

内容侧番号记录并发写入和视频处理队列已归位到 `features/records/content`。旧 `src/content/concurrency.ts` 与 `src/content/concurrencyTest.ts` 仅保留兼容导出，详情页记录状态写入直接使用 records feature 入口。

### `shared`

`shared` 是跨层共享层。它保持纯净，放类型、协议、常量和无副作用工具函数。

职责：

- 跨 app/feature/platform 的消息协议。
- 纯类型定义。
- 纯函数工具。
- 业务无关常量。

限制：

- 不访问 DOM。
- 不访问 Chrome API。
- 不发网络请求。
- 不读写存储。

## 依赖方向

推荐依赖方向：

```text
apps -> features -> platform
apps -> platform
features -> shared
platform -> shared
apps -> shared
```

禁止方向：

```text
platform -> features
shared -> platform
shared -> features
features/<A>/internal -> features/<B>/internal
```

跨 feature 调用必须走目标 feature 的 `index.ts`。

## 现有目录的未来定位

### `src/content`

逐步收敛为 `apps/content`。现有内容脚本里的业务逻辑迁到 `features`。

未来职责：

- 页面识别。
- 页面生命周期。
- DOM mount point 查找。
- 调用 feature 初始化。

### `src/background`

逐步收敛为 `apps/background` + `platform`。

未来职责：

- service worker bootstrap。
- message router。
- 定时任务入口。

数据库、网络代理、任务中心、后台 console 装配等迁入 `platform`。
已浏览记录的标签统计等业务规则迁入 `features/records`。

### `src/dashboard`

短期保留现状，新增 Dashboard 业务能力优先进入 `features`，Dashboard 入口和 partial 仍在 `dashboard`。

设置搜索作为第一个试点：

```text
features/settingsSearch/
apps/dashboard/
```

### `src/services`

现有 `services` 按业务域迁入 `features`，按基础设施迁入 `platform`。

示例：

- `services/reviewBreaker` -> `features/reviewUnlock`
- `services/relatedLists` -> `features/relatedLists`
- `services/fc2Breaker` -> `features/fc2Breaker`
- `services/privacy` -> `features/privacy` + `platform/browser`
- `services/dataAggregator` -> 评估后归入 `features` 或 `platform/network`

### `src/utils`

`utils` 逐步瘦身，旧路径只保留兼容导出，真实实现按职责进入 `shared`、`platform` 或 `features`。

已归位：

- `searchEngines.ts` -> `features/externalSearch/domain`
- `net.ts`、`ipLookup.ts` -> `platform/network`
- `statusPriority.ts` -> `features/videoStatus`
- `listRecordHelpers.ts` -> `shared/utils`
- `webdavDiagnostic.ts` -> `features/webdavSync/application`
- `codeParser.ts`、`md5.ts`、`tagFilter.ts`、`versionInfo.ts`、`videoId.ts` 的纯解析逻辑 -> `shared/utils`
- `consoleProxy.ts` -> `platform/logging`
- `routeManager.ts` -> `features/routeManagement`
- `dataDiff.ts`、`dataMerge.ts`、`mergeKeyedMap.ts` -> `features/webdavSync/application`
- `cache.ts` -> `platform/storage`
- `domainConfig.ts` -> `features/networkTest/domain`

建议迁移：

- `config.ts` -> `shared/config` 或拆入各 feature config
- `storage.ts` -> `platform/storage`

## 新功能落点规则

新增功能先问三个问题：

1. 这是用户可感知的业务能力吗？
   - 是：进入 `features/<featureName>`。
2. 这是浏览器、网络、存储、任务、日志等基础能力吗？
   - 是：进入 `platform/<area>`。
3. 这是跨模块纯类型、协议、常量或纯函数吗？
   - 是：进入 `shared/<area>`。

只有运行入口、页面装配、路由装配进入 `apps`。

## 设置搜索试点

设置搜索是第一批按新结构开发的新功能。

目标结构：

```text
src/features/settingsSearch/
  domain/
    types.ts
    aliases.ts
  application/
    buildSettingsSearchIndex.ts
    findSettingsResults.ts
    resolveSettingsTarget.ts
  ui/
    settingsSearchBox.ts
    settingsSearchHighlight.ts
  index.ts
```

Dashboard 接入点：

```text
src/apps/dashboard/settingsSearchBootstrap.ts
```

如果短期仍沿用现有 `src/dashboard` 入口，也应让 Dashboard 文件只调用：

```ts
import { mountSettingsSearch } from '../../features/settingsSearch';
```

试点规则：

- 搜索索引优先从 DOM 自动生成。
- 少量别名放在 `features/settingsSearch/domain/aliases.ts`。
- 跳转、滚动、高亮逻辑放在 feature 内部。
- Dashboard 只提供 mount 容器和路由生命周期。

## 迁移路线

### 阶段 1：建立新架构骨架

- 新建 `apps/`、`features/`、`platform/` 子目录。
- 设置搜索按新结构实现。
- 新功能使用新结构。

当前状态：

- `src/apps`、`src/features`、`src/platform` 已建立 README 骨架。
- `src/shared` 已补充子目录骨架，并保留现有 task center 协议文件。
- `features/settingsSearch` 已建立 `domain`、`application`、`ui` 骨架，作为第一个试点落点。

验收：

```bash
pnpm run typecheck
pnpm run build
```

### 阶段 2：迁移高增长功能域

优先迁移：

```text
features/magnets
features/subtitles
features/onlineAvailability
features/externalSearch
features/videoStatus
```

当前 `features/magnets` 已按 domain/application/adapters/ui 分层：

```text
features/magnets/domain/types.ts
features/magnets/application/resultMerge.ts
features/magnets/application/resultMetadata.ts
features/magnets/application/pagination.ts
features/magnets/application/sourceTagState.ts
features/magnets/adapters/javbus/source.ts
features/magnets/ui/magnetSearchManager.ts
```

`resultMetadata.ts` 承载磁力大小解析、字幕/画质/破解识别、日期归一化、番号匹配和排序等纯逻辑。`magnetSearchManager.ts` 保持 UI 编排、DOM 渲染、搜索流程和缓存调用职责。

当前 `features/listEnhancement` 已开始按 domain/application/ui 拆分：

```text
features/listEnhancement/domain/config.ts
features/listEnhancement/application/actorMatching.ts
features/listEnhancement/application/actorHiding.ts
features/listEnhancement/application/actorHidingWorkflow.ts
features/listEnhancement/application/actorWatermark.ts
features/listEnhancement/application/popularityEffects.ts
features/listEnhancement/application/scrollPaging.ts
features/listEnhancement/ui/clickEnhancement.ts
features/listEnhancement/ui/listItemObserver.ts
features/listEnhancement/ui/listItemDom.ts
features/listEnhancement/ui/listScrollState.ts
features/listEnhancement/ui/listDisplayControl.ts
features/listEnhancement/ui/previewHoverController.ts
features/listEnhancement/ui/styles.ts
features/listEnhancement/listEnhancementManager.ts
features/previews/listPreviewLoader.ts
```

`config.ts` 承载列表增强配置类型和默认值，`actorMatching.ts` 承载标题演员匹配算法，`actorHiding.ts` 承载演员隐藏决策，`actorHidingWorkflow.ts` 承载演员隐藏执行流程和 DOM 标记恢复，`actorWatermark.ts` 承载演员索引/订阅缓存、DOM 演员提取和水印渲染，`popularityEffects.ts` 承载热度评分解析和效果属性构建，`scrollPaging.ts` 承载页码解析、触底判断、加载指示器和下一页追加控制器，`clickEnhancement.ts` 承载列表点击增强、FC2 拦截弹窗、右键后台打开和防抖，`listItemObserver.ts` 承载现有列表项处理和新增列表项观察，`listItemDom.ts` 承载列表项影片信息提取、标题按钮和标题样式优化，`listScrollState.ts` 承载滚动状态和滚动期间列表指针事件控制，`listDisplayControl.ts` 承载列表显示控制的 DOM 应用、域名限制、样式注入和容器接管，`previewHoverController.ts` 承载列表预览 hover 状态机、延迟计时、视频复用和媒体释放，`styles.ts` 承载热度 CSS、列表显示控制 CSS 和基础注入 CSS。`listPreviewLoader.ts` 承载列表悬停预览来源选择、缓存和 video 元素创建。`listEnhancementManager.ts` 保持 DOM 生命周期和页面编排职责。

迁移方式：

- 每次只迁一个 feature。
- 保留旧路径 re-export 一轮，降低 import 震荡。
- 更新测试路径。
- 跑聚焦测试、typecheck、build。

### 阶段 3：收敛基础设施

迁移：

```text
platform/network
platform/storage
platform/tasks
platform/logging
platform/browser
```

重点处理：

- background DB 和 migrations。
- request scheduler。
- task center。
- console proxy 和 logger。

### 阶段 4：清理旧目录

- 删除旧路径 re-export。
- 清理 `src/background/*.bak` 和 `src/background/background.ts.step*`。
- 更新开发文档和 import 规则。

## 迁移验收标准

每个迁移批次必须满足：

- `pnpm run typecheck` 通过。
- 相关 DOM/unit 测试通过。
- `pnpm run build` 通过。
- 外部行为保持一致。
- 新目录有 `index.ts` 作为稳定入口。
- 旧路径保留或统一替换，避免混用。

## 命名规则

- feature 目录使用 camelCase：`onlineAvailability`、`settingsSearch`。
- domain 文件使用业务名词：`types.ts`、`normalizer.ts`、`matcher.ts`。
- adapter 文件体现外部依赖：`xunleiApi.ts`、`javbusParser.ts`。
- UI 文件体现组件：`subtitleModal.ts`、`settingsSearchBox.ts`。
- app 文件体现运行职责：`bootstrap.ts`、`messageRouter.ts`、`pageRouter.ts`。

## 当前优先级

1. 设置搜索按新结构实现，验证 `features/settingsSearch` 的开发体验。
2. 迁移字幕和外部搜索相关代码，形成 `features/subtitles` 与 `features/externalSearch`。
3. 迁移磁力功能域，形成 `features/magnets`。
4. 迁移 background 基础设施到 `platform`。
5. 清理历史备份文件和旧路径。
