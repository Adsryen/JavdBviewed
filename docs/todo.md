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
- [ ] 第二批迁移：字幕与外部搜索
  - [ ] 建立 `features/subtitles`
  - [ ] 迁移迅雷字幕弹窗与响应 normalize 逻辑
  - [ ] 建立 `features/externalSearch`
  - [ ] 迁移详情页外部搜索渲染和搜索引擎匹配逻辑
  - [ ] 旧路径保留 re-export 一轮，降低 import 震荡
- [ ] 第三批迁移：磁力功能域
  - [ ] 建立 `features/magnets`
  - [ ] 迁移 `magnetSearch.ts`
  - [ ] 迁移 `magnetResultMerge.ts`
  - [ ] 迁移 `magnetPagination.ts`
  - [ ] 迁移 `magnetSourceTagState.ts`
  - [ ] 迁移 `javbusMagnetSource.ts`
  - [ ] 旧路径保留 re-export 一轮，降低 import 震荡
- [ ] 第四批迁移：基础设施
  - [ ] 建立 `platform/network`
  - [ ] 建立 `platform/storage`
  - [ ] 建立 `platform/tasks`
  - [ ] 建立 `platform/logging`
  - [ ] 建立 `platform/browser`
  - [ ] 迁移 background DB、request scheduler、task center、logger 等基础设施
- [ ] 清理旧目录和历史备份文件
  - [ ] 处理 `src/background/*.bak`
  - [ ] 处理 `src/background/background.ts.step*`
  - [ ] 确认无构建引用后移动到归档目录或删除

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
