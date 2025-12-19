# 影片页增强｜“演员备注（年龄/身高/罩杯/引退）”整合改造方案

## 1. 背景与目标
- 将 Tampermonkey 用户脚本“jav备注”的核心能力（为演员显示年龄、身高、罩杯、是否引退，并附社媒/Wiki 入口）整合到本扩展。
- 以“影片页增强”为主入口，提供一个可开关的子功能区块，兼容面板展示与内嵌徽标两种模式。
- 要求性能友好、可配置（数据源顺序、缓存 TTL、样式）、可灰度。

## 2. 原脚本功能梳理（现状）
- 数据源：
  - **Wikipedia（日语）**：解析 infobox，抽取年龄（歳）、身高（cm）、罩杯（ブラサイズ首字母），引退（文内提示）。
  - **xslist.org（中文）**：搜索并解析首个演员页的概要段，抽取出生年推算年龄、身高 cm、罩杯 X Cup。
- 注入点：
  - 列表/详情“演员”链接后直接追加 `[age][height][cup][引退]`，并插入 IG/Twitter/Wiki 图标。
  - 顶部右侧浮动提示（wrap/fade）用于调试/反馈。

## 3. 目标体验（扩展内）
- 在影片详情页“演員/演员”信息块下方，新增“演员备注”区块（支持开关）。
- 展示样式：
  - **面板模式（默认建议）**：以“文本胶囊”呈现每位演员的备注，遵循既有风格偏好，主色为琥珀色（amber）。
  - **内嵌模式（可选）**：在演员链接后追加小型徽标（不影响原 DOM 布局）。
- 交互：
  - 点击图标打开 Wiki/IG/Twitter 新标签页；失败回退仅显示 Wiki（若可用）。
  - 请求失败时不打断页面，仅在区块内显示“未找到”灰色占位。

## 4. 架构设计
- **新服务：`actorExtraInfoService`**
  - getActorRemarks(name, opts): Promise<ActorRemarks>
  - fetchFromWikipedia(name): 通过 Wikipedia API/解析 infobox 获取 age/height/cup/retired/wikiUrl
  - fetchFromXslist(name): 搜索并解析首条结果的段落，获取 age/height/cup
  - 统一返回：
    ```ts
    interface ActorRemarks {
      name: string;
      age?: number;
      heightCm?: number;
      cup?: string;         // A-G等，单字母
      retired?: boolean;
      ig?: string;
      tw?: string;
      wikiUrl?: string;
      source: 'wikipedia' | 'xslist';
      fetchedAt: number;    // epoch ms
    }
    ```
  - **缓存**：chrome.storage.local，key `actorExtra:<normalized-name>`，含 `fetchedAt` 与 TTL（默认 7 天，可配）。
  - **并发与限流**：
    - 单页每位演员最多一次请求；
    - 针对 hosts（wikipedia、xslist）各自限速（如每域 10 次/分，可配）；
    - 统一挂到 orchestrator 的 deferred 阶段、空闲优先（idle）。
  - **名字标准化**：去除括号/标签后缀，中文/日文混名采用 Wikipedia 搜索 API 优先匹配；保留对“亞/亜”等常见变体的兼容匹配。

- **内容脚本集成**
  - 在 `enhancedVideoDetail.ts` 新增：
    - `runActorRemarks()`：
      - 定位演员区域（与现有 `runActors()` 相同 panel-block）；
      - 逐个演员名并发/限流获取备注；
      - 以面板或内嵌模式渲染；
      - 数据来源标注（eg. Wikipedia/xslist），错误与占位处理。
  - 在 `videoDetail.ts` 的 orchestrator 中新增任务：
    ```ts
    initOrchestrator.add('deferred', async () => {
      await videoDetailEnhancer.runActorRemarks();
    }, { label: 'videoEnhancement:runActorRemarks', idle: true, idleTimeout: 5000, delayMs: 1500 });
    ```

## 5. 解析策略（细节）
- Wikipedia：
  - 使用 `action=parse&prop=text&page=<title>` 或 `action=query&list=search&srsearch=<name>` 获取 HTML，再解析 `table.infobox`。
  - 规则示例：
    - 年龄：含“歳”的单元格，优先 `YYYY年..日（..歳）` 中 `..歳`；
    - 身高：含 `cm` 的单元格（排除 `kg` 特例），取数字；
    - 罩杯：邻近“ブラサイズ/バスト/カップ”的单元格首字母；
    - 引退：段落中含“引退/已引退”等关键词（宽松判断）。
- xslist：
  - 搜索 `https://xslist.org/search?query=<name>&lg=zh`，抓取首条链接进入详情页第一段落；
  - 正则提取：`出生: YYYY年` 推算年龄、`身高: (\d+)cm`、`罩杯: ([A-Z]) Cup`。

## 6. 设置面板（EnhancementSettings）
- 新增“影片页增强”子项：
  - **veEnableActorRemarks**：启用演员备注（默认建议：关闭）。
  - **veActorRemarksMode**：展示模式（面板/内嵌）。
  - **veActorRemarksSourceOrder**：数据源顺序（Wikipedia、xslist；可多选排序）。
  - **veActorRemarksTTL**：缓存有效期（天）。
  - **veActorRemarksStyle**：样式主题（默认 amber 胶囊）。

## 7. UI 与样式
- 面板容器：`.enhanced-actor-remarks`，与现有增强区块一致的留白与阴影；
- 胶囊：
  - 名称 + 若干徽标（年龄/身高/罩杯/引退）；
  - 颜色方案与“演员水印”偏好一致（琥珀 amber 为主色）；
  - Tooltip 展示来源与抓取时间；
- 图标：Wiki、IG、Twitter 采用扩展内资源或 data URI，避免外链与 CSP 问题。

## 8. 权限与安全
- manifest 更新：
  ```json
  {
    "host_permissions": [
      "https://ja.wikipedia.org/*",
      "https://zh.wikipedia.org/*",
      "https://xslist.org/*"
    ]
  }
  ```
- 通过后台 Service Worker 发起跨域 fetch，内容脚本仅与后台通信，避免页面 CSP 限制。
- 不收集、不上报用户隐私；仅按需抓取公开页面。

## 9. 并发、降级与错误处理
- 同步策略：
  - 首选 Wikipedia，失败则回退 xslist；
  - 全部失败时显示灰色“未找到”；
- 限流：按域名令牌桶/间隔（默认每域 10 次/分钟），可在设置中微调；
- 重试：1 次指数退避；
- 断网/超时：跳过展示，不影响其它增强任务。

## 10. 性能与可维护性
- 仅在“影片页增强”开启时调度；
- 统一走 orchestrator 的 deferred+idle 阶段；
- 缓存命中优先，跨页同名演员复用缓存；
- 解析规则集中在 service，便于替换/升级。

## 11. 开发计划与里程碑
- **阶段1（服务层）**：actorExtraInfoService（抓取、解析、缓存、限流）
- **阶段2（内容脚本）**：runActorRemarks + 注入 UI（面板/内嵌）+ orchestrator 编排
- **阶段3（设置面板）**：新增开关与子配置项、读取与保存
- **阶段4（清单与权限）**：manifest host_permissions，验证 CSP
- **阶段5（测试与灰度）**：样例覆盖、手测清单、默认关闭灰度逐步放开

## 12. 验收标准
- 开关可控：关闭不注入、开启按模式展示；
- 对常见演员（如“三上悠亜”）能稳定解析出至少 2 项字段；
- Wikipedia 失败时可回退 xslist；
- 缓存与 TTL 生效；
- 不破坏原页面结构与交互；
- 资源请求数量与时长在可控范围内（单页 < 5s 增量，失败快速降级）。

## 13. 待确认项
- **默认开关状态**（建议默认关闭）；
- **默认展示模式**（建议面板）；
- **颜色与样式**（建议 amber 胶囊，符合既有偏好）；
- **是否在演员详情页也显示**（当前计划仅影片页，演员页可列为后续）
- **是否强制显示 IG/Twitter 图标**（xslist 可用时显示，否则仅 Wiki）。

——
备注：本方案遵循现有“影片页增强”编排模型（initOrchestrator）与设置面板结构，样式延续既有 UI 规范与用户偏好。
