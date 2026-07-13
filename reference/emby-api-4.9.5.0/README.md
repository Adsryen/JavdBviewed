# Emby Server API 文档（4.9.5.0）

> **主目录名含版本号**：`reference/emby-api-4.9.5.0/`
> 对应服务端：`http://47.108.74.231:38096` · OpenAPI `info.version=4.9.5.0`

按 `reference/openai-115` 的风格：

- **中文分类目录**（如「媒体库与条目」「播放与流媒体」）
- **文件名带中文注释**（如 `条目查询-ItemsService.md`）
- 内容由 **该版本服务器官方** OpenAPI 生成（不是过时的公共 4.1.1 镜像）

## 来源（权威 · 4.9.5.0）

1. **OpenAPI 3 规范（原始文件）**：[`openapi.json`](./openapi.json)
   - 抓取自：`GET http://47.108.74.231:38096/openapi.json`
   - 备份副本：[`openapi-from-server-4.9.5.0.json`](./openapi-from-server-4.9.5.0.json)
   - 标题：Emby Server REST API
   - 版本：4.9.5.0（与 `/System/Info/Public` 一致）
2. **服务器规范入口**：`GET {server}/openapi.json` / `GET {server}/swagger.json`
3. **开发者门户（概念文档）**：https://dev.emby.media/
4. **公共 Swagger 镜像已过时**（仍为 4.1.1.0，勿再当权威）：https://swagger.emby.media/openapi.json

> 升级 Server 后：重新拉取 openapi，建议把本目录改名为 `emby-api-<新版本>`，再运行 `node _generate.cjs`。

## 统计

- Emby 版本：4.9.5.0
- Path 数：425
- Operation 数：538
- Schema 数：338
- Service 数：71
- 分类数：11

## 目录结构

```
reference/emby-api-4.9.5.0/
├── README.md
├── 认证.md
├── 常用接口.md
├── schemas.md
├── openapi.json
├── openapi-from-server-4.9.5.0.json
├── _generate.cjs
├── 接入认证/
│   ├── 用户管理-UserService.md
│   └── ...
├── 系统管理/
├── 媒体库与条目/
│   └── 条目查询-ItemsService.md   ← 本项目主要用这个
├── 元数据与分类/
├── 播放与流媒体/
├── 图像/
├── 直播电视/
├── 播放列表与同步/
├── 通知与活动/
├── DLNA/
└── 用户与偏好/
```

## 分类一览

| 分类 | 说明 | 服务数 |
| --- | --- | ---: |
| 接入认证 | 登录、Token、设备、OpenAPI、Connect | 4 |
| 系统管理 | 服务器信息、配置、环境、插件、计划任务 | 18 |
| 媒体库与条目 | 媒体库浏览、条目查询/更新/检索、搜索、合集 | 10 |
| 元数据与分类 | 电影/剧集/人物/类型/标签/推荐等 | 12 |
| 播放与流媒体 | 音视频流、HLS、播放状态、会话遥控、字幕 | 14 |
| 图像 | 封面/海报/远程图像 | 2 |
| 直播电视 | Live TV、频道 | 3 |
| 播放列表与同步 | Playlist、Sync | 2 |
| 通知与活动 | 通知、活动日志、报表、用户活动 | 3 |
| DLNA | DLNA 服务与配置 | 2 |
| 用户与偏好 | 显示偏好等用户侧设置 | 1 |

## 按分类的服务列表

### 接入认证

登录、Token、设备、OpenAPI、Connect

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 设备管理 | `DeviceService` | 8 | [设备管理-DeviceService.md](./接入认证/设备管理-DeviceService.md) |
| 用户管理 | `UserService` | 21 | [用户管理-UserService.md](./接入认证/用户管理-UserService.md) |
| EmbyConnect连接 | `ConnectService` | 5 | [EmbyConnect连接-ConnectService.md](./接入认证/EmbyConnect连接-ConnectService.md) |
| OpenAPI规范 | `OpenApiService` | 4 | [OpenAPI规范-OpenApiService.md](./接入认证/OpenAPI规范-OpenApiService.md) |

### 系统管理

服务器信息、配置、环境、插件、计划任务

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 备份 | `BackupApi` | 3 | [备份-BackupApi.md](./系统管理/备份-BackupApi.md) |
| 本地化 | `LocalizationService` | 4 | [本地化-LocalizationService.md](./系统管理/本地化-LocalizationService.md) |
| 编解码参数 | `CodecParameterService` | 2 | [编解码参数-CodecParameterService.md](./系统管理/编解码参数-CodecParameterService.md) |
| 插件包 | `PackageService` | 6 | [插件包-PackageService.md](./系统管理/插件包-PackageService.md) |
| 插件管理 | `PluginService` | 6 | [插件管理-PluginService.md](./系统管理/插件管理-PluginService.md) |
| 服务器端点 | `ServerEndpoint` | 3 | [服务器端点-ServerEndpoint.md](./系统管理/服务器端点-ServerEndpoint.md) |
| 服务器配置 | `ConfigurationService` | 5 | [服务器配置-ConfigurationService.md](./系统管理/服务器配置-ConfigurationService.md) |
| 功能特性 | `FeatureService` | 1 | [功能特性-FeatureService.md](./系统管理/功能特性-FeatureService.md) |
| 计划任务 | `ScheduledTaskService` | 6 | [计划任务-ScheduledTaskService.md](./系统管理/计划任务-ScheduledTaskService.md) |
| 品牌定制 | `BrandingService` | 3 | [品牌定制-BrandingService.md](./系统管理/品牌定制-BrandingService.md) |
| 色调映射选项 | `ToneMapOptionsService` | 4 | [色调映射选项-ToneMapOptionsService.md](./系统管理/色调映射选项-ToneMapOptionsService.md) |
| 通用UI接口 | `GenericUIApiService` | 2 | [通用UI接口-GenericUIApiService.md](./系统管理/通用UI接口-GenericUIApiService.md) |
| 系统信息 | `SystemService` | 14 | [系统信息-SystemService.md](./系统管理/系统信息-SystemService.md) |
| 运行环境 | `EnvironmentService` | 8 | [运行环境-EnvironmentService.md](./系统管理/运行环境-EnvironmentService.md) |
| 转码信息 | `EncodingInfoService` | 3 | [转码信息-EncodingInfoService.md](./系统管理/转码信息-EncodingInfoService.md) |
| 字幕选项 | `SubtitleOptionsService` | 2 | [字幕选项-SubtitleOptionsService.md](./系统管理/字幕选项-SubtitleOptionsService.md) |
| FFmpeg选项 | `FfmpegOptionsService` | 2 | [FFmpeg选项-FfmpegOptionsService.md](./系统管理/FFmpeg选项-FfmpegOptionsService.md) |
| Web应用 | `WebAppService` | 4 | [Web应用-WebAppService.md](./系统管理/Web应用-WebAppService.md) |

### 媒体库与条目

媒体库浏览、条目查询/更新/检索、搜索、合集

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 合集 | `CollectionService` | 4 | [合集-CollectionService.md](./媒体库与条目/合集-CollectionService.md) |
| 媒体库结构 | `LibraryStructureService` | 10 | [媒体库结构-LibraryStructureService.md](./媒体库与条目/媒体库结构-LibraryStructureService.md) |
| 媒体库浏览 | `LibraryService` | 31 | [媒体库浏览-LibraryService.md](./媒体库与条目/媒体库浏览-LibraryService.md) |
| 内容访问 | `ContentService` | 2 | [内容访问-ContentService.md](./媒体库与条目/内容访问-ContentService.md) |
| 条目查询 | `ItemsService` | 3 | [条目查询-ItemsService.md](./媒体库与条目/条目查询-ItemsService.md) |
| 条目更新 | `ItemUpdateService` | 2 | [条目更新-ItemUpdateService.md](./媒体库与条目/条目更新-ItemUpdateService.md) |
| 条目刷新 | `ItemRefreshService` | 1 | [条目刷新-ItemRefreshService.md](./媒体库与条目/条目刷新-ItemRefreshService.md) |
| 条目元数据检索 | `ItemLookupService` | 14 | [条目元数据检索-ItemLookupService.md](./媒体库与条目/条目元数据检索-ItemLookupService.md) |
| 用户媒体库 | `UserLibraryService` | 19 | [用户媒体库-UserLibraryService.md](./媒体库与条目/用户媒体库-UserLibraryService.md) |
| 用户视图 | `UserViewsService` | 1 | [用户视图-UserViewsService.md](./媒体库与条目/用户视图-UserViewsService.md) |

### 元数据与分类

电影/剧集/人物/类型/标签/推荐等

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 标签 | `TagService` | 14 | [标签-TagService.md](./元数据与分类/标签-TagService.md) |
| 电视剧 | `TvShowsService` | 5 | [电视剧-TvShowsService.md](./元数据与分类/电视剧-TvShowsService.md) |
| 电影 | `MoviesService` | 1 | [电影-MoviesService.md](./元数据与分类/电影-MoviesService.md) |
| 分级 | `OfficialRatingService` | 1 | [分级-OfficialRatingService.md](./元数据与分类/分级-OfficialRatingService.md) |
| 类型标签 | `GenresService` | 2 | [类型标签-GenresService.md](./元数据与分类/类型标签-GenresService.md) |
| 人物 | `PersonsService` | 2 | [人物-PersonsService.md](./元数据与分类/人物-PersonsService.md) |
| 推荐 | `SuggestionsService` | 1 | [推荐-SuggestionsService.md](./元数据与分类/推荐-SuggestionsService.md) |
| 艺术家 | `ArtistsService` | 3 | [艺术家-ArtistsService.md](./元数据与分类/艺术家-ArtistsService.md) |
| 音乐类型 | `MusicGenresService` | 2 | [音乐类型-MusicGenresService.md](./元数据与分类/音乐类型-MusicGenresService.md) |
| 游戏类型 | `GameGenresService` | 2 | [游戏类型-GameGenresService.md](./元数据与分类/游戏类型-GameGenresService.md) |
| 预告片 | `TrailersService` | 1 | [预告片-TrailersService.md](./元数据与分类/预告片-TrailersService.md) |
| 制片厂 | `StudiosService` | 2 | [制片厂-StudiosService.md](./元数据与分类/制片厂-StudiosService.md) |

### 播放与流媒体

音视频流、HLS、播放状态、会话遥控、字幕

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 播放状态 | `PlaystateService` | 12 | [播放状态-PlaystateService.md](./播放与流媒体/播放状态-PlaystateService.md) |
| 动态HLS流 | `DynamicHlsService` | 14 | [动态HLS流-DynamicHlsService.md](./播放与流媒体/动态HLS流-DynamicHlsService.md) |
| 会话与遥控 | `SessionsService` | 20 | [会话与遥控-SessionsService.md](./播放与流媒体/会话与遥控-SessionsService.md) |
| 即时混播 | `InstantMixService` | 8 | [即时混播-InstantMixService.md](./播放与流媒体/即时混播-InstantMixService.md) |
| 媒体信息 | `MediaInfoService` | 6 | [媒体信息-MediaInfoService.md](./播放与流媒体/媒体信息-MediaInfoService.md) |
| 视频附加 | `VideosService` | 3 | [视频附加-VideosService.md](./播放与流媒体/视频附加-VideosService.md) |
| 视频流 | `VideoService` | 6 | [视频流-VideoService.md](./播放与流媒体/视频流-VideoService.md) |
| 视频HLS | `VideoHlsService` | 2 | [视频HLS-VideoHlsService.md](./播放与流媒体/视频HLS-VideoHlsService.md) |
| 通用音频流 | `UniversalAudioService` | 4 | [通用音频流-UniversalAudioService.md](./播放与流媒体/通用音频流-UniversalAudioService.md) |
| 一起看 | `PartyService` | 5 | [一起看-PartyService.md](./播放与流媒体/一起看-PartyService.md) |
| 音频流 | `AudioService` | 6 | [音频流-AudioService.md](./播放与流媒体/音频流-AudioService.md) |
| 字幕 | `SubtitleService` | 16 | [字幕-SubtitleService.md](./播放与流媒体/字幕-SubtitleService.md) |
| BIF缩略图 | `BifService` | 2 | [BIF缩略图-BifService.md](./播放与流媒体/BIF缩略图-BifService.md) |
| HLS分段 | `HlsSegmentService` | 2 | [HLS分段-HlsSegmentService.md](./播放与流媒体/HLS分段-HlsSegmentService.md) |

### 图像

封面/海报/远程图像

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 图像资源 | `ImageService` | 49 | [图像资源-ImageService.md](./图像/图像资源-ImageService.md) |
| 远程图像 | `RemoteImageService` | 4 | [远程图像-RemoteImageService.md](./图像/远程图像-RemoteImageService.md) |

### 直播电视

Live TV、频道

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 频道 | `ChannelService` | 1 | [频道-ChannelService.md](./直播电视/频道-ChannelService.md) |
| 直播电视 | `LiveTvService` | 61 | [直播电视-LiveTvService.md](./直播电视/直播电视-LiveTvService.md) |
| 直播流 | `LiveStreamService` | 14 | [直播流-LiveStreamService.md](./直播电视/直播流-LiveStreamService.md) |

### 播放列表与同步

Playlist、Sync

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 播放列表 | `PlaylistService` | 7 | [播放列表-PlaylistService.md](./播放列表与同步/播放列表-PlaylistService.md) |
| 同步 | `SyncService` | 25 | [同步-SyncService.md](./播放列表与同步/同步-SyncService.md) |

### 通知与活动

通知、活动日志、报表、用户活动

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 活动日志 | `ActivityLogService` | 1 | [活动日志-ActivityLogService.md](./通知与活动/活动日志-ActivityLogService.md) |
| 通知 | `NotificationsService` | 2 | [通知-NotificationsService.md](./通知与活动/通知-NotificationsService.md) |
| 用户通知 | `UserNotificationsService` | 2 | [用户通知-UserNotificationsService.md](./通知与活动/用户通知-UserNotificationsService.md) |

### DLNA

DLNA 服务与配置

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| DLNA服务端 | `DlnaServerService` | 16 | [DLNA服务端-DlnaServerService.md](./DLNA/DLNA服务端-DlnaServerService.md) |
| DLNA配置 | `DlnaService` | 6 | [DLNA配置-DlnaService.md](./DLNA/DLNA配置-DlnaService.md) |

### 用户与偏好

显示偏好等用户侧设置

| 中文 | Service | 接口数 | 文档 |
| --- | --- | ---: | --- |
| 显示偏好 | `DisplayPreferencesService` | 5 | [显示偏好-DisplayPreferencesService.md](./用户与偏好/显示偏好-DisplayPreferencesService.md) |

## 单接口文档格式（对齐 115）

每个接口包含：

- 基本信息（Path / Method / 描述）
- 认证要求
- 请求参数（Headers / Path / Query / Body）
- 返回数据（状态码 + Schema 字段）

## 与本项目的关系

当前扩展主要通过 ApiKey 调用：

```http
GET {server}/Items?Recursive=true&IncludeItemTypes=Movie&Fields=Path,PrimaryImageAspectRatio,ImageTags&api_key=***
```

对应文档：`媒体库与条目/条目查询-ItemsService.md` 中的 `getItems`。

## 重新生成

```powershell
# 用目标 Emby（建议与目录版本号一致）覆盖 openapi
curl.exe -L -o reference/emby-api-4.9.5.0/openapi.json "http://YOUR_EMBY:8096/openapi.json"

# 重新生成全部分类 Markdown
node reference/emby-api-4.9.5.0/_generate.cjs
```

Server 大版本升级时，建议复制/改名为 `reference/emby-api-<新版本>/`，避免不同版本文档混在同一目录。
