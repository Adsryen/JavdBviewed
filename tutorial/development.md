# 二次开发指南

本指南帮助开发者了解项目结构，进行二次开发和功能扩展。

## 开发环境

### 系统要求

- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本（或使用 pnpm）
- **Git**: 用于版本控制
- **代码编辑器**: 推荐 VS Code

### 克隆项目

```bash
git clone https://github.com/Adsryen/JavdBviewed.git
cd JavdBviewed
```

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

### 构建项目

```bash
# 开发构建
npm run build

# 生产构建
npm run build:prod

# 监听模式（自动重新构建）
npm run watch
```

### 加载扩展

1. 构建完成后，`dist` 目录包含可加载的扩展文件
2. 打开浏览器扩展管理页面
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 目录

## 项目结构

```
JavdBviewed/
├── src/                      # 源代码
│   ├── background/           # Service Worker 后台脚本
│   │   ├── background.ts     # 主入口
│   │   ├── db.ts            # 数据库操作
│   │   ├── dbRouter.ts      # 数据库路由
│   │   ├── sync.ts          # WebDAV 同步
│   │   ├── webdav.ts        # WebDAV 客户端
│   │   └── ...
│   ├── content/              # 内容脚本
│   │   ├── index.ts         # 主入口
│   │   ├── state.ts         # 状态管理
│   │   ├── videoDetail.ts   # 详情页功能
│   │   ├── statusManager.ts # 状态管理器
│   │   ├── enhancements/    # 页面增强
│   │   └── ...
│   ├── popup/                # 扩展弹窗
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── dashboard/            # 设置面板
│   │   ├── dashboard.html
│   │   ├── dashboard.ts
│   │   ├── components/      # UI 组件
│   │   └── ui/              # UI 工具
│   ├── services/             # 业务服务层
│   │   ├── actorManager.ts  # 演员管理
│   │   ├── syncService.ts   # 同步服务
│   │   └── ...
│   ├── components/           # 可复用组件
│   ├── utils/                # 工具函数
│   │   ├── config.ts        # 配置常量
│   │   ├── storage.ts       # 存储工具
│   │   └── ...
│   ├── types/                # TypeScript 类型定义
│   │   └── index.ts
│   └── assets/               # 静态资源
├── scripts/                  # 构建脚本
│   ├── build.ts             # 构建脚本
│   └── ...
├── public/                   # 公共资源
├── dist/                     # 编译输出
├── docs/                     # 项目文档
├── tutorial/                 # 使用教程
├── manifest.json             # 扩展清单
├── package.json              # 项目配置
└── tsconfig.json             # TypeScript 配置
```

## 核心模块

### Background (后台脚本)

Service Worker，处理后台任务：

- **数据库操作**: IndexedDB 数据存储
- **消息路由**: 处理来自 content 和 popup 的消息
- **WebDAV 同步**: 云端数据同步
- **115网盘**: 磁力推送功能
- **定时任务**: 新作品检测等

**主要文件**:
- `background.ts`: 主入口，消息监听
- `db.ts`: 数据库操作封装
- `dbRouter.ts`: 消息路由处理
- `sync.ts`: 同步逻辑

### Content (内容脚本)

注入到 JavDB 页面的脚本：

- **状态管理**: 视频标记状态
- **页面增强**: 列表页和详情页增强
- **UI 组件**: 标记按钮、预览等
- **事件处理**: 用户交互

**主要文件**:
- `index.ts`: 主入口，初始化
- `state.ts`: 全局状态管理
- `videoDetail.ts`: 详情页功能
- `statusManager.ts`: 状态管理器
- `enhancements/`: 各种页面增强

### Dashboard (设置面板)

扩展的设置和管理界面：

- **数据展示**: 番号库、演员库
- **设置配置**: 各种功能设置
- **数据管理**: 导入导出、同步
- **统计分析**: 数据可视化

**主要文件**:
- `dashboard.ts`: 主入口
- `components/`: UI 组件
- `ui/`: UI 工具函数

### Services (服务层)

业务逻辑封装：

- **actorManager**: 演员管理
- **syncService**: 同步服务
- **newWorksService**: 新作品检测

## 数据存储

### IndexedDB

使用 IndexedDB 存储数据：

```typescript
// 数据库结构
{
  viewed: {
    keyPath: 'id',
    indexes: ['status', 'createdAt', 'updatedAt']
  },
  actors: {
    keyPath: 'id',
    indexes: ['name', 'category']
  },
  newWorks: {
    keyPath: 'id',
    indexes: ['actorId', 'detectedAt']
  }
}
```

### Chrome Storage

使用 Chrome Storage API 存储配置：

```typescript
// 存储设置
chrome.storage.local.set({ settings: {...} });

// 读取设置
chrome.storage.local.get(['settings'], (result) => {
  const settings = result.settings;
});
```

## 消息通信

### Content → Background

```typescript
// 发送消息
chrome.runtime.sendMessage({
  type: 'DB:VIEWED_PUT',
  payload: { record: {...} }
}, (response) => {
  console.log(response);
});
```

### Background 处理

```typescript
// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DB:VIEWED_PUT') {
    // 处理逻辑
    sendResponse({ success: true });
  }
  return true; // 异步响应
});
```

## 开发规范

### 代码风格

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化
- 添加必要的注释

### 命名规范

- **文件名**: kebab-case（如：`video-detail.ts`）
- **类名**: PascalCase（如：`VideoManager`）
- **函数名**: camelCase（如：`getVideoId`）
- **常量**: UPPER_SNAKE_CASE（如：`VIDEO_STATUS`）

### 类型定义

在 `src/types/index.ts` 中定义类型：

```typescript
export interface VideoRecord {
  id: string;
  title: string;
  status: VideoStatus;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
```

### 错误处理

使用 try-catch 处理错误：

```typescript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw error;
}
```

## 添加新功能

### 1. 规划功能

- 确定功能需求
- 设计数据结构
- 规划用户界面
- 考虑性能影响

### 2. 创建文件

```bash
# 创建功能文件
touch src/content/myFeature.ts

# 创建类型定义
# 在 src/types/index.ts 中添加类型
```

### 3. 实现功能

```typescript
// src/content/myFeature.ts
export class MyFeature {
  async init() {
    // 初始化逻辑
  }
  
  async doSomething() {
    // 功能实现
  }
}
```

### 4. 集成功能

```typescript
// src/content/index.ts
import { MyFeature } from './myFeature';

const myFeature = new MyFeature();
await myFeature.init();
```

### 5. 添加设置

```typescript
// 在 dashboard 中添加设置界面
// 在 settings 中添加配置项
```

### 6. 测试功能

- 手动测试功能
- 测试边界情况
- 测试性能影响
- 测试兼容性

## 调试技巧

### Console 日志

```typescript
// 使用统一的日志函数
import { log } from './state';

log('Debug message:', data);
```

### Chrome DevTools

1. 打开扩展管理页面
2. 点击"检查视图"
3. 使用 Console、Network、Sources 等工具

### 断点调试

1. 在 Sources 面板中打开文件
2. 设置断点
3. 触发功能
4. 单步调试

### 性能分析

1. 使用 Performance 面板
2. 记录性能数据
3. 分析瓶颈
4. 优化代码

## 构建和发布

### 构建生产版本

```bash
npm run build:prod
```

### 打包扩展

```bash
# 创建 zip 包
cd dist
zip -r ../javdb-extension-v1.0.0.zip *
```

### 版本管理

1. 更新 `manifest.json` 中的版本号
2. 更新 `package.json` 中的版本号
3. 创建 Git 标签
4. 编写更新日志

### 发布流程

1. 测试所有功能
2. 构建生产版本
3. 创建 GitHub Release
4. 上传 zip 包
5. 编写 Release Notes

## 贡献指南

### 提交 Pull Request

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到 Fork
5. 创建 Pull Request

### Commit 规范

使用语义化提交信息：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具变动
```

### 代码审查

- 确保代码符合规范
- 添加必要的注释
- 测试功能是否正常
- 检查性能影响

## 常见问题

### 构建失败？

检查：
1. Node.js 版本
2. 依赖是否安装完整
3. TypeScript 配置
4. 查看错误信息

### 扩展加载失败？

检查：
1. manifest.json 是否正确
2. 文件路径是否正确
3. 权限配置是否完整

### 功能不生效？

检查：
1. 内容脚本是否注入
2. 消息通信是否正常
3. 查看控制台错误
4. 检查权限配置

## 参考资源

- [Chrome Extension 文档](https://developer.chrome.com/docs/extensions/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [IndexedDB 文档](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [项目 GitHub](https://github.com/Adsryen/JavdBviewed)

---

[返回目录](./README.md) | [上一篇：AI翻译](./ai-translation.md)
