# 媒体库发版验收清单

> 代码侧 A→B→C→D 已落地；下列「真机」项需在用户 Emby/115 环境勾选。

## 自动化（已通过）

- `tsc --noEmit`
- unit：embyLibrary / media pages / drive115 v2 / mediaWatchEvidence
- visual：`tests/visual/mediaGridLayout.visual.spec.ts`（网格不重叠、封面 ~16:9）
- `pnpm run build` → `dist-zip/javdb-extension-v*.zip`

## 真机（人工）

### Emby / Jellyfin

1. 设置 → 服务器：API Key + **用户登录**
2. 拉取媒体库 → 多选库 → 同步
3. 媒体库卡片：封面略缩图可见（同步后）
4. 徽章：已入库 / 在看 / 真实已看
5. 播放 / 详情：打开官方网页
6. 「标为真实已看 / 未看」：服务器端状态变化

### 115

1. 已完成 115 Open 授权
2. 媒体库 → 115 播放：搜索番号 → 优先扩展内 video，失败则网页播放
3. 播放一段时间后，本地 `media_watch_evidence` 有进度
4. 真实已看 → 加入清理 → 清理清单可见
5. 尝试清理：成功则 deleted；失败则有明确原因（权限/接口）

### 番号站

1. 列表/详情：Emby 入库徽章 + 真实观看徽章
2. 详情真实已看：可「加入115清理」

## 能力边界（已知）

- Emby/JF：**不**做扩展内解码播放器，只外链官方页
- 仅 ApiKey、未登录用户：写回观看态可能 401
- 115 取流/删除依赖 Open 应用权限与接口可用性
- 封面 URL 含 api_key（query），因 CSS 背景图无法带 Header

## 产物

- 扩展包：`dist-zip/javdb-extension-v1.21.5-build-*.zip`
