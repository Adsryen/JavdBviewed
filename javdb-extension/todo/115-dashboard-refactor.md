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

---

## 当前实施状态（时间戳）
- A（sync、settings 懒加载）：已完成
- B（Modals 常驻挂载）：已完成（模态统一迁移至 `src/dashboard/partials/modals/dashboard-modals.html`，并在 `dashboard.ts` 启动时 `ensureMounted`）
- C（全局基础样式清单常驻 `<head>`）：已完成（精简为 `dashboard.css` + `styles/main.css` + `_tabs.css` + `_modal.css` + `_toast.css` + `_stats.css` + `_userProfile.css` + `components/toggle.css` + Font Awesome CDN）

## 已完成事项（增量）
- 将 `dashboard.html` 中各大 Tab 改为占位容器，依赖 `TAB_PARTIALS` 懒加载对应 partial + 样式。
- 抽离并去重所有通用弹窗至 `dashboard-modals.html`，含：`orchestratorModal`、`filterRuleModal`、`webdavRestoreModal`、`migration-modal`（仅保留一份）等。
- `dashboard.ts` 中在 `DOMContentLoaded` 阶段统一挂载 Modals（带“若已有内联则跳过”的保护），避免重复 ID。
- `<head>` 仅保留全局基础样式，Tab 专属样式由 `TAB_PARTIALS.styles` 按需加载。

## 下一步（M2）
- 文档更新：用本节“实施状态/已完成/下一步/测试清单”替换掉阶段性占位内容（本次已追加）。
- 回归测试：覆盖各标签页懒加载与 settings 子面板（见下）。
- 细化样式治理：按需补齐/合并 settings 子样式，必要时分模块按需加载以进一步减小首屏。
- 代码清理：移除历史遗留注释、备份文件；统一命名与目录约定。

## 回归测试清单
- 标签页切换：首次访问 `actors/new-works/sync/drive115-tasks/settings/logs` 时应即时注入 DOM + 样式；控制台无错误。
- 深链路直达：访问 `#tab-settings/webdav-settings`、`#tab-settings/drive115-settings`、`#tab-logs` 直接到位。
- Settings 行为：
  - 侧边栏切换正常、二级锚点同步更新。
  - `SettingsPanelManager` 管理的各子面板可初始化/销毁。
  - `settingsSubSectionChange` 自定义事件可触发并被监听。
- 115 相关：切到“115 网盘”时 UI 刷新逻辑正确；侧边栏配额展示按设置生效。
- Modals：`orchestratorModal`、`filterRuleModal`、`webdavRestoreModal`、`confirmation`、`smartRestore`、`dataView`、`restoreResult`、`data-check`、`import` 正常打开/交互/关闭。
