# Dashboard 模块化改造方案（A/B/C 决策已定稿）

## 决策汇总
- **[A] sync、settings 改为懒加载（首次点开再 init）**：是
  - 首次进入仅挂载骨架与 `records` 页；当点击 `sync`/`settings` 标签页时，先挂载对应 partial + 加载样式，再触发各自初始化函数。
  - 兼容深链路（如 `#tab-settings/drive115-settings`）：启动解析 hash，若目标为 `settings`，则先挂载 `settings.html`，再 `initSettingsTab()` 并跳转子区段。
- **[B] Modals 常驻挂载**：是
  - `partials/modals/*` 在启动时一次性挂载，以确保随时可用并避免首次打开延迟与监听器错过。
- **[C] 全局基础样式清单（常驻 <head>）**：
  - `./dashboard.css`
  - `./styles/main.css`
  - `./styles/_tabs.css`
  - `./styles/_modal.css`
  - `./styles/_toast.css`
  - `./styles/_stats.css`
  - `./styles/_userProfile.css`
  - CDN：Font Awesome（保持 `<link>`）

---

## 目标与约束
- **目标**：将超大单页 `src/dashboard/dashboard.html` 拆分为按模块可组合的 HTML 片段，便于扩展与 CSS 控制；降低首屏体积、提升维护性。
- **入口保持**：`manifest.json` 的 `options_ui.page` 仍为 `dashboard/dashboard.html`。
- **兼容性**：保留现有 TS 选择器依赖的关键 `id/class`（如 `#tab-*`、`.tab-link`、`.tab-content` 等）。

## 目录规划（新增）
- `src/dashboard/partials/`
  - `layout/`: `header.html`、`sidebar.html`、`tabs-nav.html`、`skeleton.html`
  - `tabs/`: `records.html`、`actors.html`、`new-works.html`、`sync.html`、`drive115-tasks.html`、`settings.html`、`logs.html`
  - `modals/`: `orchestrator.html`、`filter-rule.html` 等
  - `components/`: 后续抽取可复用子块（如标签筛选、条件行等）
- `src/dashboard/loaders/`
  - `partialsLoader.ts`: `loadPartial(name)` / `injectPartial(selector, html)` / `ensureMounted(selector, name)`
  - `stylesLoader.ts`: `ensureStylesLoaded(hrefs: string[])`（去重、并发、失败兜底）

## 加载器设计
- **HTML 部分加载**：通过 `fetch(chrome.runtime.getURL('dashboard/partials/...'))` 拉取静态 HTML 并注入。提供幂等 `ensureMounted` 防重复挂载。
- **按需样式加载**：`stylesLoader.ensureStylesLoaded` 在 `<head>` 插入 `<link>`，支持队列与去重，失败兜底提示。

## 初始化与懒加载流程
1. `DOMContentLoaded`：
   - 注入 `layout/skeleton.html`（骨架：`.dashboard-container`、`.sidebar`、`.main-content`、`.tabs`、空的 `#tab-*` 占位）。
   - 挂载 `modals`（常驻）。
   - 首屏：挂载 `tabs/records.html`，加载 `records` 样式，执行 `initRecordsTab()`。
2. Tab 切换（`initTabs()` 内触发）：
   - 首次访问某 Tab：
     - `ensureMounted('#tab-xxx', 'tabs/xxx.html')`
     - `ensureStylesLoaded([...])`
     - 执行对应初始化（如 `actorsTab.initActorsTab()`、`newWorksTab.initialize()`、`syncTab.initSyncTab()`、`initSettingsTab()`、`logsTab.initialize()`、`Drive115TasksManager.initialize()`）。
3. Hash 深链路：
   - 启动解析 `location.hash`，若为 `tab-settings/子区段`，先挂载 `settings.html` 再初始化并跳转子区段。

## 样式按需映射
- records → `./styles/_records.css`
- actors → `./actors.css`
- new-works → `./styles/_newWorks.css`
- sync → `./styles/_dataSync.css`
- 115 tasks → `./styles/drive115Tasks.css`
- logs → `./styles/logs.css`、`./styles/settings/logs.css`
- settings → `./styles/settings/*`（如 `enhancement.css`、`drive115.css`、`_input-optimization.css`）

## 分阶段落地（TODO）
- [阶段 1] 脚手架
  - 新建 `partials/`、`loaders/`，实现 `partialsLoader.ts`、`stylesLoader.ts`。
  - `dashboard.html` 保留基础 `<head>` 与 `<body>` 占位，骨架由 `skeleton.html` 注入。
- [阶段 2] 迁移 Records（首屏）
  - 将 `#tab-records` DOM 移至 `partials/tabs/records.html`，保留原始 `id/class`。
  - 加载对应 CSS，调用 `initRecordsTab()`。
- [阶段 3] 迁移 Actors / NewWorks / Sync（A=懒加载）
  - 分别迁移到 `partials/tabs/*.html`；首次点击再注入 + 加样式 + 初始化。
- [阶段 4] 迁移 115 / Settings / Logs
  - 115：挂载后再 `Drive115TasksManager.initialize()`。
  - Settings：迁移 DOM；兼容 hash 二级路由。
  - Logs：迁移 DOM；首次打开再 `logsTab.initialize()`。
- [阶段 5] Modals 常驻（B=常驻）
  - Orchestrator / Filter-rule 等迁移至 `partials/modals/*`，启动即挂载并绑定事件。
- [阶段 6] 清理与优化
  - 清理多余 `<link>`（由按需加载接管），处理覆盖顺序与闪烁；补充文档。

## 风险与回退
- 风险：部分 TS 预期 DOM 先于 init 存在；需在切换逻辑中确保“先挂载、再 init”。
- 回退：保留 `dashboard.html.*.bak` 与 Git 历史，按 Tab 逐步迁移，随迁随测。

## 验收清单
- 功能回归：Records/Actors/NewWorks/Sync/115/Settings/Logs 及通用弹窗均工作正常。
- 体验性能：首屏更快、首次切换延时可接受；必要时提供骨架占位避免闪烁。

## 下一步（M1）
- 搭建 `partials/`、`loaders/`，实现加载器。
- 抽出 `records.html` 并接入按需样式，联调 `initRecordsTab()`。
