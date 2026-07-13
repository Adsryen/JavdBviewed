# 字幕（Subtitle）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：10

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/FallbackFont/Fonts` | GetFallbackFontList | Gets a list of available fallback font files. |
| GET | `/FallbackFont/Fonts/{name}` | GetFallbackFont | Gets a fallback font file. |
| GET | `/Items/{itemId}/RemoteSearch/Subtitles/{language}` | SearchRemoteSubtitles | Search remote subtitles. |
| POST | `/Items/{itemId}/RemoteSearch/Subtitles/{subtitleId}` | DownloadRemoteSubtitles | Downloads a remote subtitle. |
| GET | `/Providers/Subtitles/Subtitles/{subtitleId}` | GetRemoteSubtitles | Gets the remote subtitles. |
| GET | `/Videos/{itemId}/{mediaSourceId}/Subtitles/{index}/subtitles.m3u8` | GetSubtitlePlaylist | Gets an HLS subtitle playlist. |
| POST | `/Videos/{itemId}/Subtitles` | UploadSubtitle | Upload an external subtitle file. |
| DELETE | `/Videos/{itemId}/Subtitles/{index}` | DeleteSubtitle | Deletes an external subtitle file. |
| GET | `/Videos/{routeItemId}/{routeMediaSourceId}/Subtitles/{routeIndex}/{routeStartPositionTicks}/Stream.{routeFormat}` | GetSubtitleWithTicks | Gets subtitles in a specified format. |
| GET | `/Videos/{routeItemId}/{routeMediaSourceId}/Subtitles/{routeIndex}/Stream.{routeFormat}` | GetSubtitle | Gets subtitles in a specified format. |

---

## GetFallbackFontList

### 基本信息
**Path：** GET 服务器地址 + /FallbackFont/Fonts

**Method：** GET

**接口描述：** Gets a list of available fallback font files.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Information retrieved. | FontFile[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetFallbackFont

### 基本信息
**Path：** GET 服务器地址 + /FallbackFont/Fonts/{name}

**Method：** GET

**接口描述：** Gets a fallback font file.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | The name of the fallback font file to get. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Fallback font file retrieved. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SearchRemoteSubtitles

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/RemoteSearch/Subtitles/{language}

**Method：** GET

**接口描述：** Search remote subtitles.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| language | 是 | string |  | The language of the subtitles. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| isPerfectMatch | 否 | boolean |  | Optional. Only show subtitles which are a perfect match. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Subtitles retrieved. | RemoteSubtitleInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DownloadRemoteSubtitles

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}/RemoteSearch/Subtitles/{subtitleId}

**Method：** POST

**接口描述：** Downloads a remote subtitle.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| subtitleId | 是 | string |  | The subtitle id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Subtitle downloaded. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetRemoteSubtitles

### 基本信息
**Path：** GET 服务器地址 + /Providers/Subtitles/Subtitles/{subtitleId}

**Method：** GET

**接口描述：** Gets the remote subtitles.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| subtitleId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | File returned. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSubtitlePlaylist

### 基本信息
**Path：** GET 服务器地址 + /Videos/{itemId}/{mediaSourceId}/Subtitles/{index}/subtitles.m3u8

**Method：** GET

**接口描述：** Gets an HLS subtitle playlist.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| index | 是 | integer |  | The subtitle stream index. |
| mediaSourceId | 是 | string |  | The media source id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| segmentLength | 是 | integer |  | The subtitle segment length. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Subtitle playlist retrieved. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UploadSubtitle

### 基本信息
**Path：** POST 服务器地址 + /Videos/{itemId}/Subtitles

**Method：** POST

**接口描述：** Upload an external subtitle file.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item the subtitle belongs to. |


**Body**

- 是否必须：是
- 描述：The request body.
- Content-Type：`application/json`
- Schema：`UploadSubtitleDto`
- Content-Type：`text/json`
- Schema：`UploadSubtitleDto`
- Content-Type：`application/*+json`
- Schema：`UploadSubtitleDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Subtitle uploaded. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DeleteSubtitle

### 基本信息
**Path：** DELETE 服务器地址 + /Videos/{itemId}/Subtitles/{index}

**Method：** DELETE

**接口描述：** Deletes an external subtitle file.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| index | 是 | integer |  | The index of the subtitle file. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Subtitle deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSubtitleWithTicks

### 基本信息
**Path：** GET 服务器地址 + /Videos/{routeItemId}/{routeMediaSourceId}/Subtitles/{routeIndex}/{routeStartPositionTicks}/Stream.{routeFormat}

**Method：** GET

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| routeItemId | 是 | string |  | The (route) item id. |
| routeMediaSourceId | 是 | string |  | The (route) media source id. |
| routeIndex | 是 | integer |  | The (route) subtitle stream index. |
| routeStartPositionTicks | 是 | integer |  | The (route) start position of the subtitle in ticks. |
| routeFormat | 是 | string |  | The (route) format of the returned subtitle. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 否 | string |  | The item id. |
| mediaSourceId | 否 | string |  | The media source id. |
| index | 否 | integer |  | The subtitle stream index. |
| startPositionTicks | 否 | integer |  | The start position of the subtitle in ticks. |
| format | 否 | string |  | The format of the returned subtitle. |
| endPositionTicks | 否 | integer |  | Optional. The end position of the subtitle in ticks. |
| copyTimestamps | 否 | boolean | false | Optional. Whether to copy the timestamps. |
| addVttTimeMap | 否 | boolean | false | Optional. Whether to add a VTT time map. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | File returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSubtitle

### 基本信息
**Path：** GET 服务器地址 + /Videos/{routeItemId}/{routeMediaSourceId}/Subtitles/{routeIndex}/Stream.{routeFormat}

**Method：** GET

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| routeItemId | 是 | string |  | The (route) item id. |
| routeMediaSourceId | 是 | string |  | The (route) media source id. |
| routeIndex | 是 | integer |  | The (route) subtitle stream index. |
| routeFormat | 是 | string |  | The (route) format of the returned subtitle. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 否 | string |  | The item id. |
| mediaSourceId | 否 | string |  | The media source id. |
| index | 否 | integer |  | The subtitle stream index. |
| format | 否 | string |  | The format of the returned subtitle. |
| endPositionTicks | 否 | integer |  | Optional. The end position of the subtitle in ticks. |
| copyTimestamps | 否 | boolean | false | Optional. Whether to copy the timestamps. |
| addVttTimeMap | 否 | boolean | false | Optional. Whether to add a VTT time map. |
| startPositionTicks | 否 | integer | 0 | The start position of the subtitle in ticks. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | File returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

