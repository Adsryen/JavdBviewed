# Javdb-Extension-Native 到 Javdb-Extension 迁移与重构方案

本文档旨在为将 `javdb-extension-native` (原生 JS 版本) 的功能完整迁移至 `javdb-extension` (Vite + TS 版本) 并进行现代化重构提供一份清晰、可执行的方案。

## 1. 迁移目标

*   **功能完整性**: 确保 `native` 版本的所有功能，包括视频状态标记、隐藏、WebDAV 同步、数据导出、弹窗快捷操作等，都在 `ts` 版本中完美实现。
*   **代码现代化**: 全面拥抱 TypeScript，为所有模块和函数提供明确的类型定义，提高代码的可维护性和健壮性。
*   **模块化优化**: 遵循 `javdb-extension` 已有的目录结构，对 `native` 版本中松散的代码进行归类和重构，实现高内聚、低耦合的模块化设计。
*   **工程化改进**: 充分利用 Vite 的能力，优化开发、调试和打包流程。移除废弃或不必要的依赖（如 Webpack 配置文件）。

## 2. 核心迁移策略

### 2.1. 包管理器选择: pnpm

为提升依赖安装速度、节省磁盘空间并从根本上避免“幻影依赖”问题，本项目将采用 **`pnpm`** 作为首选包管理器。

*   **优势**: 安装速度快、磁盘占用极低、依赖关系严格可靠。
*   **准备工作**: 请确保已全局安装 `pnpm`。如果尚未安装，请运行 `npm install -g pnpm`。
*   **后续操作**: 项目中所有的依赖管理和脚本执行都应使用 `pnpm` 命令（如 `pnpm install`, `pnpm add`, `pnpm run build`）。

### 2.2. 迁移步骤

1.  **环境清理与准备**:
    *   移除 `javdb-extension` 中与 Webpack 相关的配置文件 (`webpack.config.js`)，因为项目使用 Vite。
    *   检查 `package.json` 中的依赖，确保 Vite、TypeScript 及相关插件是最新版本。
    *   删除 `javdb-extension/src` 中现存的 `.js` 文件，为迁移进来的 `.ts` 文件做准备。

2.  **共享模块优先 (Utils)**:
    *   首先迁移 `native` 版本中的 `storage.js`, `config.js`, 和 `utils.js`。
    *   在 `javdb-extension/src/utils/` 目录下创建对应的 TypeScript 文件 (`storage.ts`, `config.ts`, `utils.ts`)。
    *   为所有函数和常量添加类型定义，并通过 `export` 关键字使其成为可供其他模块导入的 ES Module。

3.  **分模块逐一迁移**:
    *   按照 `content` -> `background` -> `popup` -> `dashboard` 的顺序，逐一进行模块迁移。
    *   对每个模块，在 `javdb-extension/src/` 对应的子目录中创建 `.ts` 文件和新的 `HTML/CSS` 文件。
    *   在迁移过程中，将原生 JavaScript 代码重构为类型安全的 TypeScript 代码。

4.  **UI 资源合并**:
    *   将 `native` 版本中的 `popup.html`, `popup.css`, `dashboard.html`, `dashboard.css` 等 UI 文件，作为基础迁移到 `ts` 版本对应的目录中。
    *   在迁移后，可以利用 Vite 的能力，考虑使用更现代的 CSS 方案（如 Sass, CSS Modules）进行优化。

5.  **Manifest V3 适配**:
    *   以 `native` 版本的 `manifest.json` 为基础，因为它可能包含了 V3 的最新配置。
    *   将其与 `ts` 版本的 `manifest.json` 合并，确保所有权限、内容脚本声明、背景脚本（Service Worker）和服务导出都是正确且符合 V3 规范的。

## 3. 分步执行计划

### 第 1 步: 项目环境清理与准备

*   [ ] **安装 pnpm**: 确保您已全局安装 pnpm (`npm install -g pnpm`)。
*   [ ] **删除旧配置**: 删除 `javdb-extension/webpack.config.js`。
*   [ ] **安装依赖**: 在 `javdb-extension` 目录下运行 `pnpm install`。这将根据 `package.json` 安装所有依赖，并生成一个 `pnpm-lock.yaml` 锁文件。
*   [ ] **清理 `src` 目录**:
    *   删除 `javdb-extension/src/background/background.js`
    *   删除 `javdb-extension/src/content/content.js`
    *   删除 `javdb-extension/src/popup/*`
    *   删除 `javdb-extension/src/dashboard/*`
    *   删除 `javdb-extension/src/utils/*`

### 第 2 步: `utils` 共享模块迁移

*   [ ] **创建 `src/utils/storage.ts`**:
    *   迁移 `native/storage.js` 的逻辑。
    *   为 `getValue`, `setValue`, `getSettings`, `saveSettings` 等函数添加泛型和类型定义。
    *   示例: `export const getValue = <T>(key: string, defaultValue: T): Promise<T> => { ... }`
*   [ ] **创建 `src/utils/config.ts`**:
    *   迁移 `native/config.js` 中的常量，如 `VIDEO_STATUS`, `STORAGE_KEYS`。
    *   使用 `export const` 导出，并为对象提供 `as const` 断言以获得更严格的类型推断。
*   [ ] **创建 `src/types/index.ts` (新增)**:
    *   建议新建一个类型定义文件，用于存放项目全局共享的类型。
    *   例如，定义 `VideoRecord`, `ExtensionSettings` 等核心数据结构。
    *   `export interface VideoRecord { id: string; title: string; status: 'viewed' | 'want' | 'browsed'; timestamp: number; }`

### 第 3 步: `content` 脚本迁移

*   [ ] **创建 `src/content/content.ts`**:
    *   将 `native/content.js` 的全部逻辑迁移至此。
    *   定义 `STATE` 对象和 `SELECTORS` 常量的类型。
    *   将所有 DOM 操作相关的代码封装在独立的函数中，并确保对 `Element` 类型进行正确断言或检查 (e.g., `item as HTMLElement`)。
    *   从 `../utils/storage` 和 `../utils/config` 导入所需函数和常量。
    *   `MutationObserver` 的回调函数等异步逻辑需要被正确处理。

### 第 4 步: `background` 脚本迁移

*   [ ] **创建 `src/background/background.ts`**:
    *   迁移 `native/background.js` 的逻辑。
    *   **WebDAV 逻辑**:
        *   将 `fetch` API 调用重构为类型安全的函数。可以为 WebDAV 的请求和响应创建 `interface`。
        *   `parseWebDAVResponse` 函数需要特别注意，其 XML 解析逻辑可以被重构得更健壮。
    *   **消息监听**: `chrome.runtime.onMessage.addListener` 的回调函数需要正确处理异步 `sendResponse`。
    *   **Alarms**: `chrome.alarms` 相关的逻辑保持不变，但要确保从 `utils` 导入的配置是类型安全的。
*   [ ] **WebDAV 库**: `native` 版本注释掉了 `webdav.js` 和 `axios`。在 `ts` 版本中，如果需要，应通过 `pnpm add -D @types/webdav-client @types/axios` 等命令来安装对应的库及其类型定义文件。当前的 `fetch` 实现是符合 V3 的，可以优先保留。

### 第 5 步: `popup` 弹窗迁移

*   [ ] **拷贝并创建 `src/popup/` 文件**:
    *   `popup.html` (从 `native/popup/popup.html`)
    *   `popup.css` (从 `native/popup/popup.css`)
    *   `popup.ts` (新建)
*   [ ] **重构 `src/popup/popup.ts`**:
    *   迁移 `native/popup/popup.js` 的逻辑。
    *   使用 `import` 引入 `storage` 和 `config`。
    *   为 DOM 元素获取添加类型断言，如 `document.getElementById('helpBtn') as HTMLButtonElement`。
    *   `createToggleButton` 等动态创建元素的函数，其逻辑应保持一致。

### 第 6 步: `dashboard` 页面迁移

*   [ ] **拷贝并创建 `src/dashboard/` 文件**:
    *   `dashboard.html` (从 `native/dashboard/dashboard.html`)
    *   `dashboard.css` (从 `native/dashboard/dashboard.css`)
    *   `dashboard.ts` (新建)
*   [ ] **重构 `src/dashboard/dashboard.ts`**:
    *   这一部分在 `native` 版本中也有对应的 `dashboard.js`，迁移其逻辑。
    *   这通常是功能最复杂的部分，包含数据展示、导入/导出、WebDAV 设置和测试等。
    *   建议将不同功能的代码块（如 "WebDAV 设置"、"数据管理"、"日志查看"）封装到不同的函数甚至独立的模块文件中，然后在 `dashboard.ts` 中导入并初始化。

### 第 7 步: `manifest.json` 合并与配置

*   [ ] **更新 `javdb-extension/manifest.json`**:
    *   **参考 `native/manifest.json`**: 确保 `manifest_version`, `permissions`, `host_permissions`, `background.service_worker`, `content_scripts`, 和 `options_page` (或 `options_ui`) 的配置是完整和正确的。
    *   **Vite 配置**: 确保 `content_scripts` 和 `background` 指向的是 Vite 打包后 `dist` 目录中的 JS 文件。Vite 插件 (如 `@crxjs/vite-plugin`) 会自动处理这个问题，需要确保其配置正确。

## 4. 优化建议

*   **UI 框架**: 在迁移完成后，可以考虑为 `popup` 和 `dashboard` 引入一个轻量级的 UI 框架（如 Preact, Svelte 或 Vue），以组件化的方式重构 UI，使其更易于管理和扩展。
*   **CSS 方案**: 将 `.css` 文件迁移为 `.scss` 或使用 CSS Modules，以利用变量、嵌套和作用域隔离等现代 CSS 特性。
*   **状态管理**: 对于复杂的 `dashboard` 页面，可以引入一个简单的状态管理库（如 Zustand），来更清晰地管理应用状态，而不是散落在各个模块的 `get/set` 调用。

完成以上步骤后，`javdb-extension` 项目将拥有 `javdb-extension-native` 的全部功能，并具备一个更强大、更易于维护的现代化技术栈。 