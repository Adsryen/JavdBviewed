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

- [ ] 设置搜索：实现类似 Windows 设置的扁平搜索
  - [ ] 设置首页新增搜索框，搜索设置项标题、描述、关键词
  - [ ] 搜索结果点击后跳转到对应设置页
  - [ ] 设置页加载后滚动到具体设置项
  - [ ] 目标设置项显示短暂高亮动画
  - [ ] 支持 Enter 进入首个结果
  - [ ] 支持 Esc 清空搜索
  - [ ] 支持少量关键词别名：字幕、迅雷、115、WebDAV、在线可看、磁力、FC2、隐私、代理、AI
  - [ ] 优先使用 DOM 自动索引，减少手工维护
- [ ] 设置页内搜索增强
  - [ ] 支持在当前设置页内搜索 `.settings-section`、`label`、`.input-description`
  - [ ] 搜索时自动展开命中的 section
  - [ ] 折叠状态按面板 ID 记忆到本地
- [ ] 搜索引擎设置：隐藏内置项
  - [ ] 支持用户隐藏内置搜索引擎模板
  - [ ] 隐藏状态持久化
  - [ ] 保持内置项只读，避免误改默认模板

---

## 🧱 项目结构 / 代码组织

- [ ] 制定 `src` 目录结构规划
  - [ ] 明确 `content`、`background`、`dashboard`、`services`、`shared`、`utils` 的职责边界
  - [ ] 确定新增功能优先放入功能域目录，减少根目录平铺文件
  - [ ] 约定每个功能域使用 `index.ts` 暴露稳定入口
- [ ] 第一批迁移：`src/content/magnets`
  - [ ] 迁移 `magnetSearch.ts`
  - [ ] 迁移 `magnetResultMerge.ts`
  - [ ] 迁移 `magnetPagination.ts`
  - [ ] 迁移 `magnetSourceTagState.ts`
  - [ ] 迁移 `javbusMagnetSource.ts`
  - [ ] 更新 import 并跑聚焦测试、typecheck、build
- [ ] 第二批迁移：`src/content/detail`
  - [ ] 迁移 `detailSearchLinks.ts`
  - [ ] 迁移 `onlineAvailability.ts`
  - [ ] 迁移 `videoFavoriteRating.ts`
  - [ ] 迁移 `videoDetail.ts`
  - [ ] 迁移 `enhancedVideoDetail.ts`
- [ ] 第三批迁移：`src/background`
  - [ ] 拆分 `db/`：`db.ts`、`dbRouter.ts`、`migrations.ts`
  - [ ] 拆分 `network/`：`netProxy.ts`、`requestScheduler.ts`、`javbusTabFetch.ts`
  - [ ] 拆分 `tasks/`：`globalTaskCenter.ts`、`taskPolicy.ts`、`taskStateStore.ts`
  - [ ] 拆分 `sync/`：`sync.ts`、`webdav.ts`
- [ ] 清理源码目录历史备份文件
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
