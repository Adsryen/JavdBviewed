# Jellyfin API 文档（12.0.0）

> **主目录名含版本号**：`reference/jellyfin-api-12.0.0/`
> 官方稳定 OpenAPI：https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json
> OpenAPI `info.version=12.0.0`

按 `reference/openai-115` / Emby 文档的风格：

- **中文分类目录**
- **文件名带中文注释**（如 `系统信息-System.md`）
- 内容由 **Jellyfin 官方** OpenAPI 生成

## 来源（权威 · 12.0.0）

1. **OpenAPI 3 规范**：[`openapi.json`](./openapi.json)
   - 下载自：https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json
   - 备份：[`openapi-from-official-stable-12.0.0.json`](./openapi-from-official-stable-12.0.0.json)
   - 标题：Jellyfin API
   - 版本：12.0.0
2. **官方索引**：https://api.jellyfin.org/openapi/
3. **文档站**：https://jellyfin.org/docs/
4. **Emby 对照文档**（另一套，勿混）：`reference/emby-api-4.9.5.0/`

## 统计

- API 版本：12.0.0
- Path 数：294
- Operation 数：364
- Schema 数：357
- Tag/服务数：46
- 分类数：9

## 目录结构

```
reference/jellyfin-api-12.0.0/
├── README.md
├── 认证.md
├── 常用接口.md
├── schemas.md
├── openapi.json
├── _generate.cjs
├── 接入认证/
├── 系统管理/
├── 媒体库与条目/
├── 元数据与分类/
├── 播放与流媒体/
├── 图像/
├── 直播电视/
├── 播放列表与同步/
└── 用户与偏好/
```

## 分类一览

| 分类 | 说明 | 服务数 |
| --- | --- | ---: |
| 接入认证 | 登录、Token、设备、认证 | 3 |
| 系统管理 | 服务器信息、配置、环境、插件、计划任务、备份 | 8 |
| 媒体库与条目 | 媒体库浏览、条目查询/更新/检索、搜索、合集、视图 | 8 |
| 元数据与分类 | 电影/剧集/人物/类型/标签/推荐等 | 10 |
| 播放与流媒体 | 音视频流、会话遥控、字幕、同步播放、预览图 | 10 |
| 图像 | 封面/海报/远程图像 | 2 |
| 直播电视 | Live TV、频道 | 2 |
| 播放列表与同步 | Playlist | 1 |
| 用户与偏好 | 显示偏好、用户数据 | 2 |

## 按分类的服务列表

### 接入认证

登录、Token、设备、认证

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 认证 | `Authentication` | 13 | [认证-Authentication.md](./接入认证/认证-Authentication.md) |
| 设备管理 | `Device` | 5 | [设备管理-Device.md](./接入认证/设备管理-Device.md) |
| 用户管理 | `User` | 10 | [用户管理-User.md](./接入认证/用户管理-User.md) |

### 系统管理

服务器信息、配置、环境、插件、计划任务、备份

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 备份 | `Backup` | 4 | [备份-Backup.md](./系统管理/备份-Backup.md) |
| 本地化 | `Localization` | 4 | [本地化-Localization.md](./系统管理/本地化-Localization.md) |
| 插件管理 | `Plugin` | 17 | [插件管理-Plugin.md](./系统管理/插件管理-Plugin.md) |
| 计划任务 | `ScheduledTask` | 5 | [计划任务-ScheduledTask.md](./系统管理/计划任务-ScheduledTask.md) |
| 品牌定制 | `Branding` | 3 | [品牌定制-Branding.md](./系统管理/品牌定制-Branding.md) |
| 启动向导 | `Startup` | 7 | [启动向导-Startup.md](./系统管理/启动向导-Startup.md) |
| 系统信息 | `System` | 19 | [系统信息-System.md](./系统管理/系统信息-System.md) |
| 运行环境 | `Environment` | 5 | [运行环境-Environment.md](./系统管理/运行环境-Environment.md) |

### 媒体库与条目

媒体库浏览、条目查询/更新/检索、搜索、合集、视图

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 合集 | `Collection` | 3 | [合集-Collection.md](./媒体库与条目/合集-Collection.md) |
| 媒体库结构 | `LibraryStructure` | 8 | [媒体库结构-LibraryStructure.md](./媒体库与条目/媒体库结构-LibraryStructure.md) |
| 媒体库与条目 | `Library` | 34 | [媒体库与条目-Library.md](./媒体库与条目/媒体库与条目-Library.md) |
| 筛选器 | `Filter` | 2 | [筛选器-Filter.md](./媒体库与条目/筛选器-Filter.md) |
| 搜索 | `Search` | 1 | [搜索-Search.md](./媒体库与条目/搜索-Search.md) |
| 条目更新 | `ItemUpdate` | 3 | [条目更新-ItemUpdate.md](./媒体库与条目/条目更新-ItemUpdate.md) |
| 条目元数据检索 | `ItemLookup` | 11 | [条目元数据检索-ItemLookup.md](./媒体库与条目/条目元数据检索-ItemLookup.md) |
| 用户视图 | `UserView` | 2 | [用户视图-UserView.md](./媒体库与条目/用户视图-UserView.md) |

### 元数据与分类

电影/剧集/人物/类型/标签/推荐等

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 电视剧 | `Show` | 4 | [电视剧-Show.md](./元数据与分类/电视剧-Show.md) |
| 电影 | `Movie` | 1 | [电影-Movie.md](./元数据与分类/电影-Movie.md) |
| 类型标签 | `Genre` | 2 | [类型标签-Genre.md](./元数据与分类/类型标签-Genre.md) |
| 年份 | `Year` | 2 | [年份-Year.md](./元数据与分类/年份-Year.md) |
| 人物 | `Person` | 2 | [人物-Person.md](./元数据与分类/人物-Person.md) |
| 推荐 | `Suggestion` | 1 | [推荐-Suggestion.md](./元数据与分类/推荐-Suggestion.md) |
| 艺术家 | `Artist` | 3 | [艺术家-Artist.md](./元数据与分类/艺术家-Artist.md) |
| 音乐类型 | `MusicGenre` | 1 | [音乐类型-MusicGenre.md](./元数据与分类/音乐类型-MusicGenre.md) |
| 预告片 | `Trailer` | 1 | [预告片-Trailer.md](./元数据与分类/预告片-Trailer.md) |
| 制片厂 | `Studio` | 2 | [制片厂-Studio.md](./元数据与分类/制片厂-Studio.md) |

### 播放与流媒体

音视频流、会话遥控、字幕、同步播放、预览图

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 歌词 | `Lyric` | 6 | [歌词-Lyric.md](./播放与流媒体/歌词-Lyric.md) |
| 会话与遥控 | `Session` | 18 | [会话与遥控-Session.md](./播放与流媒体/会话与遥控-Session.md) |
| 即时混播 | `InstantMix` | 7 | [即时混播-InstantMix.md](./播放与流媒体/即时混播-InstantMix.md) |
| 媒体片段 | `MediaSegment` | 1 | [媒体片段-MediaSegment.md](./播放与流媒体/媒体片段-MediaSegment.md) |
| 媒体信息 | `MediaInfo` | 5 | [媒体信息-MediaInfo.md](./播放与流媒体/媒体信息-MediaInfo.md) |
| 视频流 | `Video` | 8 | [视频流-Video.md](./播放与流媒体/视频流-Video.md) |
| 同步播放 | `SyncPlay` | 22 | [同步播放-SyncPlay.md](./播放与流媒体/同步播放-SyncPlay.md) |
| 音频流 | `Audio` | 6 | [音频流-Audio.md](./播放与流媒体/音频流-Audio.md) |
| 预览图轨 | `TrickPlay` | 2 | [预览图轨-TrickPlay.md](./播放与流媒体/预览图轨-TrickPlay.md) |
| 字幕 | `Subtitle` | 10 | [字幕-Subtitle.md](./播放与流媒体/字幕-Subtitle.md) |

### 图像

封面/海报/远程图像

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 图像资源 | `Image` | 37 | [图像资源-Image.md](./图像/图像资源-Image.md) |
| 远程图像 | `RemoteImage` | 3 | [远程图像-RemoteImage.md](./图像/远程图像-RemoteImage.md) |

### 直播电视

Live TV、频道

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 频道 | `Channel` | 5 | [频道-Channel.md](./直播电视/频道-Channel.md) |
| 直播电视 | `LiveTv` | 38 | [直播电视-LiveTv.md](./直播电视/直播电视-LiveTv.md) |

### 播放列表与同步

Playlist

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 播放列表 | `Playlist` | 11 | [播放列表-Playlist.md](./播放列表与同步/播放列表-Playlist.md) |

### 用户与偏好

显示偏好、用户数据

| 中文 | Tag | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 显示偏好 | `DisplayPreference` | 2 | [显示偏好-DisplayPreference.md](./用户与偏好/显示偏好-DisplayPreference.md) |
| 用户数据 | `UserData` | 8 | [用户数据-UserData.md](./用户与偏好/用户数据-UserData.md) |

## 与本项目的关系

当前扩展媒体库同步主要通过 Token/ApiKey 调用：

```http
GET {server}/Items?Recursive=true&IncludeItemTypes=Movie&Fields=Path,PrimaryImageAspectRatio,ImageTags&api_key=***
```

配置里 `type: 'jellyfin'` 时走同一套 Items 查询逻辑，但请以 **本 Jellyfin 文档** 校验字段与鉴权细节。

## 重新生成

```powershell
curl.exe -L -o reference/jellyfin-api-12.0.0/openapi.json "https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json"
node reference/jellyfin-api-12.0.0/_generate.cjs
```

大版本升级时，建议改名为 `reference/jellyfin-api-<新版本>/`。
