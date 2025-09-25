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


好的，给你一份精简但覆盖面的「明天待办」清单。按优先级从高到低排列，且每项都可独立完成与提交。

高优先级
- 编译与类型检查
  - 运行构建并修复 TS 报错（重点检查：[src/background/webdav.ts](cci:7://file:///e:/JavdBviewed/javdb-extension/src/background/webdav.ts:0:0-0:0)、[src/background/migrations.ts](cci:7://file:///e:/JavdBviewed/javdb-extension/src/background/migrations.ts:0:0-0:0)、[src/background/miscHandlers.ts](cci:7://file:///e:/JavdBviewed/javdb-extension/src/background/miscHandlers.ts:0:0-0:0)、[src/utils/config.ts](cci:7://file:///e:/JavdBviewed/javdb-extension/src/utils/config.ts:0:0-0:0)）。
  - 确认新增的 `STORAGE_KEYS.NEW_WORKS_RECORDS` 无遗漏使用面。
- 冒烟测试（消息路由）
  - 验证 `ping`、`get-logs`、`OPEN_TAB_BACKGROUND`、`fetch-external-data`。
  - 预览相关：`FETCH_JAVDB_PREVIEW`、`FETCH_JAVSPYL_PREVIEW`、`FETCH_AVPREVIEW_PREVIEW`。
  - 115：`DRIVE115_PUSH`、`DRIVE115_VERIFY`、`DRIVE115_HEARTBEAT`。
  - WebDAV：`webdav-list-files`、`webdav-test`、`webdav-upload`、`webdav-restore`。
  - DB 路由：`DB:VIEWED_*`、`DB:LOGS_*`、`DB:ACTORS_*`、`DB:NEWWORKS_*`、`DB:MAGNETS_*`。
- 磁链路由调用方对齐
  - 搜索调用端（如 `src/content/dbClient.ts`）是否仍用 `DB:MAGNETS_CLEAR_ALL`。
  - 如有，改为 `DB:MAGNETS_CLEAR`；需要过期清理的用 `DB:MAGNETS_CLEAR_EXPIRED`（可带 `beforeMs`）。

中高优先级（日志与 IDB 优化第1步）
- logger 改为只写 IDB
  - 将后台 [log()](cci:1://file:///e:/JavdBviewed/javdb-extension/src/background/miscHandlers.ts:16:0-32:1) 从 storage.local 双写改为仅写入 IDB（保留一次性迁移 [ensureIDBLogsMigrated()](cci:1://file:///e:/JavdBviewed/javdb-extension/src/background/migrations.ts:32:0-48:1)）。
  - 保持现有 `get-logs` 暂时不动，下一步再切 IDB。
- 迁移函数校验
  - 确认 [ensureMigrationsStart()](cci:1://file:///e:/JavdBviewed/javdb-extension/src/background/migrations.ts:50:0-70:1) 在入口 [background/background.ts](cci:7://file:///e:/JavdBviewed/javdb-extension/src/background/background.ts:0:0-0:0) 正常调用。
  - 检查 `chrome.alarms` 的磁链过期清理是否按计划触发。

中优先级（日志与 IDB 优化第2步/第3步）
- WebDAV 对接 IDB 日志
  - 备份导出/恢复改为从 IDB 导出/导入日志（现阶段可先保留 storage 兼容分支）。
  - `get-logs` 路由切到 IDB 查询，或在 UI 不再使用时移除该分支。
- Dashboard 日志页
  - 切换到 `DB:LOGS_QUERY` 分页加载。
  - 绑定“清空/导出”按钮：`DB:LOGS_CLEAR/DB:LOGS_EXPORT`。
  - 可选：增加“日志保留天数”输入框（`logRetentionDays`）。

中优先级（回归）
- 115 回归
  - 验证 `drive115.add_task_urls_v2 / refresh_token_v2 / get_quota_info_v2` 流程与容错。
  - 兜底的 `drive115.refresh_token_v2` 消息也要测试。
- 新作品回归
  - `new-works-manual-check / new-works-scheduler-restart / new-works-scheduler-status`。
  - 验证 `onStartup` 的 `newWorksScheduler.initialize()` 是否触发。

低优先级
- 文档补充
  - 在 README/开发文档说明新的 `background/` 模块结构与装配流程。
- 清理遗留
  - 移除不再使用的旧代码段与注释。
  - 统一消息常量命名与返回格式。

如果你希望，我可以把这份 ToDo 同步为项目内的 todo.md 模板，或拆成更细的子任务清单（每项附带检查命令/接口示例）。你明天从“编译与冒烟测试”开始最稳，确保拆分后功能面无回归，然后再按计划推进日志与 IDB 的优化。