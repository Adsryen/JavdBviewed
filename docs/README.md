# 文档站说明

本目录是项目内置的 `VitePress` 文档站源码。

## 本地开发

```bash
npm install
npm run docs:dev
```

## 构建与预览

```bash
npm run docs:build
npm run docs:preview
```

当前文档构建输出目录为仓库根目录下的 `docs-dist/`，避免覆盖扩展构建产物 `dist/`。

## 文档迁移范围

- 根目录 `README.md` 中适合进入文档中心的技术说明
- `FEATURES.md` 功能总览
- `PRIVACY_POLICY.md` 隐私政策
- `src/` 下部分模块级技术 README

## 维护建议

- 用户面向内容优先放在 `docs/guide/`
- 汇总/制度类内容放在 `docs/reference/`
- 面向开发者的说明放在 `docs/developer/`
