# 文档站说明

这个目录是项目内置的 `VitePress` 文档站。

## 本地开发

先安装依赖：

```bash
npm install
```

启动文档站：

```bash
npm run docs:dev
```

构建文档站：

```bash
npm run docs:build
```

预览构建结果：

```bash
npm run docs:preview
```

## Vercel 配置

建议在 Vercel 中使用下面的配置：

- Build Command: `npm run docs:build`
- Output Directory: `dist`
- Install Command: `npm install`

当前 `VitePress` 已配置直接输出到仓库根目录 `dist`，这样更符合 Vercel 对静态站点产物目录的识别方式。

## 下一步建议

1. 先本地跑起来确认页面结构
2. 把 `tutorial/` 里的内容逐步迁移到 `docs/guide/`
3. 再接入 Vercel 预览部署
