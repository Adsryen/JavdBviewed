# 文档站说明

本目录是项目内置的 `VitePress` 文档站源码。

## 本地开发

```bash
npm install
npm run vitepress:dev
```

## 构建与预览

```bash
npm run vitepress:build
npm run vitepress:preview
```

当前文档站源码目录为 `vitepress/`，构建输出目录为仓库根目录下的 `vitepress/.vitepress/dist/`。

## 文档迁移范围

- 根目录 `README.md` 中适合进入文档中心的技术说明
- `FEATURES.md` 功能总览
- `PRIVACY_POLICY.md` 隐私政策
- `src/` 下部分模块级技术 README

## 维护建议

- 用户面向内容优先放在 `vitepress/guide/`
- 汇总/制度类内容放在 `vitepress/reference/`
- 面向开发者的说明放在 `vitepress/developer/`
