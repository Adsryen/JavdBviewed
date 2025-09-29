# todo计划
## 115
  
## 功能增强
### 未开启的功能
- 聚合
- 缓存
### 已开启的功能
- 影片详情页显示演员是否已收藏
- 略缩图跳转存在无效的问题，与跳转至网页中间位置
- 显示优化：可选择屏蔽黑名单
- 智能内容过滤的规则排列为一行两个，优化编辑页面的单选框样式
- 加载上次应用的标签，未生效
- 智能内容过滤，增加正则配置提示
- 调整“预览来源”的选择
- "🔓 破解评论区"和"🚫 破解FC2拦截"功能（待测试）
- 右击后台打开，支持影片页的“你可能也喜歡”

## 新作品
- 优化已读作品的删除（待测试）
- 根据现有番号库重新刷新过滤未看的新作品（还有问题）
- 批量打开未读新作品
- 排除标签：單體作品 含磁鏈（待测试）
- 在演员页面，按钮快速添加订阅，如：https://javdb.com/actors/65APQ
- 新作品功能未启用，请先在全局配置中启用？

## 列表显示设置
- 隐藏VR有问题
- 隐藏拉黑演员的影片（通过标题去过滤，有误差但可接受）
  
## WebDAV 设置
- 无
- 
## 日志设置
- 检查所有功能增强时候有独立的标签

## 番号库
- 增加点击“想看”按钮，更新番号库影片状态，如果番号库没有该影片，则添加
- 增加功能按钮，显示封面，则在番号库列表左侧直接显示影片封面，减少点击。当页面滚动到图片容器才开始加载封面，避免加载过多的图片
- 整理影片页的功能加载顺序，保存番号库与更换icon的优先级最高（待测试）
- ！！！优化开始识别番号，保存番号库的开始判断，当页面识别到navbar-item 的元素时，才开始识别数据回写。要是没有，说明页面被安全拦截了或请求频繁了，就不要回写番号库。（待测试）

## emby
- 删除
  
## 其他
- 整理列表页、影片页、演员页的增强功能，实现可自定义开启与关闭的配置功能
- 影片页的增强功能，加载延时测试，有的功能运行速度过慢，需要逐个排查原因
- 暗色主题优化


# AI待做：


已收到你的确认。以下给出“唯一恢复模式（替换、不合并，且可按类别选择）”的最终实施方案与变更清单。说明：我遵循了记忆“恢复模式偏好：唯一模式（替换，无合并）且可按数据类型选择”。

一、后端实现方案
- 核心改造文件
  - [src/background/webdav.ts](cci:7://file:///d:/JavdBviewed/javdb-extension/src/background/webdav.ts:0:0-0:0)
  - [src/background/db.ts](cci:7://file:///d:/JavdBviewed/javdb-extension/src/background/db.ts:0:0-0:0)（仅复用现有 API，不改 schema）
  - [src/background/dbRouter.ts](cci:7://file:///d:/JavdBviewed/javdb-extension/src/background/dbRouter.ts:0:0-0:0)（仅增加消息路由）

- 新/改函数与路由
  - 新增：`performRestoreUnified(filename, options)`
    - 参数：
      - `options.categories`: `{ settings, userProfile, viewed, actors, newWorks, magnets, logs, importStats }`
      - `options.preview: boolean`（必经步骤时先走预览）
      - `options.autoBackupBeforeRestore: boolean`（恢复前自动备份，默认 ON）
    - 语义：按“类别替换”，不做合并；每一类“先清空再写入”。
  - 兼容：[performRestore(...)](cci:1://file:///d:/JavdBviewed/javdb-extension/src/background/webdav.ts:224:0-385:1) 内部转调 `performRestoreUnified(...)`，统一入口。
  - 路由：
    - `WEB_DAV:RESTORE_PREVIEW`：解析 `backup.json`，返回摘要 `stats`（若缺失则现场统计）
    - `WEB_DAV:RESTORE_UNIFIED`：执行恢复（支持 `autoBackupBeforeRestore`）
  - 预备工具：
    - `putRecordsInBatches(db, storeName, records, batchSize=1000)`：按 1000/批写入，单类“清空→分批 put”。
    - `clearStore(db, storeName)`：按类清空 IDB store。
    - `replaceStorageKeys(map)`：按键替换 `chrome.storage.local` 指定键（不做合并）。

- 类别与实现细节（全部替换语义）
  - 设置：`STORAGE_KEYS.SETTINGS` → 直接 [setValue](cci:1://file:///d:/JavdBviewed/javdb-extension/src/utils/storage.ts:155:0-167:1)
  - 用户资料：`STORAGE_KEYS.USER_PROFILE` → 直接 [setValue](cci:1://file:///d:/JavdBviewed/javdb-extension/src/utils/storage.ts:155:0-167:1)
  - 观看记录（默认 ON）：IDB `viewedRecords`
    - 清空 `viewedRecords` → 批量 put
    - 兼容回退：无 `idb.viewedRecords` 时用 `data`/`STORAGE_KEYS.VIEWED_RECORDS`
  - 演员（默认 ON）：IDB `actors`
    - 清空 `actors` → 批量 put
    - 回退：无 `idb.actors` 时用 `actorRecords`
  - 新作品（默认 ON）：IDB `newWorks` + storage 的 `new_works_*`
    - 清空 `newWorks` → 批量 put；`subscriptions/records/config` 直接替换对应键
  - 磁链缓存（默认 OFF）：IDB `magnets`
    - 清空 `magnets` → 批量 put（体积大、非必要，故默认不勾）
  - 日志（默认 OFF）：IDB `logs`
    - 清空 `logs` → 批量 put（通常无需恢复）
  - 导入统计（默认 ON）：`STORAGE_KEYS.LAST_IMPORT_STATS` → 直接替换

- 兼容策略（2.0/2.1）
  - 优先用 `idb.*`；无则回退旧字段（`data/viewed`、`actorRecords`、`newWorks.*`、`logs`）
  - 不暴露 `storageAll` 开关；仅在旧字段缺失时作为内部兜底来源（键级别替换，仍不合并）

- 恢复前自动备份（默认 ON）
  - 在执行恢复前调用 [performUpload()](cci:1://file:///d:/JavdBviewed/javdb-extension/src/background/webdav.ts:159:0-222:1) 进行一次即时 WebDAV 备份（失败不阻断恢复，但会记录 WARN）

- 日志与统计
  - 预览：返回每类条数与体积（来自 `backup.json.stats`；如缺失，则扫描备份数据现场统计）
  - 执行：对每类输出“清空耗时/写入条数/耗时/失败数”；最终输出总耗时与结果摘要

二、前端/UI 方案（✅ 已简化）
- 改造文件：[src/dashboard/dashboard.html](cci:7://file:///d:/JavdBviewed/javdb-extension/src/dashboard/dashboard.html:0:0-0:0)、[src/dashboard/webdavRestore.ts](cci:7://file:///d:/JavdBviewed/javdb-extension/src/dashboard/webdavRestore.ts:0:0-0:0)
- **✅ 已移除复杂的三种模式**：快捷恢复、向导模式、专家模式
- **✅ 已移除复杂的策略选择**：云端优先、本地优先、自定义处理等
- **简化后的交互流程**（预览为必经步骤）
  1) 用户选择备份文件 → 请求 `WEB_DAV:RESTORE_PREVIEW` → 展示摘要（每类条数/体积）
  2) 类别勾选面板（默认值：ON 设置/用户/观看/演员/新作品/导入统计；OFF 日志/磁链）
  3) "恢复前自动备份"开关（默认 ON）
  4) 二次确认提示（覆盖式恢复将完全替换现有数据）
  5) 执行 `WEB_DAV:RESTORE_UNIFIED` → 展示进度（按类）与结果摘要
  5) 执行 `WEB_DAV:RESTORE_UNIFIED` → 展示进度（按类）与结果摘要

三、安全与回滚
- 按类隔离：某类失败不影响其他类
- 事务策略：IDB 每类按批次开启 `readwrite` 事务，避免长事务超时
- 并发保护：在恢复期间设置简单内存锁，避免并发触发恢复/备份冲突

四、测试用例
- 仅单一类别恢复（观看/演员/新作品/设置等），验证“先清空后替换”
- 多类别组合恢复
- 大体量数据（>10 万条），1000/批写入性能与稳定性
- 旧版备份兼容（仅 `storage` 字段；无 `idb.*`）
- 预览缺 stats 的现场统计
- 自动备份失败不阻断恢复

五、你已确认的默认项（将按此落地）
- 默认勾选：设置、用户资料、观看记录、演员、新作品、导入统计
- 默认不勾选：日志、磁链缓存
- “恢复前自动备份”：默认 ON
- 预览：必经步骤
- 不暴露 `storageAll` 整库还原
- 批量写入大小：1000/批

下一步








# 待办清单（覆盖式恢复与磁链缓存改造 | 下次执行）

- **范围**：[src/dashboard/dashboard.html](cci:7://file:///d:/JavdBviewed/javdb-extension/src/dashboard/dashboard.html:0:0-0:0)、[src/dashboard/webdavRestore.ts](cci:7://file:///d:/JavdBviewed/javdb-extension/src/dashboard/webdavRestore.ts:0:0-0:0)、`src/background/webdav.ts`
- **目标**：UI 与逻辑统一“覆盖式恢复”语义；默认恢复“导入统计”；新增“磁链缓存”可选恢复项；端到端验证通过。

## 前端 UI（dashboard.html）
- **[覆盖式文案替换]**
  - 将 `merge-strategy-section` 标题文本由`处理方式选择`改为`恢复方式选择（覆盖式）`。
  - 将推荐项标题由`智能合并 (推荐)`改为`覆盖式恢复（推荐）`。
  - 将推荐项描述由`保留本地数据，添加云端新数据，冲突项按时间戳保留最新`改为`使用所选类别覆盖本地相应数据（替换，不合并）`。
- **[导入统计默认勾选-专家区]**
  - 将 `#webdavRestoreImportStats` 对应 `<input>` 增加 `checked`。
- **[导入统计默认勾选-简易区]**
  - 将 `#webdavRestoreImportStatsSimple` 对应 `<input>` 增加 `checked`。
- **[新增“磁链缓存”复选框-专家区]**
  - 在 `#webdavRestoreNewWorks` 所在块之前插入一个 `form-group-checkbox available` 块：
    - `<input id="webdavRestoreMagnets">`（默认不勾选）。
    - `<label>` 图标使用 `<i class="fas fa-magnet"></i>`，描述“磁链缓存”。
- **[新增“磁链缓存”复选框-简易区]**
  - 在 `#webdavRestoreImportStatsSimple` 所在块之前插入一个 `form-group-checkbox` 块：
    - `<input id="webdavRestoreMagnetsSimple">`（默认不勾选）。
    - `<label>` 与文案同上。

## 前端逻辑（webdavRestore.ts）
- **[统一恢复读取“磁链缓存”勾选]**
  - 在 [executeRestore()](cci:1://file:///d:/JavdBviewed/javdb-extension/src/dashboard/webdavRestore.ts:726:0-765:1) 构造 `categories` 时，将
    - `magnets: false`
    - 改为从 DOM 读取（专家优先，简易兜底）：
      - `((document.getElementById('webdavRestoreMagnets') as HTMLInputElement)?.checked) ?? ((document.getElementById('webdavRestoreMagnetsSimple') as HTMLInputElement)?.checked) ?? false`
- 可选增强（建议本次一并做）：
  - **[可用性检测配置]** 在 [configureRestoreOptions(cloudData)](cci:1://file:///d:/JavdBviewed/javdb-extension/src/dashboard/webdavRestore.ts:1443:0-1546:1) 的 `options` 数组追加：
    - `{ id: 'webdavRestoreMagnets', dataKey: 'magnets', required: false, name: '磁链缓存' }`
  - **[统计文本]** 在 [updateOptionStats()](cci:1://file:///d:/JavdBviewed/javdb-extension/src/dashboard/webdavRestore.ts:1548:0-1598:1) 增加 `case 'magnets':` 分支：
    - 若数组：显示 `包含 X 条磁链缓存`；若对象：可显示键数摘要（按云端数据结构定）。

## 后台（background/webdav.ts）
- **[统一恢复支持 magnets 类别]**
  - `WEB_DAV:RESTORE_UNIFIED`：当 `options.categories.magnets === true`：
    - 覆盖式流程：清空本地磁链缓存 → 写入云端 `raw.magnets`。
    - 在 `summary` 中记录清空与写入数量。
- **[预览返回 magnets]**
  - `WEB_DAV:RESTORE_PREVIEW`：若云端备份包含 `magnets`，确保 `raw.magnets` 返回给前端，用于可用性与统计。

## 存储键与封装
- **[存储键定义]**
  - 明确磁链缓存使用的 `STORAGE_KEYS`（例如 `STORAGE_KEYS.MAGNET_CACHE` 或已有等价键），并检查现有读写封装函数。
- **[读/清/写实现]**
  - 实现并复用：读取本地缓存、清空缓存、批量写入磁链条目。

## 默认行为与文案统一
- **[默认项]**
  - 默认不恢复：日志（`logs`）、磁链缓存（`magnets`）。
  - 默认恢复：导入统计（`importStats`），与本次 UI 默认一致。
- **[文案统一]**
  - 日志与提示、按钮文案等用“覆盖式恢复”语义；移除“合并/智能合并”表述。
  - 完成后快速全局检查：`智能合并|合并` 关键词，避免旧文案遗留。

## 验收标准（AC）
- **[UI]**
  - “覆盖式恢复”标题与描述正确显示。
  - 专家/简易两个“导入统计”默认勾选。
  - 专家/简易新增“磁链缓存”复选框默认不勾选。
- **[功能]**
  - 勾选“磁链缓存”后执行恢复，后端收到 `categories.magnets: true`，summary 记录清空与写入。
  - 未勾选时，本地磁链缓存不变。
- **[预览]**
  - 若云端备份含 `magnets`，前端可见其可用；若无，则显示不可用/禁用。
- **[回滚]**
  - 恢复前自动备份可通过“回滚到恢复前状态”成功恢复现场。

## 测试清单
- **[端到端]**
  - 备份中包含 `magnets` 的样例，分别测试“勾选/不勾选”路径。
  - 验证 `WEB_DAV:RESTORE_UNIFIED` 请求参数与后台 summary。
- **[边界]**
  - 备份无 `magnets`：前端禁用该项，后端不应触发覆盖。
  - 仅勾选“导入统计”：应只覆盖导入统计，其他不变。

## 发布
- **[构建与版本]**
  - 本地构建通过；更新版本号与变更日志，说明覆盖式恢复语义与默认项调整。

# 备注
- 涉及路径：
  - [src/dashboard/dashboard.html](cci:7://file:///d:/JavdBviewed/javdb-extension/src/dashboard/dashboard.html:0:0-0:0)
  - [src/dashboard/webdavRestore.ts](cci:7://file:///d:/JavdBviewed/javdb-extension/src/dashboard/webdavRestore.ts:0:0-0:0)
  - `src/background/webdav.ts`
- 完成本清单后进行一次完整验证并打标签发布。

总结：以上 TODO 已详细拆解到文件、元素 ID、函数与验收标准。准备好后我可以按清单逐项实现与验证。