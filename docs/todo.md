# 📋 Todo 计划

---

## 🔐 115 功能

---
## 首页
---

## 🎨 功能增强


- [ ] 聚合
- [ ] 符合 emby 的页面番号识别功能（在影片页面方便识别网友评论中的经典番号）
- [ ] 标签高亮/折叠
  - [ ] 支持列表页按标签高亮命中项
  - [ ] 支持折叠低优先级标签区域
  - [ ] 结合现有内容过滤规则，避免重复实现一套过滤体系
- [ ] 状态按钮视觉优化
  - [ ] 详情页当前状态高亮，其它状态置灰
  - [ ] 评估是否吸收 JAV-JHS 的屏蔽、收藏、已下载、已观看四状态交互

---

## ⚙️ Dashboard / 设置页

- [x] 设置搜索：实现类似 Windows 设置的扁平搜索
  - [x] 设置首页新增搜索框，搜索设置项标题、描述、关键词
  - [x] 搜索结果点击后跳转到对应设置页
  - [x] 设置页加载后滚动到具体设置项
  - [x] 目标设置项显示短暂高亮动画
  - [x] 支持 Enter 进入首个结果
  - [x] 支持 Esc 清空搜索
  - [x] 支持少量关键词别名：字幕、迅雷、115、WebDAV、在线可看、磁力、FC2、隐私、代理、AI
  - [x] 优先使用 DOM 自动索引，减少手工维护
- [x] 搜索引擎设置：统一启用开关语义
  - [x] “是否启用”同时控制详情页入口和番号库入口
  - [x] 内置项保持只读，只允许切换启用状态
  - [x] 放弃“隐藏内置项”方案，避免与启用开关形成重复概念
- [ ] 客户端遥测设备 ID 对齐
  - [ ] 核实 `buildTelemetryPayload.ts` 当前 `deviceId` 来源为 `telemetry_client_state.installId`
  - [ ] 改为优先上报设置页显示的 `settings.webdav.clientId`
  - [ ] 保留 `installId` 作为遥测安装归并标识，避免混用为管理端设备 ID
  - [ ] 补充测试：设置页 Device ID 变化后，payload 的 `deviceId` 使用最新 `webdav.clientId`
  - [ ] 补充兼容测试：无 `webdav.clientId` 时仍能用 telemetry install state 完成内部归并

- [ ] 错误事件上报（error_report）
  - [ ] 设计原则：参考浏览器错误上报，只报"什么坏了"，不报"用户在看什么"
    - 上报三元组：`component`（在哪坏的）+ `code`（怎么坏的）+ `stackHash`（哪行代码）
    - `message` 只保留 Error 类名（如 `TypeError`、`ReferenceError`），**丢弃 `.message` 内容**
    - 不上报页面 URL、番号、磁力链接、API 地址、token 等任何用户数据
    - 不上报原始 stack trace，只上报 MD5 哈希后的 `stackHash`
  - [ ] 扩展 `domain/types.ts` 类型定义
    - `TelemetryEventType` 加 `'error_report'`
    - 新增 `TelemetryErrorInfo`（component / code / message[仅类名] / stackHash / fatal）
    - 新增 `TelemetryErrorReportPayload`（轻量 payload，不含 features/metrics）
    - 新增 `TelemetryAnyPayload` 联合类型
    - `TelemetryReportResult.reason` 加 `'internal-error'` 和 `'deduplicated'`
  - [ ] 新增 `application/buildErrorReportPayload.ts`
    - 轻量 payload 构建器：只构建 client + activity + error，跳过 features/metrics
    - `component` 截断 80 字符
    - `message` 只取 Error 类名（如 `TypeError`），无 Error 对象时用 `UnknownError`，截断 80 字符
    - stack 归一化（去行号/列号、取前 10 帧、替换 chunk hash）后 MD5 生成 `stackHash`
    - 导出 `generateStackHash()` 供节流模块使用
    - 复用 `getTelemetryRuntimeInfo()` 和 `createTelemetryEventId()`
  - [ ] 新增 `application/errorThrottle.ts`
    - 会话级去重：`Set<stackHash>`，同一 service worker 生命周期内同一错误只上报一次
    - 指纹级冷却：`Map<stackHash, timestamp>`，5 分钟冷却期
    - 上限 100 个指纹，超出淘汰最旧
    - 导出 `shouldReportError(stackHash)` 和测试用 `__resetErrorThrottle()`
  - [ ] 新增 `application/errorReporter.ts`
    - `reportTelemetryError(error, options?)` 整合 payload 构建 + 节流 + 发送
    - 全局 try-catch 包裹，永不抛异常
    - 检查 telemetry enabled / endpoint 存在后才发送
  - [ ] 更新 `infrastructure/telemetryClient.ts`
    - `SendTelemetryInput.payload` 类型从 `TelemetryPayload` 扩展为 `TelemetryPayload | TelemetryErrorReportPayload`
  - [ ] 更新 `application/runtimeMessages.ts`
    - `handleTelemetryRuntimeMessage` 新增 `telemetry:error` 消息处理
    - 从 content script 接收错误 payload 并转发给 `reportTelemetryError()`
  - [ ] 更新 `apps/background/errorHandlers.ts`
    - 在全局 `unhandledrejection` 和 `error` 监听中 fire-and-forget 调用 `reportTelemetryError()`
    - 只提取 `error.name`（类名）和 `error.constructor.name`，**不提取 `error.message`**
  - [ ] 更新 `apps/content/bootstrap.ts`
    - 新增局部 `reportContentError()` 函数，通过 `chrome.runtime.sendMessage` 发送 `telemetry:error`
    - 只传 `error.name`（类名），**不传 `error.message`、`window.location`、页面内容**
    - 新增 `window` 级 `error` + `unhandledrejection` 全局监听器
    - `onExecute()` 的 `.catch` 中调用 `reportContentError(err, 'init')`
  - [ ] 更新 `index.ts` 导出
  - [ ] 验证
    - 单元测试：payload 构建、stackHash 一致性、节流/去重、reporter 集成、runtime message 处理
    - 隐私测试：确认 payload 中不含任何用户数据（番号、URL、token、磁力链）
    - 手动验证：dev 模式触发已知错误，检查 network 面板 POST body
    - 后端验证：admin API `GET /v1/admin/events?event=error_report`

---

## 🧱 项目结构 / 代码组织

- [x] 制定 `src` 未来架构规划
  - [x] 目标分层：`apps / features / platform / shared`
  - [x] 明确运行入口、业务能力、基础设施、共享协议的职责边界
  - [x] 约定新功能优先进入 `features/<featureName>`
  - [x] 约定每个 feature 使用 `index.ts` 暴露稳定入口
  - [x] 文档：[source-architecture.md](./source-architecture.md)
- [x] 建立新架构骨架
  - [x] 新建 `src/apps`
  - [x] 新建 `src/features`
  - [x] 新建 `src/platform`
  - [x] 保留并收敛 `src/shared`
  - [x] 补充最小 `index.ts` 或 README 说明，避免空目录丢失
- [x] 第一个试点功能：`features/settingsSearch`
  - [x] 建立 `domain/aliases.ts`、`domain/types.ts`
  - [x] 建立 `application/buildSettingsSearchIndex.ts`
  - [x] 建立 `application/findSettingsResults.ts`
  - [x] 建立 `application/resolveSettingsTarget.ts`
  - [x] 建立 `ui/settingsSearchBox.ts`
  - [x] 建立 `ui/settingsSearchHighlight.ts`
  - [x] Dashboard 只负责 mount 和路由生命周期
- [x] 第二批迁移：字幕与外部搜索
  - [x] 迁移前测试基线
    - [x] 外部搜索：链接生成、重复模板去重、FC2 专用入口、禁用引擎过滤
    - [x] 外部搜索：详情页插入位置优先跟随“在线可看”面板
    - [x] 外部搜索：统一入口关闭时移除详情页外部搜索与字幕搜索面板
    - [x] 字幕搜索：分类独立显示，支持单独关闭字幕搜索或外部搜索
    - [x] 迅雷字幕：点击入口打开弹窗并请求 API
    - [x] 迅雷字幕：真实 `MKMP-577` 响应字段、元信息 tag、复制和下载动作
    - [x] 迅雷字幕：空结果、请求失败、关闭弹窗、样式注入、图标回退
  - [x] 建立 `features/subtitles`
  - [x] 迁移迅雷字幕弹窗与响应 normalize 逻辑
  - [x] 建立 `features/externalSearch`
  - [x] 迁移详情页外部搜索渲染和搜索引擎匹配逻辑
  - [x] 旧路径保留 re-export 一轮，降低 import 震荡
- [x] 第三批迁移：磁力功能域
  - [x] 迁移前测试基线
    - [x] `magnetResultMerge`：缓存结果追加、按 hash 去重、跨来源 source 合并、复合来源标签规范化
    - [x] `magnetPagination`：10 条阈值、超过 10 条分页、页码边界夹取
    - [x] `magnetSourceTagState`：唯一结果按来源计数、成功/失败/缓存保留 tag 文案
    - [x] `javbusMagnetSource`：Ajax 参数提取、Ajax URL、表格解析、完整 HTML fallback、raw magnet fallback、诊断信息
    - [x] `magnetSearch`：主搜索管理器只保留旧路径兼容，本批不拆运行时大类
  - [x] 建立 `features/magnets`
  - [x] 迁移 `magnetSearch.ts`
  - [x] 迁移 `magnetResultMerge.ts`
  - [x] 迁移 `magnetPagination.ts`
  - [x] 迁移 `magnetSourceTagState.ts`
  - [x] 迁移 `javbusMagnetSource.ts`
  - [x] 旧路径保留 re-export 一轮，降低 import 震荡
- [x] 第四批迁移：基础设施
  - [x] 迁移前测试基线
    - [x] `HttpClient`：background fetch 返回 HTTP 错误状态时抛出 `NetworkError`
    - [x] `ChromeStorage`：普通值读写、空值 fallback、大对象分片、IDB 迁移读取、旧 `utils/storage` 导出兼容
    - [x] `Tasks`：分片任务批处理、内容脚本任务消息协议、任务调度依赖重试
    - [x] `Browser`：runtime callback 消息 Promise 化、lastError/runtime 缺失处理、JAVBUS tab fetch fallback
    - [x] `Logging`：日志级别开关、重要日志持久化钩子、控制台输出抑制、旧 `utils/logController` 兼容
    - [x] `RequestScheduler`：in-flight 去重、同 host 并发限制
    - [x] `GlobalTaskCenter`：任务租约调度、bucket 策略、状态存储、跨页面完成状态
  - [x] 建立 `platform/network`
  - [x] 迁移 `services/dataAggregator/httpClient.ts` 到 `platform/network/httpClient.ts`
  - [x] 沉淀 `FetchOptions`、`NetworkError` 到 `platform/network/types.ts`
  - [x] 旧 `services/dataAggregator/httpClient.ts` 保留 re-export 兼容
  - [x] 建立 `platform/storage`
  - [x] 迁移 Chrome Storage 通用读写、分片存储和运行时迁移读取到 `platform/storage/chromeStorage.ts`
  - [x] 旧 `utils/storage.ts` 保留设置合并、搜索引擎合并和 `getValue`/`setValue` 兼容导出
  - [x] 建立 `platform/tasks`
  - [x] 迁移 `runChunkedWork`、`yieldToMainThread` 到 `platform/tasks/chunking.ts`
  - [x] 迁移任务中心 register/lease/progress/active tracking 到 `platform/tasks/runtimeMessaging.ts`
  - [x] 旧 `content/taskChunking.ts`、`content/taskRuntime.ts` 保留 re-export 和页面上下文兼容
  - [x] 建立 `platform/logging`
  - [x] 迁移纯日志控制器到 `platform/logging/logController.ts`
  - [x] 旧 `utils/logController.ts` 保留设置读取、consoleProxy 同步和后台日志持久化装配
  - [x] 建立 `platform/browser`
  - [x] 迁移通用 runtime callback 消息封装到 `platform/browser/runtimeMessages.ts`
  - [x] 接入 `content/javbusTabFetch.ts`，保留业务响应校验
  - [x] 迁移 `background/requestScheduler.ts` 到 `platform/network/requestScheduler.ts`
  - [x] 旧 `background/requestScheduler.ts` 保留 re-export 兼容
  - [x] 迁移 `background/globalTaskCenter.ts` 到 `platform/tasks/globalTaskCenter.ts`
  - [x] 迁移 `taskPolicy`、`taskStateStore`、`taskCenterPolicyRuntime` 到 `platform/tasks`
  - [x] 旧 `background/globalTaskCenter.ts` 与任务策略文件保留 re-export 兼容
  - [x] 迁移 background DB 等基础设施
    - [x] 迁移 IndexedDB 核心到 `platform/storage/indexedDb.ts`
    - [x] 迁移 trend helper 到 `platform/storage/trendUtils.ts`
    - [x] 旧 `background/db.ts` 与 `background/trendUtils.ts` 保留 re-export 兼容
    - [x] background DB 路由、迁移、WebDAV、调度与新作品采集改用 `platform/storage/indexedDb.ts`
- [x] 第五批迁移：新作品功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/newWorks` 只能作为兼容出口
  - [x] 建立 `features/newWorks`
  - [x] 迁移 `collector.ts`、`manager.ts`、`scheduler.ts`、`types.ts`
  - [x] `services/newWorks/*` 保留 re-export 兼容
  - [x] background、content、dashboard 调用方改用 `features/newWorks`
- [x] 第六批迁移：演员库功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/actorManager.ts` 与 `services/actorSync.ts` 只能作为兼容出口
  - [x] 建立 `features/actors`
  - [x] 迁移 `actorManager.ts` 与 `actorSync.ts`
  - [x] `services/actorManager.ts` 与 `services/actorSync.ts` 保留 re-export 兼容
  - [x] content、dashboard、newWorks 调用方改用 `features/actors`
- [x] 第七批迁移：相关清单功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/relatedLists` 只能作为兼容出口
  - [x] 建立 `features/relatedLists`
  - [x] 迁移相关清单 API 映射与分页响应逻辑
  - [x] `services/relatedLists` 保留 re-export 兼容
  - [x] 影片页增强与 DOM 测试调用方改用 `features/relatedLists`
- [x] 第八批迁移：评论解锁功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/reviewBreaker` 只能作为兼容出口
  - [x] 建立 `features/reviewUnlock`
  - [x] 迁移评论 API、签名生成与过滤关键词逻辑
  - [x] `services/reviewBreaker` 保留 re-export 兼容
  - [x] 影片页增强、超级排行榜、FC2 与相关清单调用方改用 `features/reviewUnlock`
- [x] 第九批迁移：FC2 破解功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/fc2Breaker` 只能作为兼容出口
  - [x] 建立 `features/fc2Breaker`
  - [x] 迁移 FC2 API、弹窗、磁力区与 115 推送联动逻辑
  - [x] `services/fc2Breaker` 保留 re-export 兼容
  - [x] 影片页增强、列表增强与 FC2 DOM 测试调用方改用 `features/fc2Breaker`
- [x] 第十批迁移：演员备注功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/actorRemarks` 只能作为兼容出口
  - [x] 建立 `features/actorRemarks`
  - [x] 迁移 Wikipedia/xslist 聚合、缓存与请求去重逻辑
  - [x] `services/actorRemarks` 保留 re-export 兼容
  - [x] 影片页、演员页、演员增强与演员库调用方改用 `features/actorRemarks`
- [x] 第十一批迁移：Insights 报告功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/insights` 只能作为兼容出口
  - [x] 建立 `features/insights`
  - [x] 迁移月度聚合、对比聚合、报告模板、提示词、人设与生成追踪逻辑
  - [x] `services/insights` 保留 re-export 兼容
  - [x] background scheduler、Dashboard 报告页与首页图表改用 `features/insights`
- [x] 第十二批迁移：数据聚合功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/dataAggregator` 只能作为兼容出口
  - [x] 建立 `features/dataAggregator`
  - [x] 迁移数据聚合器、类型定义、BlogJav/JavLibrary/Translator/AITranslator source 与单元测试
  - [x] `services/dataAggregator` 保留 re-export 兼容，HTTP client 继续归属 `platform/network`
  - [x] 影片页增强、内容入口、在线可看、演员备注、字幕 API 与相关测试改用新路径
- [x] 第十三批迁移：更新检查功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/update/checker.ts` 只能作为兼容出口
  - [x] 建立 `features/updateChecker`
  - [x] 迁移 GitHub Releases 更新检查、版本比较、检查策略和缓存结果逻辑
  - [x] `services/update/checker.ts` 保留 re-export 兼容
  - [x] Dashboard 顶栏版本检查与更新设置页改用新路径
- [x] 第十四批迁移：AI 服务功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/ai` 只能作为兼容出口
  - [x] 建立 `features/ai`
  - [x] 迁移 AI 设置、模型管理、New API 客户端、速率限制和提示词配置
  - [x] `services/ai/*` 保留 re-export 兼容
  - [x] 影片页增强、数据聚合、Insights 和 Dashboard AI 设置改用新路径
- [x] 第十五批迁移：隐私保护功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/privacy` 只能作为兼容出口
  - [x] 建立 `features/privacy`
  - [x] 迁移隐私管理、密码、会话、模糊控制、锁屏和恢复服务
  - [x] `services/privacy/*` 保留 re-export 兼容
  - [x] content 隐私入口、Dashboard 隐私组件、同步和全局操作改用新路径
- [x] 第十六批迁移：115 功能域
  - [x] 迁移前使用架构回归测试约束旧 `services/drive115*` 只能作为兼容出口
  - [x] 建立 `features/drive115/legacy`、`app`、`router`、`v2`
  - [x] 迁移 115 设置归一化、统一应用服务、推送日志、路由、v2 API、PKCE 和文件搜索
  - [x] `services/drive115*` 保留 re-export 兼容
  - [x] content、background、Dashboard、FC2 推送和 115 相关测试改用新路径
- [x] 第十七批迁移：隐私工具收口
  - [x] 迁移前使用架构回归测试约束旧 `utils/privacy` 只能作为兼容出口
  - [x] 建立 `features/privacy/utils`
  - [x] 迁移隐私加密、存储和验证工具
  - [x] `utils/privacy/*` 保留 re-export 兼容
  - [x] 隐私功能域和密码恢复弹窗改用新路径
- [x] 第十八批迁移：Background 入口层
  - [x] 迁移前使用架构回归测试约束 manifest 入口保持薄加载器
  - [x] 建立 `apps/background/bootstrap.ts`
  - [x] 迁移 service worker 初始化、消息监听、alarm、动态内容脚本和后台刷新装配逻辑
  - [x] `background/background.ts` 保留 manifest service worker 入口
  - [x] 保持 `src/manifest.json` 的 service worker 路径不变
- [x] 第十九批迁移：Content 主入口层
  - [x] 迁移前使用架构回归测试约束 manifest 内容脚本入口保持薄加载器
  - [x] 建立 `apps/content/bootstrap.ts`
  - [x] 迁移 JavDB/JavBus 主内容脚本初始化、orchestrator、列表/详情增强和页面监听装配逻辑
  - [x] `content/index.ts` 保留 manifest content script 入口
  - [x] 保持 `src/manifest.json` 的主内容脚本路径不变
- [x] 第二十批迁移：115 Content 专用入口层
  - [x] 迁移前使用架构回归测试约束 115 content script 入口保持薄加载器
  - [x] 建立 `apps/content/drive115Content.ts` 与 `apps/content/drive115Verify.ts`
  - [x] 迁移 115 网盘页面推送处理和验证码页面验证监听逻辑
  - [x] `content/drive115-content.ts` 与 `content/drive115-verify.ts` 保留 manifest content script 入口
  - [x] 保持 `src/manifest.json` 的 115 content script 路径不变
- [x] 第二十一批迁移：Dashboard 入口层
  - [x] 迁移前使用架构回归测试约束 Dashboard 页面入口保持薄加载器
  - [x] 建立 `apps/dashboard/bootstrap.ts`
  - [x] 迁移 Dashboard 初始化、主题、侧栏、标签页、用户信息、隐私和遥测装配逻辑
  - [x] `dashboard/dashboard.ts` 保留 HTML module script 入口
  - [x] 保持 `dashboard/dashboard.html` 的脚本路径不变
- [x] 第二十二批迁移：Popup 入口层
  - [x] 迁移前使用架构回归测试约束 Popup 页面入口保持薄加载器
  - [x] 建立 `apps/popup/bootstrap.ts`
  - [x] 迁移 Popup 设置读取、主题、筛选开关、音量和页面跳转装配逻辑
  - [x] `popup/popup.ts` 保留 HTML module script 入口
  - [x] 保持 `popup/popup.html` 的脚本路径不变
- [x] 第二十三批迁移：在线可看功能域
  - [x] 迁移前使用架构回归测试约束旧 `content/onlineAvailability.ts` 只能作为兼容出口
  - [x] 建立 `features/onlineAvailability`
  - [x] 迁移在线站点配置、URL 构造、响应解析、面板渲染和检查调度逻辑
  - [x] `content/onlineAvailability.ts` 保留 re-export 兼容
  - [x] content bootstrap 与在线可看 DOM 测试改用新路径
- [x] 第二十四批迁移：影片状态功能域
  - [x] 迁移前使用架构回归测试约束旧 `content/statusManager.ts` 与 `utils/statusPriority.ts` 只能作为兼容出口
  - [x] 建立 `features/videoStatus`
  - [x] 迁移详情页标题、favicon 状态同步逻辑
  - [x] 迁移状态优先级工具
  - [x] content bootstrap 与详情页状态更新改用新路径
- [x] 第二十五批迁移：列表记录共享工具
  - [x] 迁移前使用架构回归测试约束旧 `utils/listRecordHelpers.ts` 只能作为兼容出口
  - [x] 迁移列表记录归一化、系列/标签匹配工具到 `shared/utils`
  - [x] Dashboard 列表、番号库和数据同步改用共享路径
  - [x] platform storage 改用共享路径，保持 platform 不依赖 utils 业务目录
- [x] 第二十六批迁移：Background 小型模块瘦身
  - [x] 迁移前使用架构回归测试约束目标旧 `background/*` 只能作为兼容出口
  - [x] 迁移 `background/consoleConfig.ts` 到 `platform/logging/backgroundConsole.ts`
  - [x] 迁移 `background/netProxy.ts` 到 `platform/network/backgroundFetchRouter.ts`
  - [x] 迁移 `background/javbusTabFetch.ts` 到 `platform/browser/javbusTabFetch.ts`
  - [x] 迁移 `background/viewedTagStats.ts` 到 `features/records/tagStats.ts`
  - [x] 更新 `apps/background/bootstrap.ts` 与相关测试导入到新路径
  - [x] 旧 `background/*` 文件保留 re-export 兼容
- [x] 第二十七批迁移：Background 装配层拆分
  - [x] 为 `apps/background/bootstrap.ts` 增加架构回归约束，限制入口只做装配
  - [x] 拆出 `apps/background/dynamicContentScripts.ts`
  - [x] 拆出 `apps/background/dnrRules.ts`
  - [x] 拆出 `apps/background/routeAutoUpdate.ts`
  - [x] 拆出 `apps/background/drive115UserRefresh.ts`
  - [x] 拆出 `apps/background/alarmRouter.ts`
  - [x] 拆出 `apps/background/errorHandlers.ts`
  - [x] 保持 `background/background.ts` 作为 manifest 薄入口
- [x] 第二十八批迁移：WebDAV 解耦测试基线
  - [x] 统计并锁定当前 `background/webdav.ts`、`background/sync.ts` 对外消息类型
  - [x] 补充 WebDAV URL 归一化、路径拼接、上传 ID、设备名清洗测试
  - [x] 补充 PROPFIND XML 解析与备份文件过滤测试
  - [x] 补充上传索引追加、去重、保留数量测试
  - [x] 补充导入设置清洗、local-only key 过滤测试
  - [x] 补充恢复预览、对象 map 转数组、批量写入边界测试
  - [x] 补充连接诊断参数映射测试
- [x] 第二十九批迁移：WebDAV 基础设施与设备档案
  - [x] 建立 `features/webdavSync`
  - [x] 建立 `features/webdavSync/domain/types.ts`
  - [x] 建立 `features/webdavSync/domain/paths.ts`
  - [x] 建立 `features/webdavSync/infrastructure/webdavClient.ts`
  - [x] 建立 `features/webdavSync/infrastructure/propfindParser.ts`
  - [x] 建立 `features/webdavSync/application/clientIdentity.ts`
  - [x] 建立 `features/webdavSync/application/clientRegistry.ts`
  - [x] `background/webdav.ts` 继续保留 router 入口，内部逐步改用新模块
- [x] 第三十批迁移：WebDAV 备份上传链路拆分
  - [x] 建立 `features/webdavSync/application/backupCollector.ts`
  - [x] 建立 `features/webdavSync/application/uploadIndex.ts`
  - [x] 建立 `features/webdavSync/application/uploadService.ts`
  - [x] 建立 `features/webdavSync/application/cleanupService.ts`
  - [x] 迁移备份数据采集、zip/json 生成、上传与保留数量清理
  - [x] 保持手动备份、自动备份、上传索引和设备档案行为一致
- [x] 第三十一批迁移：WebDAV 恢复与诊断链路拆分
  - [x] 建立 `features/webdavSync/application/restorePreview.ts`
  - [x] 建立 `features/webdavSync/application/restoreService.ts`
  - [x] 建立 `features/webdavSync/application/importSanitizer.ts`
  - [x] 建立 `features/webdavSync/application/diagnostics.ts`
  - [x] 建立 `features/webdavSync/background/router.ts`
  - [x] 迁移备份预览、恢复设置、恢复记录、恢复日志、恢复 IDB 数据逻辑
  - [x] `background/webdav.ts` 收缩为 `features/webdavSync` 兼容导出
- [x] 第三十二批迁移：番号详情刷新功能域
  - [x] 为 `background/sync.ts` 增加刷新流程和解析器测试
  - [x] 建立 `features/records/refresh`
  - [x] 迁移 JavDB 搜索页解析、详情页解析、Cloudflare 验证请求、FC2 刷新逻辑
  - [x] `background/sync.ts` 保留 re-export 兼容
  - [x] `background/dbRouter.ts` 和 WebDAV 恢复链路已复核无直接刷新调用，刷新消息入口改用 `features/records/refresh`
- [x] 第三十三批迁移：`src/utils` 继续瘦身
  - [x] 迁移 `utils/searchEngines.ts` 到 `features/externalSearch/domain`
  - [x] 迁移 `utils/net.ts` 到 `platform/network`
  - [x] 迁移 `utils/ipLookup.ts` 到 `platform/network`
  - [x] 迁移 `utils/webdavDiagnostic.ts` 到 `features/webdavSync/application`
  - [x] 评估 `utils/config.ts` 拆分为 `shared/config` 与各 feature config，本批先保持稳定，后续作为独立配置拆分批次处理
  - [x] 旧 `utils/*` 路径保留兼容导出一轮
- [x] 第三十四批迁移：Content 功能域继续瘦身
  - [x] 修复 `tests/dom/previewVideoPreload.test.ts` 当前失败断言，恢复释放后重新激活 `<source>` 的行为
  - [x] 迁移 `content/previewVideoPreload.ts`、`nativeJavdbPreview.ts`、`previewSourceRules.ts` 到 `features/previews`
  - [x] 迁移 `content/superRankingNav.ts` 到 `features/rankings`
  - [x] 评估 `content/contentFilter.ts`：当前 1144 行且与 orchestrator、快捷键、设置和列表状态强耦合，拆成后续独立批次
  - [x] 评估 `content/enhancements/*`：`listEnhancement` 2198 行、`actorEnhancement` 1176 行、`actorQuickActions` 696 行，按列表增强/演员增强拆成后续独立批次
  - [x] 保留 `content/*` 旧路径兼容导出，`apps/content/bootstrap.ts` 已改用 `features/previews` 与 `features/rankings`
- [x] 第三十五批迁移：Content 复杂增强拆分
  - [x] 迁移 `content/contentFilter.ts` 到 `features/contentFilter`
  - [x] 迁移 `content/enhancements/listEnhancement.ts` 到 `features/listEnhancement`
  - [x] 迁移 `content/enhancements/actorEnhancement.ts` 到 `features/actorEnhancement`
  - [x] 迁移 `content/enhancements/actorQuickActions.ts` 到 `features/actorEnhancement`
  - [x] 继续收缩 `apps/content/bootstrap.ts`，保留装配职责
- [x] 第三十六批迁移：Background 杂项路由拆分
  - [x] 迁移预览 URL 检测与预览源抓取 handler 到 `features/previews/backgroundHandlers.ts`
  - [x] 迁移新作品手动检查、单演员检查、取消与调度状态消息到 `features/newWorks/backgroundMessages.ts`
  - [x] 迁移 orchestrator 指标保存、聚合、任务明细与停止任务逻辑到 `apps/background/orchestratorMetrics.ts`
  - [x] 迁移 Emby 动态内容脚本注入到 `apps/background/embyDynamicContentScripts.ts`
  - [x] 收缩 `background/miscHandlers.ts` 为消息路由和少量共享 handler
- [x] 第三十七批迁移：Background DB 路由收口
  - [x] 迁移 `background/dbRouter.ts` 到 `apps/background/dbMessageRouter.ts`
  - [x] `apps/background/bootstrap.ts` 改用新 DB 路由入口
  - [x] 旧 `background/dbRouter.ts` 保留兼容导出
- [x] 第三十八批迁移：Background scheduler 收口
  - [x] 迁移 `background/scheduler.ts` 到 `apps/background/scheduler.ts`
  - [x] `apps/background/alarmRouter.ts` 改用新 scheduler 路径
  - [x] WebDAV 自动同步 alarm 常量调用改用新路径
  - [x] 旧 `background/scheduler.ts` 保留兼容导出
- [x] 第三十九批迁移：115 v2 后台代理归位
  - [x] 迁移 `background/drive115Proxy.ts` 到 `features/drive115/v2/backgroundProxy.ts`
  - [x] `apps/background/bootstrap.ts` 改用 115 feature 路径
  - [x] 旧 `background/drive115Proxy.ts` 保留兼容导出
- [x] 第四十批迁移：WebDAV 后台 controller 收口
  - [x] 迁移 `background/webdav.ts` 的后台装配逻辑到 `features/webdavSync/background/controller.ts`
  - [x] `apps/background/bootstrap.ts` 改用 WebDAV feature controller
  - [x] `apps/background/scheduler.ts` 的自动同步入口改用 WebDAV feature controller
  - [x] 旧 `background/webdav.ts` 保留兼容导出
- [x] 第四十一批迁移：Background misc message router 收口
  - [x] 迁移 `background/miscHandlers.ts` 到 `apps/background/miscMessageRouter.ts`
  - [x] `apps/background/bootstrap.ts` 改用本地 misc message router
  - [x] 旧 `background/miscHandlers.ts` 保留兼容导出
- [x] 第四十二批迁移：Storage migrations 收口
  - [x] 迁移 `background/migrations.ts` 到 `platform/storage/migrations.ts`
  - [x] `apps/background/bootstrap.ts` 改用 storage platform migrations
  - [x] `platform/storage/index.ts` 暴露 migrations 入口
  - [x] 旧 `background/migrations.ts` 保留兼容导出
- [x] 第四十三批迁移：Background 测试文件与 IndexedDB 存储拆分
  - [x] 迁移 `src/background/db.logs.test.ts` 到 `tests/regression/logRetentionSettings.test.ts`
  - [x] 增加架构回归约束：`src/background` 不放测试文件
  - [x] 拆出 `platform/storage/indexedDbSchema.ts`
  - [x] 拆出 `platform/storage/indexedDbConnection.ts`
  - [x] 拆出 `platform/storage/indexedDbLogFields.ts`
  - [x] 拆出 `platform/storage/indexedDbViewedIndexes.ts`
  - [x] `platform/storage/indexedDb.ts` 保持稳定 API facade
- [x] 第四十四批迁移：磁力结果 metadata 纯逻辑拆分
  - [x] 拆出 `features/magnets/application/resultMetadata.ts`
  - [x] 迁移磁力大小解析、字幕识别、画质识别、破解识别、日期归一化、番号匹配和排序逻辑
  - [x] `features/magnets/ui/magnetSearchManager.ts` 保持 UI 编排与 DOM 渲染职责
  - [x] `features/magnets/index.ts` 暴露 result metadata 稳定入口
  - [x] 补充 `tests/dom/magnetResultMetadata.test.ts`
- [x] 第四十五批迁移：列表增强配置、热度和样式拆分
  - [x] 拆出 `features/listEnhancement/domain/config.ts`
  - [x] 拆出 `features/listEnhancement/application/actorMatching.ts`
  - [x] 拆出 `features/listEnhancement/application/actorHiding.ts`
  - [x] 拆出 `features/listEnhancement/application/popularityEffects.ts`
  - [x] 拆出 `features/listEnhancement/ui/styles.ts`
  - [x] `features/listEnhancement/listEnhancementManager.ts` 保持列表增强 DOM 编排和生命周期职责
  - [x] `features/listEnhancement/index.ts` 暴露配置、演员匹配、演员隐藏决策、热度效果和样式入口
  - [x] 补充 `tests/dom/listEnhancementHelpers.test.ts`
- [x] 清理旧目录和历史备份文件
  - [x] 处理 `src/background/*.bak`
  - [x] 处理 `src/background/background.ts.step*`
  - [x] 确认无构建引用后移动到归档目录或删除

---

## 🧲 磁力 / 资源

- [ ] 多源磁力负缓存和失败退避（暂缓）
  - [ ] 记录 BTdig、JAVBUS 等失败状态和短期退避时间
  - [ ] 避免短时间内重复请求明显失败的来源
  - [ ] 保留手动重试入口
- [ ] 高质量磁力过滤
  - [ ] 评估是否加入参考脚本的高质量过滤按钮
  - [ ] 与现有来源筛选、字幕 tag、分页联动

---

## 🎞️ 影片页 / 资源入口

- [ ] 字幕预览入口评估
  - [ ] 评估迅雷字幕 `.srt` 预览收益
  - [ ] 控制预览加载范围，避免请求和 UI 复杂度过高
- [ ] 在线可看站点校准
  - [ ] 持续按误报样本修正 FANZA、Jable 等站点 selector
  - [ ] 保持失败站点显示逻辑受设置项控制
- [ ] 123AV FC2 专用入口
  - [ ] 评估是否在 FC2 场景补 123AV 入口
  - [ ] 与当前 FC2 弹窗入口保持一致体验
- [ ] DMM/FANZA 预告片多画质
  - [ ] 评估 DMM API 稳定性
  - [ ] 决定是否替换 JavDB 原生预告片源

---

## 🆕 新作品
- [ ] 新作品的添加演员按钮，弹窗列出的列表添加标识，是不包含拉黑的演员

---

## ☁️ WebDAV 设置

- [ ] Alist URL 规范化提示
  - [ ] 检测常见 Alist `/dav/` 路径问题
  - [ ] 给出可操作的修正提示

---

## 📝 日志设置

- [ ] 检查所有功能增强时候有独立的标识

---

## 🔄 数据同步


---

## 🎬 番号库

- [ ] 状态筛选 UX 优化
  - [ ] 评估批量状态变更
  - [ ] 评估已浏览、想看、已看状态筛选的入口和提示
- [ ] 列表页短评弹窗（暂缓）
  - [ ] 评估接口压力和缓存策略
- [ ] 轻量图片画廊
  - [ ] 评估 ViewerJS 或现有预览能力复用

---

## 演员库

- [ ] 演员库新增演员更多信息（可通过增强功能的去wiki获取保存）
- [ ] 优化列表视图和卡片视图的切换
- [ ] 从 JavDB 收藏演员导入
  - [ ] 评估 JavDB 收藏演员数据来源
  - [ ] 导入时去重并保留现有演员备注

---

## 📊 报告

- [ ] 报告（Insights）设置 
  配置报告生成所用的聚合参数，仅影响本地统计、AI 提示词输入。


---

## 🎥 Emby

- [ ] 功能优化
- [ ] Emby/Jellyfin 入库状态
  - [ ] 单独做规格设计
  - [ ] 明确媒体库索引同步方式
  - [ ] 设计 JavDB 列表页和详情页入库标记
  - [ ] 设计实时媒体库校验队列
