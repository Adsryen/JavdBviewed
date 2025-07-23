# JavdBviewed

JavDB 视频浏览历史标记与管理扩展。核心功能是在 JavDB 列表页和详情页标记视频的“已浏览”或“我看过”状态，并提供数据管理功能。

---

## 项目结构与版本说明

本项目包含多个版本和目录，分别服务于不同的目的。

### 📁 `javdb-extension` - (Vite + TS 开发版)

这是项目的主要开发目录，使用了一套现代前端技术栈。

*   **技术栈**: TypeScript, Vite
*   **特点**:
    *   代码组织性好，有类型检查，适合开发复杂功能。
    *   需要**编译打包**。修改代码后，必须运行 `npm run build` (或类似命令) 才能生成可在浏览器中运行的 `dist` 目录。
    *   调试相对不便，因为浏览器执行的是编译后的代码。
*   **子目录说明**:
    *   `src/`: 存放所有 TypeScript 源码。
        *   `background/`: Service Worker 脚本，处理后台任务。
        *   `content/`: 内容脚本，注入到 JavDB 页面进行 DOM 操作。
        *   `popup/`: 扩展弹窗的 UI 和逻辑。
        *   `utils/`: 存放共享的辅助函数，如 `storage.js`。
    *   `dist/`: 存放 `Vite` 编译打包后的最终产物，这个目录是实际加载到浏览器中的。
    *   `node_modules/`: 存放项目依赖。

### 📁 `javdb-extension-native` - (原生 JS 重构版)

为了解决编译麻烦和调试困难的问题，从 `javdb-extension` 重构而来的原生 JavaScript 版本。

*   **技术栈**: 原生 JavaScript (Vanilla JS), ES Modules
*   **特点**:
    *   **无需编译**，直接修改 `.js` 文件即可。
    *   开发流程极其简单：**修改代码 -> 刷新扩展**。
    *   调试直观，浏览器开发者工具中看到的就是源码。
    *   项目结构扁平、轻量。
*   **文件说明**:
    *   `manifest.json`: 扩展的核心清单文件。
    *   `background.js`: 背景脚本。
    *   `content.js`: 内容脚本。
    *   `popup.html` / `popup.js` / `popup.css`: 弹窗 UI 相关文件。
    *   `storage.js` / `config.js` / `utils.js`: 从原 `utils` 目录提取的辅助模块。
    *   `lib/`: 存放本地化的第三方库，如 `webdav.js`。
    *   `icons/`: 存放扩展所需的所有图标。

### 📁 `JavDB-userscript` - (油猴脚本版)

这是一个独立的油猴脚本版本，适用于 Tampermonkey 等用户脚本管理器。

*   **技术栈**: TypeScript, Vite
*   *特点*: 与 `javdb-extension` 类似，也需要编译。最终产物是一个 `.user.js` 文件，可以直接安装到油猴。

---

### 如何选择和使用？

*   若要进行**功能开发或添加复杂逻辑**，建议在 `javdb-extension` 目录下进行，享受 TypeScript 带来的开发优势。
*   若要进行**快速修改、调试或仅仅是使用**，`javdb-extension-native` 是最佳选择。直接在 `chrome://extensions` 中“加载已解压的扩展程序”，选择此文件夹即可。
*   `JavDB-userscript` 适用于不希望安装完整扩展，而偏好使用油猴脚本的用户。
