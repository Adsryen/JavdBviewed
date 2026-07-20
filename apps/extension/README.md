# @javdb/extension

浏览器扩展主产物。源码在 `apps/extension/src/`；构建产物默认输出到仓库根 `dist/` / `dist-zip/`。

## 命令（从仓库根）

```bash
pnpm --filter @javdb/extension build
# 或根脚本（兼容）
pnpm build
```

## 版本

| 项 | 约定 |
|----|------|
| 版本源 | 仓库根 `version.json` |
| Git tag | **`v{semver}`**（与历史一致，如 `v1.21.5`） |
| 安装包文件名 | `javdb-extension-v{semver}[-build-N].zip`（产物名，不是 git tag） |
