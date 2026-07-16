# @javdb/extension

浏览器扩展主产物。源码在 `src/`；构建产物默认输出到仓库根 `dist/` / `dist-zip/`。

## 命令（从仓库根）

```bash
pnpm --filter @javdb/extension build
# 或根脚本（兼容）
pnpm build
```

版本源：仓库根 `version.json`（语义仍 = extension）。发版 tag 规范：`extension-v{semver}`。
