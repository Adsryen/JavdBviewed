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

下面给你一个可执行的实施顺序（从高收益/低风险到低收益/中风险），并说明每一步的目的、改动点与退出条件。整体策略继续保持“阶段性双写 + 渐进切换 + 可一键回滚”。

推荐实施顺序

1) 升级 DB 架构到 v2（统一把表先建好）
- 目的：一次性把后续要迁的表建齐，后续每次迁移只动“写/读/路由”，避免反复 bump 版本。
- 动作
  - [src/background/db.ts](cci:7://file:///e:/JavdBviewed/javdb-extension/src/background/db.ts:0:0-0:0)：
    - DB_VERSION 从 1 → 2。
    - 新增 stores + 索引：
      - `logs`：key 自增或 `timestamp`，idx: `by_timestamp`, `by_level`.
      - `magnets`：key `key`（source+hash），idx: `by_videoId`, `by_source`, `by_createdAt`,（可选）`by_sizeBytes`, `by_hasSubtitle`.
      - `actors`：key `id`，idx: `by_blacklisted`, `by_updatedAt`,（可选）`by_name`。
      - `newWorks`：key `id`（或 `videoId+date` 复合），idx: `by_createdAt`, `by_date`,（可选）`by_status`。
  - [src/background/background.ts](cci:7://file:///e:/JavdBviewed/javdb-extension/src/background/background.ts:0:0-0:0)：预留 DB 消息路由空壳（先不实现功能，只 return success），确保版本升级后不报错。
- 退出条件：扩展能正常加载，无异常日志，原有 viewed 读/写不受影响。

2) 迁移 persistent_logs（高收益，写入频繁）
- 目的：日志是高频写，先迁移能立刻降低 storage.local 压力。
- 动作
  - 后台消息 API：
    - `DB:LOGS_ADD`, `DB:LOGS_BULK`, `DB:LOGS_QUERY({level?, from?, to?, offset, limit})`, `DB:LOGS_CLEAR`, `DB:LOGS_EXPORT`.
  - [src/background/background.ts](cci:7://file:///e:/JavdBviewed/javdb-extension/src/background/background.ts:0:0-0:0) 的 `logger`：
    - 改为双写（storage.local + IDB）→ 观察稳定 → 切只写 IDB。
  - Dashboard 日志页：
    - 从 `STORAGE_KEYS.LOGS` 改为分页读取 `DB:LOGS_QUERY`。
    - 提供“清空/导出”按钮，调用 `DB:LOGS_CLEAR/EXPORT`。
- 退出条件：日志页可分页查看，新增日志稳定并能限制/滚动清理（按时间/条数）。

3) 为 viewed 补完分页/统计/导出（支撑“高级配置-查看源数据”）
- 目的：当前“查看源数据”已走 IDB 读取合并为对象；但 9k+ 条一次渲染会卡。先提供 API 做分页/导出，UI 再跟进。
- 动作
  - 后台消息 API：`DB:VIEWED_COUNT`, `DB:VIEWED_PAGE({offset,limit,status?,orderBy?=updatedAt desc})`, `DB:VIEWED_EXPORT`.
  - “高级配置-查看源数据”：
    - 改为分页/搜索 UI（按状态/时间排序），支持导出。
- 退出条件：大库列表查看流畅，无需一次读取全部；导出可直接从 IDB 拉取。

4) 迁移磁链缓存到 IDB（聚合性能与 TTL 清理）
- 目的：磁链缓存适合按 `videoId/source/createdAt` 查询与 TTL 过期清理，放 IDB 更合适。
- 动作
  - Store：`magnets`（定义 TTL 字段 `expireAt`/`createdAt`）。
  - 后台消息 API：`DB:MAGNET_GET({videoId})`, `DB:MAGNET_PUT/BULK_PUT`, `DB:MAGNET_CLEAN_EXPIRED`,（可选）`DB:MAGNET_SEARCH({text})`。
  - `src/services/dataAggregator/`：
    - 改用 IDB 缓存（先查 IDB → 过期再抓取 → 更新 IDB）。
  - Service Worker 定时清理：用 `chrome.alarms` 定期跑 `MAGNET_CLEAN_EXPIRED`。
- 退出条件：聚合流程命中缓存；过期清理生效；抓取次数明显减少。

5) 迁移 actor_records 到 IDB（黑名单/索引查询）
- 目的：演员库体量可能增大，支持 `blacklisted` 索引与更新时间筛选，IDB 更友好。
- 动作
  - 后台消息 API：`DB:ACTOR_GET/PUT/BULK_PUT/QUERY({blacklisted?, offset,limit})/EXPORT`。
  - 演员增强/过滤处：读取切到 IDB（保留 storage.local 回退一段时间）。
- 退出条件：演员相关查询/过滤稳定，黑名单查询走索引。

6) 迁移 new_works_records 到 IDB（分页/过滤）
- 目的：新作品列表天然适合按日期/状态分页。
- 动作
  - 后台消息 API：`DB:NEWWORKS_GET/PUT/BULK_PUT/QUERY/EXPORT`。
  - Dashboard 新作品页改为分页/筛选/清理（过期策略可复用 TTL）。
- 退出条件：列表页流畅可分页；旧数据清理有策略。

7) 停用 storage.local 写入（分批关闭）
- 目的：减少冗余持久化。
- 动作
  - 依次关闭 viewed/logs/magnets/actors/newWorks 的 storage.local 写入（在代码里用开关/环境变量控制便于回滚）。
  - 保留 `settings` 与少量标志位在 storage.local。
- 退出条件：关闭后运行 1-2 个小版本无异常，错误率与回退事件为 0。

8) Dashboard 清理与总导出
- 目的：释放旧空间、增强可维护性。
- 动作
  - “数据工具”页：
    - 一键清理旧分片键（viewed）与旧键。
    - 各 store 统计（count/size/最近更新）。
    - 全量导出 ZIP（按 store 分 JSON），全量导入。
  - WebDAV 备份：
    - 扩展 [performUpload()](cci:1://file:///e:/JavdBviewed/javdb-extension/src/background/background.ts:280:0-366:1)，支持从 IDB 导出（替换 storage-only 备份），保证回放/迁移一致性。
- 退出条件：清理后 storage.local 空间明显下降；备份/恢复全链路通过。

关键理由与收益排序
- 优先迁移日志：高频写，最能立刻减少压力。
- 紧跟 viewed 的分页/导出：用户感知强，解决“查看源数据”卡顿。
- 磁链缓存：缓存命中收益直接，且 TTL 清理在 IDB 更易做。
- 演员库/新作品：体量较大但写入相对不如日志频繁，收益次之。
- 最后收口：停写 storage + Dashboard 清理/导出一站式。

跨步骤注意事项
- 双写 → 只写：均建议经历至少一个观察期（几天或 1-2 个版本）。
- 消息路由统一：以 `DB:*` 为前缀，参数对象化，全部返回标准 `{ success, ... }` 格式。
- 导出/导入：统一 ZIP（多 JSON），便于 WebDAV 与本地导入导出。
- 监控与日志：为每个 store 的迁移/查询接口添加 `[DB]` 类别日志，便于 Dashboard 的“控制台日志”页快速筛选调试。
- 回滚策略：每次切换都保留“回退开关”（例如仍保留旧 storage 读路径一段时间，或用 feature flag 控制）。

如果你同意，我先从“方案 1（DB 架构升级到 v2）+ 方案 2（日志迁移与 API）+ 方案 3（viewed 分页/导出 API）”这三步开始动手，完成后再推进 magnets/actors/newWorks 的迁移。你也可以指定更偏好的优先级，我按你的偏好调整。



202509230136
[高] 修复未使用变量 TS6133（集中清理）
src/content/enhancedVideoDetail.ts
: 移除或接入 pendingParts 计数（目前未使用）
src/dashboard/dataSync/syncers/actorSync.ts: 移除 startTime 等未使用变量
复查 
src/content/concurrency.ts
 的 
updateRecord
 是否仍残留 startTime 声明，统一移除或恢复耗时统计
[高] 运行一次全量编译，收集剩余报错清单
重点关注 dashboard/* 和 services/* 中的 TS6133 未使用项
[中] 自测 115 推送/验证流程（drive115 改动后）
src/content/drive115-content.ts
 与 
src/content/drive115.ts
 改动后，验证跨域推送、验证窗口、重试逻辑
[中] Dashboard 模块逐文件清理 TS6133
src/dashboard/tabs/settings/sync/SyncSettings.ts
src/dashboard/tabs/sync.ts
src/dashboard/ui/dataViewModal.ts
src/dashboard/userProfile.ts
[低] 提交并推送改动，触发 CI（如有）