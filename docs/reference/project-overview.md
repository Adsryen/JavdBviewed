# 项目概览

本页整理自仓库根目录 `README.md`，保留适合进入文档中心的技术与使用信息，作为站内统一入口。

## 项目简介

Jav 助手是一个面向 JavDB 等站点的浏览器扩展，提供视频状态标记、数据管理、WebDAV 同步、115 网盘推送、演员管理、页面增强、AI 翻译等能力。

## 核心能力

- 视频标记：已浏览、已观看、想看三种状态与优先级显示
- 数据管理：番号库、演员库、导入导出与统计
- 云端同步：WebDAV 多设备同步
- 115 网盘：磁力推送、验证与自动标记
- 页面增强：详情页、列表页、过滤与预览优化
- 开发扩展：模块化源码结构与构建脚本

## 安装方式

### 前置要求

- Chromium 内核浏览器，如 Chrome、Edge
- 若使用 115 功能，需要已登录的 115 账号

### 下载预编译版本

1. 打开 [GitHub Releases](https://github.com/Adsryen/JavdBviewed/releases)
2. 下载最新的 `javdb-extension-v*.zip`
3. 解压到本地目录
4. 打开扩展管理页：`chrome://extensions/` 或 `edge://extensions/`
5. 开启开发者模式并加载解压后的目录

如需先了解版本节奏与最近更新，可先阅读 [版本发布](/reference/changelog)。

## 使用入口

- 新用户建议先阅读 [快速开始](/guide/quick-start)
- 功能细节请查看 [使用教程](/guide/)
- 版本历史请查看 [版本发布](/reference/changelog)
- 完整能力清单请查看 [功能总览](/reference/features)
- 需要源码级说明时进入 [开发文档](/developer/)

## 开发相关

- 构建命令：`npm run build`
- 文档开发：`npm run docs:dev`
- 文档构建：`npm run docs:build`

## 相关页面

- [版本发布](/reference/changelog)
- [功能总览](/reference/features)
- [隐私政策](/reference/privacy-policy)
- [二次开发指南](/developer/development)
