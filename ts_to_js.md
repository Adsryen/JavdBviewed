# JavDB 扩展 TypeScript 到原生 JavaScript 重构方案

本文档旨在将 `javdb-extension` 项目从一个基于 **TypeScript + Vite** 的现代前端项目，重构为一个**原生 JavaScript (Vanilla JS)** 的浏览器扩展项目。

重构的核心目标是：
*   **告别编译**：直接修改 `.js` 文件，在浏览器中刷新扩展即可看到效果，无需任何 `npm run build` 或 `vite` 命令。
*   **简化调试**：浏览器开发者工具中看到的就是您正在编辑的源代码，断点和日志完全对应，调试直观。
*   **项目轻量化**：移除所有与构建相关的依赖（Vite, TypeScript, etc.），项目结构更清晰。

---

## 重构步骤

### 步骤一：项目结构“扁平化”与清理

我们将抛弃 `src` 和 `dist` 的概念，让源代码目录就是最终的扩展目录。

1.  **创建新目录**：
    *   在 `JavdBviewed` 根目录下，建立一个全新的、干净的文件夹，命名为 `javdb-extension-native`。所有重构后的代码都将放在这里。

2.  **迁移核心清单与资源**：
    *   将原 `javdb-extension/public` 目录（或根目录，取决于图标等资源的位置）下的核心文件复制到新 `javdb-extension-native` 目录中：
        *   `manifest.json` (后续将进行修改)
        *   所有图标文件 (`icon16.png`, `icon48.png`, `icon128.png` 等)
        *   如果存在 `popup.html` 或 `options.html`，也一并复制。

3.  **移除构建相关文件**：
    *   在新项目中，以下文件将不再需要，请确保**不要**将它们复制到新目录：
        *   `package.json`, `package-lock.json`, `pnpm-lock.yaml`
        *   `node_modules` 目录
        *   `vite.config.ts`
        *   `tsconfig.json`
        *   `.gitignore`

### 步骤二：处理核心依赖 `webdav-client`

在没有 `npm` 和打包工具后，我们不能再使用 `import ... from 'webdav'`。解决方案是**“本地化依赖 (Vendoring)”**。

1.  **获取浏览器版本**：
    *   需要找到 `webdav` 库的浏览器兼容版本（通常是 UMD 或 ESM 格式的 `.js` 文件）。可以从 `node_modules/webdav/dist/` 目录中寻找，或从 unpkg、jsDelivr 等 CDN 下载。例如 `https://unpkg.com/webdav/dist/webdav.min.js`。

2.  **创建 `lib` 目录**：
    *   在 `javdb-extension-native` 目录下创建一个 `lib` 文件夹。

3.  **置入依赖文件**：
    *   将找到的 `webdav.min.js` (或类似名称的) 文件放入 `lib` 目录。

### 步骤三：将 TypeScript 代码转换为原生 JavaScript

这是主要的“翻译”工作。我们需要将 `javdb-extension/src` 目录下的所有 `.ts` 文件逐个转换为 `.js` 文件，并放到新项目 `javdb-extension-native` 的根目录。

**核心转换规则：**

1.  **移除类型注解**：
    *   **旧 (TS)**: `let url: string = "..."`
    *   **新 (JS)**: `let url = "..."`
    *   **旧 (TS)**: `function(data: MyData): void`
    *   **新 (JS)**: `function(data)`

2.  **改造模块导入/导出 (使用 ES Modules)**：
    *   **旧 (TS)**:
        ```typescript
        import { createClient } from 'webdav';
        import { someUtil } from './utils';
        ```
    *   **新 (JS)**:
        ```javascript
        // 假设库文件支持 ESM 导出
        import { createClient } from './lib/webdav.min.js';
        // 导入自己的模块时，必须使用相对路径和 .js 后缀
        import { someUtil } from './utils.js';
        ```

3.  **文件重命名**：
    *   所有 `.ts` 文件另存为 `.js` 文件。例如 `background.ts` -> `background.js`。

### 步骤四：重构 `manifest.json`

这是将所有部分串联起来的最后一步。

*   **修改后的 `manifest.json` 示例**:
    ```json
    {
      "manifest_version": 3,
      "name": "JavDB an Extension (Native)",
      "version": "1.0.0",
      "description": "原生JS版本的JavDB扩展",
      "icons": {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      },
      "background": {
        "service_worker": "background.js",
        "type": "module"
      },
      "content_scripts": [
        {
          "matches": ["*://*.javdb.com/*"],
          "js": ["content-script.js"]
        }
      ],
      "action": {
        "default_popup": "popup.html",
        "default_icon": "icons/icon16.png"
      },
      "permissions": [
        "storage",
        "scripting"
      ],
      "host_permissions": [
        "*://*.javdb.com/*"
      ],
      "web_accessible_resources": [
        {
          "resources": ["lib/*.js"],
          "matches": ["<all_urls>"]
        }
      ]
    }
    ```
    **关键变更点**:
    *   `background.service_worker` 的路径指向 `background.js`。
    *   为 `background` 添加 `"type": "module"`，以启用 `import/export` 语法。
    *   `content_scripts` 的 `js` 路径更新为 `.js` 文件。
    *   `web_accessible_resources` 确保页面可以访问 `lib` 目录下的库文件。

---

## 最终项目结构预览

```
javdb-extension-native/
│
├── manifest.json         # 核心清单文件 (已重构)
├── background.js         # 主要背景逻辑 (由 background.ts 转换)
├── content-script.js     # 页面注入脚本 (由 content-script.ts 转换)
├── utils.js              # (如果存在) 工具函数 (由 utils.ts 转换)
│
├── popup.html            # (如果存在) 弹窗页面
├── popup.js              # (如果存在) 弹窗脚本
│
├── icons/                # 图标文件夹
│   ├── icon16.png
│   └── icon128.png
│
└── lib/                  # 本地化的依赖库
    └── webdav.min.js
```

## 新的开发流程

1.  在代码编辑器中直接修改 `javdb-extension-native` 目录下的任意 `.js` 文件。
2.  打开 Chrome/Edge 的扩展管理页面 (`chrome://extensions`)。
3.  确保已开启“开发者模式”。
4.  点击“加载已解压的扩展程序”，选择 `javdb-extension-native` 文件夹。
5.  修改代码后，只需回到扩展管理页，点击该扩展下方的“**重新加载**”按钮即可生效。

---

## 附录：如何具体借鉴 `cursor` 项目的 WebDAV 使用方法

`cursor-auto-register-Browser-extensions` 项目不依赖编译，其处理外部库（如 WebDAV）的方式是本次重构的关键参考。其核心是：**将 `webdav` 库不当作一个需要“安装”的 `npm` 包，而是当作一个项目自带的普通 `.js` 工具文件。**

具体操作如下：

### 1. 获取 `webdav` 库的浏览器版本

我们不再使用 `npm install` 或从网络下载。相反，我们直接从原项目已有的 `node_modules` 文件夹中拷贝编译好的文件。

*   **来源文件**：`JavdBviewed/javdb-extension/node_modules/webdav/dist/web/webdav.js`

*   **操作**：
    1.  在 `javdb-extension-native` 项目根目录下，创建一个 `lib` 文件夹。
    2.  将上述来源文件复制到 `javdb-extension-native/lib/` 目录中。

### 2. 在代码中引入并使用

现在，`webdav` 库就像你写的任何其他本地工具函数一样，可以通过相对路径直接导入。

*   **改造前的 TypeScript 代码 (`background.ts`)**:
    ```typescript
    // 这行代码依赖 Node.js 的模块解析，需要打包工具支持
    import { createClient, AuthType } from 'webdav';

    // ... 后续代码
    const client = createClient(url, { authType: AuthType.Digest, username, password });
    ```

*   **改造后的原生 JavaScript 代码 (`background.js`)**:
    ```javascript
    // 直接通过相对路径导入本地文件，注意必须包含 .js 后缀
    // 这背后依赖 manifest.json 中 "type": "module" 的设置
    import { createClient, AuthType } from './lib/webdav.js';

    // ... 后续代码完全一样，无需改动
    const client = createClient(url, { authType: AuthType.Digest, username, password });
    ```

### 总结

通过以上两步，我们就完全复刻了 `cursor` 扩展处理外部依赖的模式：
1.  **依赖“内化”**：将库文件下载到项目内部。
2.  **本地导入**：使用标准的 ES Module `import` 语法，通过相对路径加载该库。

这样就彻底摆脱了对 `npm`, `node_modules` 和 `Vite` 的依赖，实现了“无编译”开发的最终目标。 