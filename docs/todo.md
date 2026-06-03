# Todo 计划

> 只保留待办、暂缓项和需要继续跟踪的收尾项；已完成的迁移、拆分和测试基线记录已清理。

---

## 功能增强

- [ ] 聚合
- [ ] 页面番号识别
  - [ ] 在影片页识别网友评论中的经典番号
  - [ ] 与 Emby/Jellyfin 相关入口形成可复用能力
- [ ] 标签高亮/折叠
  - [ ] 支持列表页按标签高亮命中项
  - [ ] 支持折叠低优先级标签区域
  - [ ] 结合现有内容过滤规则，避免重复实现过滤体系
- [ ] 状态按钮视觉优化
  - [ ] 详情页当前状态高亮，其它状态弱化
  - [ ] 评估 JAV-JHS 的屏蔽、收藏、已下载、已观看四状态交互

---

## Dashboard / 设置页

- [x] 客户端遥测设备 ID 对齐
  - [x] 核实 `buildTelemetryPayload.ts` 当前 `deviceId` 来源为 `telemetry_client_state.installId`
  - [x] 改为优先上报设置页显示的 `settings.webdav.clientId`
  - [x] 保留 `installId` 作为遥测安装归并标识
  - [x] 补充测试：设置页 Device ID 变化后，payload 的 `deviceId` 使用最新 `webdav.clientId`
  - [x] 补充兼容测试：无 `webdav.clientId` 时仍能用 telemetry install state 完成内部归并

- [x] 客户端错误事件上报（`error_report`）
  - [x] 设计 payload：`component`、`code`、Error 类名、`stackHash`、`fatal`
  - [x] 保护隐私：payload 中避免采集页面 URL、番号、磁力链接、API 地址、token 和原始 stack trace
  - [x] 扩展 telemetry 类型：event type、error payload、联合 payload、结果原因
  - [x] 新增错误 payload 构建器：stack 归一化、敏感文本清洗、SHA-256 `stackHash`
  - [x] 新增错误节流：会话级去重、指纹冷却
  - [x] 新增错误 reporter：检查开关和 endpoint 后发送，全局兜底异常
  - [x] 扩展 telemetry client 和 runtime message 处理
  - [x] 在 background 全局 `error` / `unhandledrejection` 中接入
  - [x] 在 content bootstrap 全局 `error` / `unhandledrejection` 中接入
  - [x] 补充验证：payload、stackHash、节流、runtime message、隐私字段

- [ ] 遥测后端线上验收
  - [ ] 通过 admin events 回看 `error_report` 入库字段、Device ID 和 telemetry installId 展示

- [ ] 报告（Insights）设置
  - [ ] 配置报告生成所用的聚合参数
  - [ ] 仅影响本地统计和 AI 提示词输入

---

## 项目结构 / 代码组织

- [x] P1：`apps/dashboard/bootstrap.ts` 装配层收口
  - [x] 价值：入口文件边界更清楚，Dashboard 初始化逻辑更容易定位和维护
  - [x] 风险：中等；需要保持主题、布局、隐私、115、首页图表和发布弹窗初始化顺序稳定
  - [x] 抽出主题初始化、console proxy 配置、隐私初始化、115 配额侧栏和版本信息侧栏
  - [x] 保持页面入口聚焦布局挂载、全局监听注册和 tab 初始化顺序

- [x] P2：Dashboard `newWorks.ts` 收口
  - [x] 价值：进一步降低新作品页入口复杂度，减少状态和事件桥接散落在 `NewWorksTab`
  - [x] 风险：中高；涉及批量打开、刷新进度、订阅弹窗、按钮 loading 和选择状态
  - [x] 抽出筛选状态、选择状态、冷却状态和订阅操作 runtime
  - [x] 收尾：`NewWorksTab` 保留 tab 生命周期与 controller 装配
  - [x] 复核批量打开、刷新进度、订阅配置、选择状态和按钮状态测试覆盖

- [ ] P3：旧兼容出口清理计划
  - [ ] 价值：减少旧路径干扰，长期降低导入路径维护成本
  - [ ] 风险：中高；兼容 wrapper 影响面广，适合在稳定版本后分批处理
  - [ ] 按 release 稳定周期复核 `src/content`、`src/background`、`src/utils` 的 thin wrapper
  - [ ] 确认调用方全部迁移后，再制定移除节奏

---

## 磁力 / 资源

- [ ] 多源磁力负缓存和失败退避（暂缓）
  - [ ] 记录 BTdig、JAVBUS 等失败状态和短期退避时间
  - [ ] 避免短时间内重复请求明显失败的来源
  - [ ] 保留手动重试入口
- [ ] 高质量磁力过滤
  - [ ] 评估是否加入参考脚本的高质量过滤按钮
  - [ ] 与现有来源筛选、字幕 tag、分页联动

---

## 影片页 / 资源入口

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

## 新作品

- [ ] 添加演员弹窗优化
  - [ ] 弹窗列出的列表添加标识排除拉黑演员

---

## WebDAV 设置

- [ ] Alist URL 规范化提示
  - [ ] 检测常见 Alist `/dav/` 路径问题
  - [ ] 给出可操作的修正提示

---

## 日志设置

- [ ] 检查所有功能增强是否具备独立标识

---

## 番号库

- [ ] 状态筛选 UX 优化
  - [ ] 评估批量状态变更
  - [ ] 评估已浏览、想看、已看状态筛选的入口和提示
- [ ] 列表页短评弹窗（暂缓）
  - [ ] 评估接口压力和缓存策略
- [ ] 轻量图片画廊
  - [ ] 评估 ViewerJS 或现有预览能力复用

---

## 演员库

- [ ] 演员库新增演员更多信息
  - [ ] 可通过增强功能获取 Wiki 信息并保存
- [ ] 优化列表视图和卡片视图的切换
- [ ] 从 JavDB 收藏演员导入
  - [ ] 评估 JavDB 收藏演员数据来源
  - [ ] 导入时去重并保留现有演员备注

---

## Emby

- [ ] 功能优化
- [ ] Emby/Jellyfin 入库状态
  - [ ] 单独做规格设计
  - [ ] 明确媒体库索引同步方式
  - [ ] 设计 JavDB 列表页和详情页入库标记
  - [ ] 设计实时媒体库校验队列
