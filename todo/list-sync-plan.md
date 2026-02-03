# 清单同步（JavDB Lists）功能方案（待确认）

## 目标与范围
- **目标**
  - [x] 从 JavDB 的「我的清单」与「收藏的清单」两个入口同步清单数据。
  - [x] 将清单中的每部影片同步到本地“番号库（records/viewedRecords）”，并建立“影片-清单”的多对多归属关系。
  - [x] 清单同步得到的影片**不自动拥有**“已看/已浏览/想看”状态。
  - [x] 若影片已存在番号库：**保留原状态不变**，仅同步清单归属。
  - [x] 若影片不存在番号库：创建一个“仅用于番号库保留 + 清单归属”的记录，状态为 `untracked`（未标记）。

 - **不在本期强制实现（可作为后续里程碑）**
  - [ ] 在番号库列表页对清单进行复杂筛选（会在 UI 章节给出建议方案）。
  - [ ] 新增独立“清单管理子页面”（会给出建议结构）。

## 数据来源（权威入口）
- **我的清单**
  - `GET https://javdb.com/users/lists`
- **收藏的清单**
  - `GET https://javdb.com/users/favorite_lists`

- **清单详情（影片列表页）**
  - `GET https://javdb.com/lists/{listId}?page={n}`
  - 页面结构与“已看过影片列表页”类似，可从 HTML 中解析 `/v/{urlId}` 链接。

## 关键行为规则（与你描述保持一致）
- **清单分类**
  - 同步回来的清单必须标注来源：
    - `mine`（我的清单）
    - `favorite`（收藏的清单）

- **影片状态规则**
  - 从清单同步的影片**不赋予** `viewed/browsed/want`。
  - 若影片已存在番号库：
    - `status` 保持原值
    - 只更新 `listIds`（或 `lists`）归属
  - 若影片不存在番号库：
    - 创建记录，但 `status` 设为“未标记/空状态”（建议新增枚举值 `untracked`，详见数据模型）
    - 后续由“访问影片页/已看功能/想看按钮”等现有逻辑再更新状态

我认为这个策略是合理的：
- 不会污染你已有的状态体系（已看/已浏览/想看），避免同步清单后大量“误标记”。
- 又能保证“番号库保留”与后续检索/筛选能力。

## 数据模型方案（建议）

### 1) 扩展 VideoStatus：增加空状态
现有：`type VideoStatus = 'viewed' | 'browsed' | 'want'`

建议：增加 `untracked`，用于“仅入库但未产生任何状态”的影片。
- **已选值**：`untracked`
- **展示文案**：未标记
- **优先级**：最低（低于 `browsed`）

> 说明：现有 `VideoRecord.status` 是必填字段（IndexedDB 索引也基于它），因此“真的空字符串/undefined”会导致类型与查询逻辑都要大改。用 `untracked` 能最小化侵入，并且语义明确。

### 2) 为 VideoRecord 增加清单归属字段
在 `VideoRecord` 增加：
- `listIds?: string[]`  
  - 存放清单 ID 数组（如 `["VwR3aD", "Abc123"]`）
  - 一部影片可归属多个清单

合并策略：
- 以集合语义去重（union）
- [x] 以远端为准（会移除本地多余归属）

### 3) 新增清单实体表（IndexedDB）
新增 object store：`lists`
- `keyPath: 'id'`
- 记录结构建议：
```ts
interface ListRecord {
  id: string;               // VwR3aD
  name: string;             // 精选连裤袜...
  type: 'mine' | 'favorite';
  url: string;              // https://javdb.com/lists/VwR3aD
  moviesCount?: number;     // 64（可从 meta 文本解析）
  clickedCount?: number;    // 6104（可选）
  createdAt: number;
  updatedAt: number;
  lastSyncAt?: number;
}
```

可选：再加一个 mapping store（如 `listItems`）来存“清单-影片”明细；但**不是必须**，因为影片已经存了 `listIds`，筛选足够。

## 同步流程设计（建议交互与实现步骤）

### A. 同步入口（Dashboard → 数据同步页）
在现有 Sync UI 增加一个新卡片：
- 标题：清单
- 描述：同步“我的清单/收藏的清单”以及清单内影片归属
- 按钮：
- [x] 单按钮“同步清单（含影片）”

### B. 同步清单列表（/users/lists & /users/favorite_lists）
步骤：
1. `GET /users/lists` 解析出清单项：
   - `listId`：来自 `li#list-{id}` 或 `href="/lists/{id}"`
   - `name`：`.list-name`
   - `moviesCount/clickedCount`：从 meta 文本解析（如“64 部影片, 被點擊了 6104 次”）
2. `GET /users/favorite_lists` 同样解析，标注 `type='favorite'`
3. 写入 IndexedDB `lists`：
   - 新增：insert
   - 已存在：仅更新 `name/moviesCount/clickedCount/type/updatedAt`

分页：
- 若页面存在分页导航，则按 `?page=` 逐页抓取直到没有下一页。
- 若无分页信息：默认只抓首页，并在 UI 上提示“仅同步第 1 页”。（后续可再完善）

### C. 同步清单内影片归属（/lists/{id}?page=n）
对每个清单：
1. 根据 `moviesCount` 估算总页数（默认每页 20），或按“是否有下一页”迭代。
2. 对每页解析出 `/v/{urlId}`。
3. 对每个 `urlId`：
   - 复用现有 `fetchVideoDetail(urlId)` 以提取：
     - 真实番号 `id`
     - 标题、tags、releaseDate、封面
   - 找到/创建 `VideoRecord`：
     - **已存在**：不改 `status`，仅合并 `listIds`
     - **不存在**：创建 `status='untracked'`，并写入必要字段

性能与稳健性：
- 沿用现有数据同步模块的：
  - 请求间隔（settings.dataSync.requestInterval）
  - 超时 + 重试（fetchWithRetry）
  - 支持取消（AbortSignal / SyncCancelledError）

增量策略（建议后续加入）：
- 若清单的 `updatedAt` 未变化，可跳过。
- 或者在每个清单保存 `lastSyncAt`，并提供“仅同步缺失影片”模式。

## UI/筛选/展示（建议分阶段落地）

### 阶段 1（最小可用）
- [x] 数据同步页增加“清单同步”按钮与进度显示。
- [x] 番号库（records 页）可检索到清单同步入库的影片。

### 阶段 2（你 todo 里提到的筛选与展示）
- **番号库页面增加清单筛选**
  - [ ] 方式 1：仿 tags 的多选筛选组件
  - [ ] 方式 2：搜索语法扩展：`list:{name}` 或 `listid:VwR3aD`

- **番号库影片列表增加清单显示（tag 感觉）**
  - [x] 在每条记录下方展示 `listIds` 对应的清单名 badge（需要从 `lists` store 读取 name）

### 阶段 3（独立清单管理子页面）
- Dashboard 新增 Tab：`清单`
  - [ ] 列表按 `mine/favorite` 分组
  - [ ] 点击清单 → 跳转/联动到 records 页，并自动应用“清单筛选”
  - [ ] 该页面同时提供：重命名（本地别名）、删除本地清单、重新同步某个清单

## 边界情况与风险
- **未登录**：`/users/lists` 可能返回登录页或重定向；需在同步前检查登录状态（现有 `userService.isUserLoggedIn()` 可复用）。
- **解析不稳定**：JavDB 页面结构变更风险较高。
  - 建议：优先用稳健选择器/正则组合，解析失败要有明确 toast/log。
- **ID 的两套体系**：
  - 列表页解析到的是 `/v/{urlId}`
  - 番号库主键应使用真实番号（通过详情页抽取）
  - 这与现有 want/viewed 同步逻辑一致，可复用。
- **性能**：大清单同步会产生大量详情页请求。
  - 建议提供取消按钮、以及“仅同步清单列表/仅同步缺失”的模式。

## 需要你确认的决策点（请逐条回复）
- [x] 1) **空状态命名**：使用 `untracked`（展示文案：未标记）
- [x] 2) **同步按钮方案**：单按钮“同步清单（含影片）”
- [x] 3) **归属同步口径**：以远端为准（会移除本地多余归属）
- [x] 4) **新入库影片是否抓详情页**：抓（更完整，可搜索 tags/title）

---

确认以上方案后，我再开始拆分实现：
- 数据结构 + DB schema 迁移
- 同步 UI 与同步器
- 归属写入与 records 页筛选/展示（按你选择的阶段推进）
