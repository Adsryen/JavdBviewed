# JavdBviewed

<div align="center">

![Jav 助手](src/assets/favicons/light/favicon-128x128.png)

**Jav 视频浏览助手**

[![GitHub release](https://img.shields.io/github/v/release/Adsryen/JavdBviewed)](https://github.com/Adsryen/JavdBviewed/releases)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://github.com/Adsryen/JavdBviewed/releases)

</div>

## 📖 简介

Jav 助手是一个功能强大的浏览器扩展，专为 JavDB 等Jav视频网站设计。它能够在列表页和详情页标记视频的"已浏览"或"我看过"状态，并提供丰富的数据管理功能，包括 WebDAV 同步、数据导入导出、115网盘推送等高级特性。

📚 **[查看详细使用教程](https://javd-bviewed-docs.vercel.app/guide/)** - 包含完整的功能说明和使用指南

---
### ⭐ 如果您觉得这个项目对您有帮助，请给它一个 Star！

**您的支持是我持续维护和改进的最大动力 💪**

---

> **⚠️ 重要提示**
> 
> 本扩展仅供**年满18周岁的成年用户**使用。
> 
> - 🔞 本扩展涉及的内容相关功能，请确保您已达到所在地区的法定成年年龄
> - 🚫 请勿在未成年人可访问的设备上安装或使用本扩展
> - 🔒 建议启用扩展内置的隐私保护功能，保护个人隐私
> 
> **开发者不对用户的使用行为承担任何责任，请合法合规使用。**

## ✨ 核心功能

- 🎯 **视频标记** - 已浏览、已观看、想看三种状态标记，智能优先级显示
- 📚 **数据管理** - 番号库、演员库管理，支持导入导出和统计分析
- ☁️ **云端同步** - WebDAV 自动同步，支持多设备数据一致性
- 💾 **115网盘** - 一键推送磁力链接，自动验证和标记
- 🎨 **页面增强** - 列表预览、详情增强、智能过滤和隐藏
- 👥 **演员管理** - 演员收藏、订阅、黑名单和智能过滤
- 🆕 **新作品监控** - 自动检测新作品，智能过滤和批量操作
- 🔍 **磁力搜索** - 多源自动搜索，支持自定义搜索引擎
- 🔒 **隐私保护** - 截图模糊模式，保护敏感信息
- 📊 **数据分析** - 观看统计和可视化报告（测试中）
- 🎬 **Emby增强** - Emby服务器集成和快捷跳转
- 🤖 **AI翻译** - 支持多种AI模型的内容翻译

> 📖 **查看完整功能清单**: [FEATURES.md](https://javd-bviewed-docs.vercel.app/reference/features) - 包含所有功能的详细说明和状态

## 🖼️ 界面预览（以实际为准，不会及时更新）

### 首页数据图表
<div align="center">
<img src="assets/1.png" alt="首页数据图表" width="800">
<p><em>首页 - 数据统计和可视化图表，一目了然查看观看记录</em></p>
</div>

### 番号库管理
<div align="center">
<img src="assets/2.png" alt="番号库管理" width="800">
<p><em>番号库 - 管理和查看已标记的视频番号</em></p>
</div>

### 演员库管理
<div align="center">
<img src="assets/3.png" alt="演员库管理" width="800">
<p><em>演员库 - 演员信息管理和分类功能</em></p>
</div>

### 新作品监控
<div align="center">
<img src="assets/4.png" alt="新作品监控" width="800">
<p><em>新作品 - 自动监控和订阅感兴趣的新发布内容</em></p>
</div>

### 115网盘任务
<div align="center">
<img src="assets/5.png" alt="115网盘任务" width="800">
<p><em>115任务 - 磁力推送任务管理和状态监控</em></p>
</div>

### 扩展设置面板
<div align="center">
<img src="assets/6.png" alt="扩展设置面板" width="800">
<p><em>设置面板 - 完整的配置选项和功能开关</em></p>
</div>

## 📦 安装方式

### 前置要求

- **基本功能**: 支持 Chrome、Edge 等基于 Chromium 的浏览器
- **115网盘功能**: 需要已登录的115网盘账号（在 https://115.com 登录）

### 方式一：下载预编译版本（推荐）

> **📢 关于 Chrome 应用商店发布说明**
> 
> 根据 Chrome Web Store 开发者计划政策第 2.7 条规定：
> 
> > **2.7 Adult Content**  
> > *The extension contains content that is pornographic or sexually explicit.*  
> > （扩展包含色情或性暗示内容）
> 
> 
> 用户需要通过以下方式手动安装本扩展。在 GitHub Releases 页面提供最新版本的更新。

**安装步骤：**

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

#### 115网盘推送
1. **启用功能**: 设置面板 → 115网盘 → 启用115网盘功能
2. **配置设置**: 设置下载目录和其他选项
3. **推送磁链**: 在视频详情页点击磁力链接旁的"推送115"按钮
4. **自动标记**: 推送成功后视频会自动标记为已观看

#### 数据管理
- **导出数据**: 设置面板 → 数据管理 → 导出数据
- **导入数据**: 设置面板 → 数据管理 → 导入数据
- **查看统计**: 设置面板 → 统计信息

## 🛠️ 二次开发与部署

技术文档现已统一迁移到在线文档中心：

- [二次开发指南](https://javd-bviewed-docs.vercel.app/developer/development)
- [架构说明](https://javd-bviewed-docs.vercel.app/developer/architecture)
- [开发文档首页](https://javd-bviewed-docs.vercel.app/developer/)

### 部署与打包

#### 本地构建扩展
```bash
npm install
npm run build
```

构建完成后，将 `dist` 目录作为未打包扩展加载到浏览器中。

#### 文档站本地预览
```bash
npm run docs:dev
```

#### 文档站构建
```bash
npm run docs:build
```

#### 发布扩展
1. 更新版本号：
   ```bash
   npm version patch
   ```
2. 构建发布版本：
   ```bash
   npm run build
   ```
3. 创建 GitHub Release 并上传打包产物

## 📄 许可证

本项目采用 [GPL-3.0](LICENSE) 许可证。

## 🤝 支持与反馈

如有问题或建议，欢迎通过以下方式联系：
- 💬 提交 [Issue](https://github.com/Adsryen/JavdBviewed/issues) - 报告问题或提出功能建议
- 🗨️ 发起 [Discussion](https://github.com/Adsryen/JavdBviewed/discussions) - 参与讨论和交流

---

<div align="center">

### ⭐ 如果您觉得这个项目对您有帮助，请给它一个 Star！

**您的支持是我持续维护和改进的最大动力 💪**

[![Star History Chart](https://api.star-history.com/svg?repos=Adsryen/JavdBviewed&type=Date)](https://star-history.com/#Adsryen/JavdBviewed&Date)

</div>
