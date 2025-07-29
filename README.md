# JavdBviewed

<div align="center">

![JavDB Viewed Marker](javdb-extension/src/assets/icon.png)

**JavDB 视频浏览历史标记与管理扩展**

[![GitHub release](https://img.shields.io/github/v/release/Adsryen/JavdBviewed)](https://github.com/Adsryen/JavdBviewed/releases)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://github.com/Adsryen/JavdBviewed/releases)

</div>

## 📖 简介

JavdBviewed 是一个功能强大的浏览器扩展，专为 JavDB 网站设计。它能够在列表页和详情页标记视频的"已浏览"或"我看过"状态，并提供丰富的数据管理功能，包括 WebDAV 同步、数据导入导出等高级特性。

### ✨ 核心功能

- 🎯 **智能标记**: 自动标记已浏览和已观看的视频
- 🔄 **数据同步**: 支持 WebDAV 云端同步，多设备数据一致
- 📊 **数据管理**: 完整的数据导入导出功能
- 🎨 **个性化**: 可自定义标记样式和显示选项
- 🚀 **高性能**: 优化的并发处理和缓存机制
- 📱 **多平台**: 支持 Chrome、Edge 等主流浏览器

### 🎬 功能特性详解

#### 视频标记系统
- **已浏览标记**: 自动记录访问过的视频详情页
- **已观看标记**: 手动标记已观看的视频
- **想看标记**: 标记感兴趣但未观看的视频
- **优先级显示**: 智能显示最重要的状态标记

#### 数据同步功能
- **WebDAV 支持**: 兼容坚果云、TeraCloud、Yandex 等主流服务
- **自动同步**: 定时自动同步数据到云端
- **冲突解决**: 智能处理多设备间的数据冲突
- **备份恢复**: 完整的数据备份和恢复机制

#### 界面增强
- **列表页标记**: 在视频列表中直观显示观看状态
- **详情页操作**: 在视频详情页快速标记状态
- **自定义样式**: 可自定义标记颜色和显示样式
- **隐藏功能**: 可选择隐藏已观看的视频

#### 数据管理
- **导入导出**: 支持 JSON 格式的数据导入导出
- **统计信息**: 显示观看统计和数据概览
- **批量操作**: 支持批量标记和管理
- **数据清理**: 提供数据清理和优化工具

## 📦 安装方式

### 方式一：下载预编译版本（推荐）

1. 访问 [Releases 页面](https://github.com/Adsryen/JavdBviewed/releases)
2. 下载最新版本的 `javdb-extension-v*.zip` 文件
3. 解压到本地文件夹
4. 打开浏览器扩展管理页面：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
5. 开启"开发者模式"
6. 点击"加载已解压的扩展程序"，选择解压后的文件夹

### 方式二：油猴脚本版本（停止维护）

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 下载 `Tampermonkey/javdb.js` 文件
3. 在 Tampermonkey 管理面板中导入脚本

## 📚 使用说明

### 基本操作

#### 标记视频状态
1. **在列表页**: 点击视频项目上的标记按钮
2. **在详情页**: 使用页面上的快速操作按钮
3. **批量操作**: 在设置面板中进行批量管理

#### 设置同步
1. 点击扩展图标打开弹窗
2. 点击"设置"进入设置面板
3. 在"数据同步"选项卡中配置 WebDAV
4. 输入服务器地址、用户名和密码
5. 点击"测试连接"验证配置
6. 启用自动同步

#### 数据管理
- **导出数据**: 设置面板 → 数据管理 → 导出数据
- **导入数据**: 设置面板 → 数据管理 → 导入数据
- **查看统计**: 设置面板 → 统计信息

### 高级功能

#### 自定义显示
- 在设置面板中可以自定义标记颜色
- 调整标记显示位置和样式
- 设置隐藏已观看视频的选项

#### 快捷键支持
- `Ctrl + Shift + M`: 快速标记当前视频为已观看
- `Ctrl + Shift + W`: 快速标记当前视频为想看

## 🛠️ 二次开发指南

### 开发环境准备

#### 系统要求
- Node.js 18+
- npm 或 pnpm
- Git

#### 克隆项目
```bash
git clone https://github.com/Adsryen/JavdBviewed.git
cd JavdBviewed
```

### 项目结构

```
JavdBviewed/
├── javdb-extension/          # 主要开发目录 (TypeScript + Vite)
│   ├── src/                  # 源代码
│   │   ├── background/       # Service Worker 后台脚本
│   │   ├── content/          # 内容脚本 (注入到页面)
│   │   ├── popup/            # 扩展弹窗界面
│   │   ├── dashboard/        # 设置面板
│   │   ├── utils/            # 工具函数
│   │   └── types/            # TypeScript 类型定义
│   ├── scripts/              # 构建脚本
│   └── dist/                 # 编译输出目录
├── Tampermonkey/             # 油猴脚本版本
└── reference/                # 参考资料
```

### 开发流程

#### 1. 安装依赖
```bash
cd javdb-extension
npm install
# 或使用 pnpm
pnpm install
```

#### 2. 开发模式
```bash
# 构建开发版本
npm run build

# 监听文件变化并自动重新构建
npm run dev  # 如果有此命令
```

#### 3. 加载扩展进行测试
1. 构建完成后，`dist` 目录包含可加载的扩展文件
2. 在浏览器中加载 `dist` 目录作为未打包的扩展
3. 修改源代码后重新运行 `npm run build`
4. 在扩展管理页面点击刷新按钮

#### 4. 打包发布
```bash
# 创建发布版本的 zip 包
npm run build
```
打包后的文件位于 `dist-zip/` 目录中。

### 核心模块说明

#### 内容脚本 (Content Scripts)
- **位置**: `src/content/`
- **功能**: 注入到 JavDB 页面，处理 DOM 操作和用户交互
- **主要文件**:
  - `index.ts`: 主入口文件
  - `itemProcessor.ts`: 处理视频项目标记
  - `videoDetail.ts`: 处理视频详情页
  - `statusManager.ts`: 管理视频状态
  - `concurrency.ts`: 并发控制

#### 后台脚本 (Background Scripts)
- **位置**: `src/background/`
- **功能**: 处理扩展后台任务和数据同步
- **主要文件**:
  - `background.ts`: 主后台脚本
  - `sync.ts`: WebDAV 同步功能

#### 弹窗界面 (Popup)
- **位置**: `src/popup/`
- **功能**: 扩展的快速操作界面
- **文件**: `popup.html`, `popup.ts`, `popup.css`

#### 设置面板 (Dashboard)
- **位置**: `src/dashboard/`
- **功能**: 完整的设置和数据管理界面
- **主要功能**: 数据导入导出、WebDAV 配置、显示设置

#### 工具函数 (Utils)
- **位置**: `src/utils/`
- **主要文件**:
  - `storage.ts`: 数据存储管理
  - `config.ts`: 配置管理
  - `statusPriority.ts`: 状态优先级处理

### 开发技巧

#### 1. 调试方法
```javascript
// 在内容脚本中使用 console.log
console.log('Debug info:', data);

// 在后台脚本中调试
chrome.action.setBadgeText({text: 'DEBUG'});
```

#### 2. 存储数据
```typescript
import { setValue, getValue } from '../utils/storage';

// 保存数据
await setValue('key', data);

// 读取数据
const data = await getValue('key', defaultValue);
```

#### 3. 添加新功能
1. 在相应模块中添加功能代码
2. 更新 TypeScript 类型定义 (`src/types/index.ts`)
3. 如需新的权限，更新 `manifest.json`
4. 添加相应的测试代码

#### 4. 样式修改
- 内容脚本样式：直接在 TypeScript 文件中使用 `style` 属性
- 弹窗样式：修改 `popup.css`
- 设置面板样式：修改 `dashboard/` 目录下的 CSS 文件

### 常见问题

#### Q: 修改代码后扩展没有更新？
A: 确保重新运行了 `npm run build`，然后在扩展管理页面刷新扩展。

#### Q: 如何添加新的 WebDAV 服务支持？
A: 在 `manifest.json` 的 `host_permissions` 中添加新域名，然后在同步模块中添加相应逻辑。

#### Q: 如何优化性能？
A: 查看 `concurrency.ts` 模块，了解现有的并发控制机制，避免过度的 DOM 操作。

#### Q: 如何添加新的视频状态？
A: 在 `src/types/index.ts` 中更新 `VideoStatus` 类型，然后在 `statusPriority.ts` 中添加相应的优先级逻辑。

### 架构说明

#### 数据流
1. **用户操作** → 内容脚本捕获
2. **内容脚本** → 通过 Chrome API 与后台脚本通信
3. **后台脚本** → 处理数据存储和同步
4. **存储层** → 本地存储 + WebDAV 云端同步

#### 并发控制
项目使用了先进的并发控制机制来确保数据一致性：
- **存储管理器**: 防止同时写入冲突
- **并发监控**: 实时监控并发操作
- **队列机制**: 确保操作按顺序执行

#### 性能优化
- **懒加载**: 只在需要时加载模块
- **缓存机制**: 减少重复的 DOM 查询
- **批量操作**: 合并多个存储操作
- **防抖处理**: 避免频繁的状态更新

### 最佳实践

#### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 保持函数单一职责
- 添加适当的注释和文档

#### 错误处理
```typescript
try {
    await someAsyncOperation();
} catch (error) {
    console.error('Operation failed:', error);
    // 适当的错误恢复逻辑
}
```

#### 内存管理
- 及时清理事件监听器
- 避免内存泄漏
- 使用 WeakMap 存储临时数据

#### 测试策略
- 单元测试：测试核心逻辑
- 集成测试：测试模块间交互
- 手动测试：在真实环境中验证功能

### 贡献指南

1. Fork 本项目
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

### 版本发布

1. 更新版本号：
   ```bash
   npm version patch  # 或 minor, major
   ```
2. 构建发布版本：
   ```bash
   npm run build
   ```
3. 创建 GitHub Release 并上传 zip 文件

## 📄 许可证

本项目采用 [GPL-3.0](LICENSE) 许可证。

## 🤝 支持

如有问题或建议，请：
- 提交 [Issue](https://github.com/Adsryen/JavdBviewed/issues)
- 发起 [Discussion](https://github.com/Adsryen/JavdBviewed/discussions)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

</div>