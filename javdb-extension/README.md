# JavDB 列表页显示是否已看（浏览器插件版）

本插件用于在 JavDB 演员/列表页显示每部影片是否已看，支持导入导出、WebDAV 备份等功能。

## 主要功能
- 列表页/演员页显示“已看”或“已浏览”状态
- 支持导入/导出本地数据
- 支持 WebDAV 云端备份
- 支持弹窗和设置页

## 目录结构
```
javdb-extension/
├── manifest.json
├── README.md
├── package.json
├── src/
│   ├── background/
│   │   └── background.js
│   ├── content/
│   │   └── content.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   ├── assets/
│   │   └── icon.png
│   └── utils/
│       └── storage.js
└── public/
    └── (可选静态资源)
```

---

如需迁移 Tampermonkey 代码，请将核心逻辑拆分到 content.js、popup.js、background.js、options.js 等对应文件。 