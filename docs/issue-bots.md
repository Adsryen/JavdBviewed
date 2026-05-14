# Issue Bots

本仓库包含两个轻量 GitHub Issue Bot：

- `Issue Summary Bot`：在 Issue 创建、编辑、重新打开时自动生成结构化总结评论，并在缺少关键信息时提醒补充。
- `Issue Labeler Bot`：按标题和正文关键词自动打标签。

## 文件位置

- `.github/workflows/issue-summary.yml`
- `.github/workflows/issue-labeler.yml`
- `.github/workflows/repo-label-sync.yml`

## 当前行为

### Summary Bot

会生成一条包含以下内容的评论：

- 类型
- 标题
- 提交者
- 核心内容
- 关键信息
- 复现步骤 / 使用场景
- 期望结果 / 建议方案
- 补充说明

它会复用同一条评论。Issue 内容更新后，Bot 会更新原评论。

当 Issue 缺少环境信息、核心描述、复现步骤或期望结果时，Bot 会额外生成一条补充提醒评论。补充完成后，这条提醒会自动更新或删除。

### Labeler Bot

会尝试命中这些标签：

- `bug`
- `enhancement`
- `site-compatibility`
- `sync`
- `115`
- `ai`
- `privacy`
- `dashboard`
- `docs`
- `question`

这些标签现在可以通过 `Repo Label Sync` workflow 自动创建和更新。

## VitePress 目录迁移

文档站源码目录已经从 `docs/` 迁移到 `vitepress/`。

- `vitepress/`：VitePress 站点源码
- `docs/`：仓库通用文档
- `.gitignore` 已调整为放行 `vitepress/` 内容
- `docs-dist/`：VitePress 构建输出

## Label Sync

`Repo Label Sync` 支持两种触发方式：

- 手动运行 `workflow_dispatch`
- 修改 workflow 文件后自动运行一次

它会自动创建或更新这 10 个标签的名称、颜色和描述。

## 后续增强

后续可以继续加：

- 缺少环境信息时自动提醒
- 用 GitHub Models 或外部 LLM 生成更智能的摘要
- 自动查找重复 Issue
- 自动把高频问题转 Discussion
