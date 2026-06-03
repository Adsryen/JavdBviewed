# 参考脚本功能对比分析

复核日期：2026-06-03

本轮范围：重新比对 `reference/Tampermonkey` 中更新的三个参考脚本，并同步当前拓展已完成的 Emby/Jellyfin 入库状态、媒体库自动同步、实时校验队列、Jellyfin 跳转修正、字幕搜索、详情页 Portal 和迅雷字幕弹窗状态。

## 参考文件

| 文件 | 版本 | 定位 |
|---|---:|---|
| `reference/Tampermonkey/JavdbBuddy.js` | 0.9.0 | JavDB 一体化增强：超级功能、Emby/Jellyfin、评论、清单、JAVBUS 磁力、在线资源、快捷搜索 |
| `reference/Tampermonkey/JAV-JHS.js` | 3.3.6.025 | JavDB/JavBus 鉴定系统：收藏、屏蔽、已下载、已观看、演员、新作品、115、字幕、识图、预览 |
| `reference/Tampermonkey/FC2PPVDB-Enhanced.js` | 2.1.2 | FC2/JAV 多站增强：FC2 卡片重构、磁力聚合、预览图、历史、过滤、WebDAV/Supabase 同步 |

## 当前拓展相关模块

- `src/content/superRankingNav.ts`
- `src/content/onlineAvailability.ts`
- `src/content/detailSearchLinks.ts`
- `src/content/magnetSearch.ts`
- `src/content/magnetResultMerge.ts`
- `src/content/javbusMagnetSource.ts`
- `src/content/magnetSourceTagState.ts`
- `src/content/magnetPagination.ts`
- `src/content/anchorOptimization.ts`
- `src/content/contentFilter.ts`
- `src/content/videoFavoriteRating.ts`
- `src/content/enhancedVideoDetail.ts`
- `src/content/embyEnhancement.ts`
- `src/features/embyLibrary/*`
- `src/apps/background/alarmRouter.ts`
- `src/services/reviewBreaker/index.ts`
- `src/services/relatedLists/index.ts`
- `src/services/fc2Breaker/index.ts`
- `src/services/actorRemarks/index.ts`
- `src/services/newWorks/*`
- `src/services/drive115*`
- `src/background/webdav.ts`
- `src/utils/searchEngines.ts`
- `src/dashboard/tabs/settings/*`

## 状态标记

| 标记 | 含义 |
|---|---|
| `✅ 已落地` | 当前拓展覆盖参考脚本的核心能力 |
| `🟡 部分落地` | 主体能力存在，仍有站点、交互、默认配置或稳定性差异 |
| `🔵 待做` | 当前拓展缺少对应能力 |
| `🟣 建议暂缓` | 价值窄、维护成本高，适合排在核心链路之后 |

## 总体判断

当前拓展已经覆盖参考脚本中对 JavDB 详情页价值最高的能力：超级排行榜、热播、Top250、FC2 弹窗、评论解锁、相关清单解锁、JAVBUS/多源磁力、在线可看性检测、详情页外部搜索、字幕搜索、迅雷字幕弹窗、Emby/Jellyfin 入库状态、115 推送、WebDAV 备份恢复、演员备注和新作品检测。

新增 `FC2PPVDB-Enhanced.js` 后，差异重心更清晰：它在“FC2/JAV 多站卡片重构、批量选择、Supabase 同步、跨站历史状态、卡片动作可配置”上更完整。当前拓展在 JavDB 主站增强上更集中，在 FC2PPVDB、MissAV、Supjav、JavFC2 等外站页面增强上覆盖较少。

## 功能矩阵

| 功能域 | 状态 | 参考来源 | 当前拓展现状 | 剩余差异 | 建议 |
|---|---|---|---|---|---|
| 超级排行榜导航 | ✅ 已落地 | JavdbBuddy、JAV-JHS | `superRankingNav.ts` 已替换排行榜入口，包含热播、TOP250、有码、无码、欧美、FC2、FANZA 奖；已处理浏览器返回恢复 | 参考脚本有顶部/底部浮动按钮，当前只有预览图、磁链、TOP 锚点 | 保留现状；底部按钮按需加 |
| 热播榜 | ✅ 已落地 | JavdbBuddy、JAV-JHS | 使用 `jdforrepam.com/api/v1/rankings/playback`，支持日榜、周榜、月榜 | 参考脚本可继续叠加评分加载；当前更偏列表渲染 | 保留现状 |
| Top250 | ✅ 已落地 | JavdbBuddy、JAV-JHS | 支持全部、有码、无码、欧美、FC2、年份分页和登录 token 获取 | token 管理仍在内容页流程，Dashboard 隐私存储可增强 | 建议后续迁移 token 到 Dashboard 隐私存储 |
| FC2 页面入口 | 🟡 部分落地 | JavdbBuddy、JAV-JHS | 超级排行榜 FC2 指向免费 advanced_search；FC2 弹窗有详情、评论、清单、磁力、115、主题适配 | 参考脚本提供 123AV FC2 专用入口；JAV-JHS 可从 123AV 打开 FC2 弹窗 | 建议补 123AV FC2 入口 |
| FC2 弹窗磁力 | ✅ 已落地 | JAV-JHS、FC2PPVDB-Enhanced | FC2 弹窗已有多源磁力搜索和统一卡片样式 | FC2PPVDB-Enhanced 有负缓存、批量磁力提取、跨站卡片磁力按钮 | 详情弹窗保留现状；批量提取按需评估 |
| FC2/JAV 多站卡片重构 | 🔵 待做 | FC2PPVDB-Enhanced | 当前主要增强 JavDB 页面和 FC2 弹窗 | 参考脚本覆盖 FC2PPVDB、fd2ppv、Supjav、MissAV、fc2db、JavFC2，并重构卡片、预览、动作栏、外部入口 | 建议暂缓；这是独立外站增强项目 |
| 评论解锁 | ✅ 已落地 | JavdbBuddy、JAV-JHS | `ReviewBreaker` 使用外部 API，详情页有横幅、分页、过滤、点赞交互保留 | JAV-JHS 还能在 JavBus 详情页运行评论插件 | JavDB 侧保留；JavBus 侧按需求单独做 |
| 相关清单解锁 | ✅ 已落地 | JavdbBuddy、JAV-JHS | `RelatedListsService` 有横幅、分页、重试、清单统计 | 参考脚本样式较原生；当前拓展样式更统一 | 保留现状 |
| JavDB 原生磁力样式 | ✅ 已落地 | JavdbBuddy、JAV-JHS | 加载前原生磁力行已统一到加载后卡片风格，压缩高度，保留 115 | 参考脚本有高质量磁力过滤按钮 | 当前来源筛选和 tag 已覆盖主要用途；高质量过滤可选 |
| 多源磁力聚合 | ✅ 已落地 | JavdbBuddy、JAV-JHS、FC2PPVDB-Enhanced | 支持 JavDB、Sukebei、BTdig、BTSOW、JAVBUS，统一去重、来源 tag、来源筛选、分页、toast 数量提示；已补内存态短期失败退避，详情页手动加载可绕过退避 | FC2PPVDB-Enhanced 有批量提取和更完整队列诊断；JAV-JHS 有独立 MagnetHub 弹窗 | 继续按真实失败日志调退避时间；批量提取暂缓 |
| JAVBUS 磁力源 | ✅ 已落地 | JavdbBuddy、JAV-JHS | 支持详情页参数提取、ajax、tab 上下文兜底、HTML 兜底解析、缓存 | JAVBUS 403 仍受站点策略影响 | 继续按实际 403 日志优化 |
| 在线可看性检测 | ✅ 已落地 | JavdbBuddy、JAV-JHS | 支持 FANZA、Jable、MISSAV、Supjav、JavBus、123AV、NETFLAV、Avgle、JAVHHH、Jav.Guru；失败 tag 可配置；外部搜索已移动到在线可看下方 | 外站 DOM 规则随站点变化；FANZA/Jable 误判需要长期校准 | 继续按误报样本修 selector |
| 详情页外部搜索 | ✅ 已落地 | JavdbBuddy、JAV-JHS、FC2PPVDB-Enhanced | `detailSearchLinks.ts` 使用默认搜索引擎模板和站点图标，详情页显示在在线可看下方；已补 DMM/FANZA、Sukebei、FC2PPVDB、FC2DB 等入口 | FC2PPVDB-Enhanced 还有 FD2PPV、Supjav 等更宽的外站 Portal；内置模板隐藏状态仍可增强 | 保留当前 JavDB 主站入口；后续补“隐藏内置项”状态 |
| 搜索引擎设置去重 | ✅ 已落地 | JavdbBuddy | `searchEngines.ts` 已统一 URL 构建、默认模板、去重、图标解析；设置页内置项只读 | 用户隐藏默认模板的意图仍需持久化 | 建议补“隐藏内置项”状态 |
| 98堂自动搜索 | 🔵 待做 | JavdbBuddy | 当前有 98堂搜索模板入口 | 参考脚本覆盖 sehuatang 并自动年龄确认/提交搜索 | 建议暂缓；外站自动化维护成本高 |
| Emby/Jellyfin 入库状态 | ✅ 已落地 | JavdbBuddy | `embyLibrary` 已支持媒体服务器配置、`emby_library_state` 本地索引、后台全量同步、列表页/详情页入库标签、Emby/Jellyfin 双命中、Jellyfin details 跳转和同步后页面刷新 | 参考脚本会显示未入库/连接错误标签；当前拓展按低干扰策略只展示已入库标签和详情页未同步提示 | 作为 Beta 保留；后续补服务端诊断显示和命名收敛 |
| 实时媒体库校验 | ✅ 已落地 | JavdbBuddy | `EmbyLibraryRealtimeCheckQueue` 按批次、TTL 和防抖向 background 发送 `EMBY_LIBRARY_CHECK_CODES`，成功后更新本地索引并重处理列表 | 参考脚本在页面内用 GM_xhr 队列校验并直接渲染错误；当前拓展把请求放在 background，失败时保持旧状态避免列表闪烁 | 保留当前架构；后续按日志补连接错误提示 |
| 鉴定记录/收藏/屏蔽/已下载/已观看 | 🟡 部分落地 | JAV-JHS、FC2PPVDB-Enhanced | 当前拓展有已浏览/想看/已看、本地记录、番号库、内容过滤和列表页状态快捷标识 | JAV-JHS 的四状态表格、批量变更、快捷键仍更完整；FC2PPVDB-Enhanced 有 watched/downloaded 跨站状态 | 建议只吸收“批量状态变更”和“状态筛选 UX”，避免重复实现整套 JHS |
| 详情页快捷按钮 | 🟡 部分落地 | JAV-JHS | 当前有想看/已看评分、115 成功后标记、磁力按钮、SubTitleCat 和迅雷字幕入口 | JAV-JHS 详情页直接提供屏蔽、收藏、已下载、已观看等四状态按钮 | 四状态体系需先统一数据模型；可先优化当前状态按钮视觉 |
| 列表页卡片工具栏 | 🟡 部分落地 | JAV-JHS、FC2PPVDB-Enhanced | 当前有列表增强、预览、状态标记、内容过滤；已补卡片左下角状态快捷标识，可直接写入已浏览、想看、已观看 | 参考脚本有长缩略图、视频播放、复制番号/标题/封面、第三方站、批量选择 | 当前仅保留状态快捷入口；复制/封面/第三方站入口后续评估 |
| 列表页短评弹窗 | 🔵 待做 | JavdbBuddy | 详情页评论已完成 | 参考脚本可列表页弹窗查看短评 | 建议暂缓；接口压力和缓存策略需设计 |
| 列表页图片画廊 | 🟡 部分落地 | JavdbBuddy、JAV-JHS、FC2PPVDB-Enhanced | 当前已有视频预览、封面预览、原生预览增强 | 参考脚本有 ViewerJS 图集、长缩略图、额外预览图加载 | 建议后续做“轻量图片画廊” |
| DMM/FANZA 预告片多画质 | 🟡 部分落地 | JAV-JHS | 当前有视频预览和音量控制 | JAV-JHS 会调用 DMM API 找 `content_id`，提取多画质 mp4，并替换 JavDB 预告片 | 建议评估；对预览体验有价值，受 DMM API 稳定性影响 |
| 字幕搜索/预览 | ✅ 已落地 | JAV-JHS | 详情页已有独立 `字幕搜索` 面板，支持 SubTitleCat 跳转和迅雷字幕 API 弹窗；迅雷弹窗支持搜索、空状态、错误状态、下载和真实 `languages[]` 字段显示，已用 `MKMP-577` 校验 6 条返回 | 参考脚本还包含字幕预览；当前弹窗显示仍可压缩信息密度和补充大小/来源等字段 | 建议只做显示层优化；预览和缓存暂缓 |
| 以图识图 | 🔵 待做 | JAV-JHS | 当前无以图识图功能 | 参考脚本支持粘贴图片、上传图片搜索 | 建议暂缓；需要独立 UI 和外部接口稳定性验证 |
| 演员信息/Wikipedia | ✅ 已落地 | JAV-JHS | `actorRemarks` 已有 Wikipedia/xslist 演员备注 | JAV-JHS 还支持 JavBus 演员 DOM、演员页详情信息 | JavDB 侧保留；JavBus 侧按需求做 |
| 收藏演员/新作品检测 | ✅ 已落地 | JAV-JHS | `newWorks`、演员管理、Dashboard 已有订阅和检测 | JAV-JHS 支持从 JavDB 收藏演员同步、演员头像 CDN 搜索/编辑 | 建议补“从 JavDB 收藏演员导入” |
| 标题翻译 | 🟡 部分落地 | JAV-JHS | 当前有 AI/翻译相关服务和设置 | JAV-JHS 可批量翻译列表标题并本地缓存 | 建议暂缓，先稳定现有 AI 翻译链路 |
| 内容过滤 | ✅ 已落地 | JAV-JHS、FC2PPVDB-Enhanced | `contentFilter.ts` 支持关键词规则、详情页跳过、列表页过滤 | JAV-JHS 有标题关键词、演员黑名单、标签高亮/折叠；FC2PPVDB-Enhanced 有隐藏无码、隐藏已看、隐藏无磁力 quickbar | 建议补“标签高亮/折叠”；隐藏已看/无磁力结合现有筛选做 |
| 自动翻页/瀑布流 | ✅ 已落地 | JAV-JHS | 当前有 scroll paging，列表页自动加载 | JAV-JHS 有最大页保护、跳页控件 | 建议补跳页控件，自动加载保留现状 |
| JavBus 页面增强 | 🟡 部分落地 | JAV-JHS | 当前主要把 JavBus 作为磁力源和外部入口 | JAV-JHS 直接增强 JavBus 列表/详情、预览、磁力高亮、演员信息、115 匹配 | 建议暂缓；先保持 JavDB 主站体验 |
| 115 推送/匹配 | 🟡 部分落地 | JAV-JHS | 当前有 115 推送、任务、日志和成功后状态联动 | JAV-JHS 有 115 匹配、网盘任务插件、JavBus 场景支持 | 继续完善当前 115 v2；JavBus 场景按需补 |
| WebDAV 备份恢复 | ✅ 已落地 | JavdbBuddy、FC2PPVDB-Enhanced | 当前 WebDAV 有备份、恢复、设备档案、上传索引、PROPFIND 诊断 | FC2PPVDB-Enhanced 有单脚本历史/设置备份预览和冲突摘要；JavdbBuddy 有 Alist `/dav/` 自动修正 | 建议补 Alist URL 规范化提示 |
| Supabase 同步 | 🔵 待做 | FC2PPVDB-Enhanced | 当前拓展已有 WebDAV 和本地备份体系 | 参考脚本支持 Supabase 登录、推拉、冲突摘要、自动同步间隔 | 建议暂缓；WebDAV 已满足当前主同步场景 |
| 批量选择/批量磁力提取 | 🔵 待做 | FC2PPVDB-Enhanced | 当前番号库有批量操作，列表卡片已有单项状态快捷入口 | 参考脚本卡片上可批量标记已看、取消已看、复制 ID、提取磁力 | 建议在状态快捷入口稳定后评估 |
| 外部 Portal 管理 | 🟡 部分落地 | FC2PPVDB-Enhanced | 当前搜索引擎设置覆盖 JavDB 详情页和番号库搜索 | 参考脚本有可启用/禁用的 portal catalog：DMM、FC2、Supjav、MissAV、JavDB、JavBus、JavLibrary、FC2PPVDB、FD2PPV、FC2DB、Sukebei | 建议把搜索引擎体系扩展为“详情页/卡片可用入口” |
| QuickBar / FAB | 🟡 部分落地 | FC2PPVDB-Enhanced、JavdbBuddy | 当前有锚点按钮，已适配源站主题 | FC2PPVDB-Enhanced 有可拖拽 QuickBar，含同步状态、隐藏已看、隐藏无磁力、隐藏无码、选择模式、设置、返回顶部 | 建议暂缓；当前页面按钮已经够轻 |
| 设置面板 | 🟡 部分落地 | 三个参考脚本 | 当前 Dashboard 设置体系完整，搜索引擎、增强、115、同步、隐私等已集中 | 参考脚本的设置多为油猴弹窗；FC2PPVDB-Enhanced 的设置搜索、分组折叠、portal 勾选值得借鉴 | 建议吸收“设置搜索”和“分组折叠” |
| Cloudflare/限流处理 | 🟡 部分落地 | JavdbBuddy、FC2PPVDB-Enhanced | 当前有请求调度、超时、日志、Cloudflare 识别和任务编排 | 参考脚本在 GM_xhr 和 FC2 scraper 中有共享重试、负缓存、健康检测 | 建议抽共享错误分类器，优先服务磁力源和在线检测 |

## 三个参考脚本的新增关注点

### JavdbBuddy 0.9.0

- 仍以 JavDB 主站增强为核心，重点功能与上一轮一致：超级功能、Emby/Jellyfin、评论/清单、JAVBUS 磁力、在线资源、快捷搜索。
- 参考脚本保留顶部/底部浮动按钮、98堂自动处理、WebDAV Alist 修正、iframe 弹窗详情。
- 当前拓展已覆盖其主链路，并已吸收 Emby/Jellyfin 入库状态；剩余高价值差异转向 98堂自动处理、页面级状态按钮和设置交互细节。

### JAV-JHS 3.3.6.025

- 新版移除阿里云盘页面匹配与 Aliyun refresh token 插件，脚本更聚焦 JavDB/JavBus/字幕/识图/115。
- 新增 `removeSignature`、URL 参数工具、重试错误识别增强、JavBus 演员选择器补强。
- 详情页四状态按钮的视觉状态更清楚：当前状态高亮，其它按钮置灰。
- 当前拓展已吸收 SubTitleCat/迅雷字幕入口；仍可吸收状态按钮置灰逻辑和 JavBus 演员信息兜底选择器。

### FC2PPVDB-Enhanced 2.1.2

- 提供完整外站增强框架：站点识别、卡片重构、磁力队列、预览图、历史状态、批量选择、QuickBar、设置面板、调试日志。
- 支持 WebDAV 和 Supabase 双同步，并有冲突摘要、导入预览、备份版本校验。
- 提供 Portal Catalog，可按站点启用 DMM、FC2、Supjav、MissAV、JavDB、JavBus、JavLibrary、FC2PPVDB、FD2PPV、FC2DB、Sukebei。
- 对当前拓展最有借鉴价值的是：磁力负缓存、Portal 管理、批量选择、设置搜索/折叠、外站卡片动作设计。

## 后续建议

| 优先级 | 功能 | 建议动作 | 原因 |
|---:|---|---|---|
| 1 | Emby/Jellyfin Beta 收尾 | 抽出可复用番号提取逻辑，补默认设置合并和现有 Emby/Jellyfin 页面增强初始化回归，规划 `embyEnhancement` 等命名迁移 | 核心入库能力已落地，剩余项影响长期维护和提交质量 |
| 2 | 设置搜索/分组折叠 | 优化 Dashboard 设置页 | 功能越来越多，设置发现成本上升 |
| 3 | 迅雷字幕弹窗显示优化 | 已完成标题总数、字段 tag、复制链接和同名结果区分 | 已有弹窗和真实接口校验，显示层优化已覆盖当前主要痛点 |
| 4 | 标签高亮/折叠 | 列表页分类体验增强 | JAV-JHS 的实用小功能，风险低 |
| 5 | 磁力负缓存和失败退避 | 改造当前多源磁力搜索 | 可减少重复失败请求，改善 BTdig/JAVBUS 不稳定时的体验 |
| 6 | FC2PPVDB/MissAV/Supjav 外站卡片增强 | 作为独立项目评估 | 体量大，维护面宽，需要明确是否把拓展定位扩大到多站脚本 |
| 7 | Supabase 同步 | 暂缓 | 当前 WebDAV 已覆盖主同步需求，引入账号体系会增加隐私和维护成本 |
| 8 | 98堂自动搜索、iframe 详情弹窗、以图识图 | 暂缓 | 使用场景窄，外站兼容和维护成本偏高 |
