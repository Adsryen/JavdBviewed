# 发版记录归档

本目录存放历史发版备注与 release 辅助数据，**不参与扩展运行时**。

| 文件 | 说明 |
|------|------|
| `release-notes-v*.md` | 某次发版时生成的说明草稿/归档 |
| `release-history.json` | `scripts/release-history.ps1` 读写的历史索引 |

运行时「版本与关于」公告文案仍在：

`apps/extension/src/features/releaseAnnouncement/domain/releaseNotes.ts`

构建时 `scripts/assert-release-notes.cjs` 校验的是上述 TS 源，不是本目录 md。
